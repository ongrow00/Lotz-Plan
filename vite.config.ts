import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'quiz-data': [
						'$lib/data/questions',
						'$lib/data/profiles',
						'$lib/data/quiz.config'
					],
					'quiz-logic': [
						'$lib/utils/scoring',
						'$lib/utils/branching',
						'$lib/utils/progress',
						'$lib/utils/validation'
					]
				}
			}
		}
	}
});
