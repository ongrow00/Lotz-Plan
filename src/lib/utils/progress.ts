import type { Question } from '$lib/data/types';

export function calculateProgress(currentQuestion: Question, visibleQuestions: Question[]): number {
	const index = visibleQuestions.findIndex((q) => q.id === currentQuestion.id);
	if (index === -1 || visibleQuestions.length === 0) return 0;
	return Math.round(((index + 1) / visibleQuestions.length) * 100);
}

export function calculateProgressByIndex(currentIndex: number, total: number): number {
	if (total === 0) return 0;
	return Math.round(((currentIndex + 1) / total) * 100);
}
