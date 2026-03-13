import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { quizConfig } from '$lib/data/quiz.config';
import type { Answers, CategoryKey, Question, QuizState, Scores } from '$lib/data/types';
import { computeVisibleQuestions } from '$lib/utils/branching';
import { calculateScores } from '$lib/utils/scoring';

const SESSION_KEY = 'lotz-quiz-state';

const INITIAL_SCORES: Scores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

const INITIAL_STATE: QuizState = {
	currentQuestionId: null,
	answers: {},
	scores: { ...INITIAL_SCORES },
	visitedQuestions: [],
	startedAt: null,
	completedAt: null
};

function loadFromSession(): QuizState {
	if (!browser) return INITIAL_STATE;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return INITIAL_STATE;
		return JSON.parse(raw) as QuizState;
	} catch {
		return INITIAL_STATE;
	}
}

function saveToSession(state: QuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createQuizStore() {
	const { subscribe, set, update } = writable<QuizState>(loadFromSession());

	function persist(state: QuizState): QuizState {
		saveToSession(state);
		return state;
	}

	return {
		subscribe,

		start() {
			const visible = computeVisibleQuestions(quizConfig.questions, {});
			const firstQuestion = visible[0] ?? null;
			update((s) =>
				persist({
					...INITIAL_STATE,
					currentQuestionId: firstQuestion?.id ?? null,
					startedAt: Date.now()
				})
			);
		},

		answer(questionId: string, value: string | string[]) {
			update((s) => {
				const newAnswers = { ...s.answers, [questionId]: value };
				const newScores = calculateScores(newAnswers, quizConfig.questions);

				// Mark as visited if not already
				const visited = s.visitedQuestions.includes(questionId)
					? s.visitedQuestions
					: [...s.visitedQuestions, questionId];

				return persist({ ...s, answers: newAnswers, scores: newScores, visitedQuestions: visited });
			});
		},

		goTo(questionId: string) {
			update((s) => persist({ ...s, currentQuestionId: questionId }));
		},

		complete() {
			update((s) => persist({ ...s, completedAt: Date.now() }));
		},

		reset() {
			const fresh = { ...INITIAL_STATE };
			saveToSession(fresh);
			set(fresh);
		}
	};
}

export const quizStore = createQuizStore();

/** Bumped when navigation has ended (afterNavigate). QuizShell uses this to clear advancing lock. */
export const quizNavigationEnded = writable(0);

// --- Derived stores ---

export const visibleQuestions = derived(quizStore, ($quiz) =>
	computeVisibleQuestions(quizConfig.questions, $quiz.answers)
);

export const currentQuestion = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): Question | null =>
		$visible.find((q) => q.id === $quiz.currentQuestionId) ?? null
);

export const currentIndex = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): number => $visible.findIndex((q) => q.id === $quiz.currentQuestionId)
);

const MR_IDS = ['mr-1', 'mr-2', 'mr-3', 'mr-5'] as const;

export const progressPercent = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): number => {
		if ($visible.length === 0 || $index < 0) return 0;
		const mrIndices = MR_IDS.map((id) => $visible.findIndex((q) => q.id === id)).filter((i) => i >= 0);
		if (mrIndices.length === 0) {
			return Math.round((($index + 1) / $visible.length) * 100);
		}
		// When exactly on an MR screen, return the exact checkpoint % so the dot shows complete
		const currentId = $visible[$index]?.id;
		const mrSegment = MR_IDS.findIndex((id) => id === currentId);
		const totalSegments = 5; // 4 checkpoints (mr-1, mr-2, mr-3, mr-5) → 5 segments
		if (mrSegment >= 0) {
			return ((mrSegment + 1) / totalSegments) * 100;
		}
		// 5 segments: 0→MR-1, MR-1→MR-2, MR-2→MR-3, MR-3→MR-5, MR-5→end
		let segment = 0;
		if ($index <= mrIndices[0]) segment = 0;
		else if (mrIndices[1] >= 0 && $index <= mrIndices[1]) segment = 1;
		else if (mrIndices[2] >= 0 && $index <= mrIndices[2]) segment = 2;
		else if (mrIndices[3] >= 0 && $index <= mrIndices[3]) segment = 3;
		else segment = 4;
		const segmentStart = segment === 0 ? 0 : mrIndices[segment - 1] + 1;
		const segmentEnd = segment < 4 ? mrIndices[segment] : $visible.length - 1;
		const segmentSize = segmentEnd - segmentStart;
		const progressWithin = segmentSize > 0 ? ($index - segmentStart) / segmentSize : 1;
		const percent = ((segment + progressWithin) / totalSegments) * 100;
		return Math.min(100, percent);
	}
);

export const isFirstQuestion = derived(currentIndex, ($index) => $index === 0);

export const isLastQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]) => $index === $visible.length - 1
);

export const nextQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => $visible[$index + 1] ?? null
);

export const prevQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => ($index > 0 ? $visible[$index - 1] : null)
);
