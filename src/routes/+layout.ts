import type { LayoutLoad } from './$types';
import { quizConfig } from '$lib/data/quiz.config';

// Preload quiz config on every route — tiny cost, ensures data is available
export const load: LayoutLoad = () => {
	return {
		totalQuestions: quizConfig.questions.length
	};
};
