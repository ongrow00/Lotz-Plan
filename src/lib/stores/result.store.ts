import { derived } from 'svelte/store';
import { quizStore } from './quiz.store';
import { quizConfig } from '$lib/data/quiz.config';
import type { ResultProfile } from '$lib/data/types';
import { matchProfile } from '$lib/utils/scoring';

export const resultProfile = derived(quizStore, ($quiz): ResultProfile | null => {
	const hasAnswers = Object.keys($quiz.answers).length > 0;
	if (!hasAnswers) return null;
	return matchProfile($quiz.scores, quizConfig.profiles);
});
