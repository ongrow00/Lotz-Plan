<script lang="ts">
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart } from '$lib/services/analytics.service';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';

	const firstQuestion = $derived(computeVisibleQuestions(quizConfig.questions, {})[0]);

	let transitioning = $state(false);

	async function startQuiz() {
		if (transitioning) return;
		transitioning = true;
		await new Promise((r) => setTimeout(r, 450));
		quizStore.start();
		trackQuizStart();
		if (firstQuestion) goto(`/plan/${firstQuestion.id}`);
	}
</script>

<svelte:head>
	<title>Lotz</title>
</svelte:head>

<!-- Overlay de transição: fade para preto -->
<div
	class="fixed inset-0 z-50 bg-bg pointer-events-none transition-opacity duration-[450ms] ease-in-out"
	style="opacity: {transitioning ? 1 : 0}"
></div>

<div
	class="min-h-screen flex flex-col bg-bg transition-[opacity,transform] duration-[350ms] ease-in-out"
	style="opacity: {transitioning ? 0 : 1}; transform: {transitioning ? 'scale(0.97)' : 'scale(1)'}"
>
	<!-- Logo fixada no topo -->
	<header class="flex justify-center pt-6 px-4">
		<Logo />
	</header>

	<!-- Conteúdo centralizado (padding-bottom para não ficar atrás do rodapé fixo) -->
	<main class="flex-1 flex items-center justify-center px-4 pt-[50px] pb-40">
		<div class="text-center max-w-lg space-y-6">
			<img
				src="/intro-pedro.png"
				alt="Foto de perfil"
				class="w-[11.2rem] h-[11.2rem] md:w-[14rem] md:h-[14rem] mx-auto object-cover"
				loading="eager"
				fetchpriority="high"
			/>
			<h1 class="text-2xl md:text-3xl font-normal text-heading leading-none -mt-6 relative z-10">
				Receba um <strong class="font-bold text-accent">protocolo de treino</strong> criado <strong class="font-bold text-accent">milimetricamente</strong> para o seu <strong class="font-bold text-accent">corpo</strong> e para os seus <strong class="font-bold text-accent">objetivos</strong>.
			</h1>
			<p class="text-sm text-body leading-relaxed">
				Responda algumas perguntas e receba um protocolo feito para o seu corpo que finalmente vai funcionar para você.
			</p>
			<div class="flex justify-center">
				<SocialProof />
			</div>
		</div>
	</main>

</div>

<!-- Botão fixo no rodapé — fora do div com transform para manter position:fixed real -->
<div class="fixed bottom-0 left-0 right-0 z-[60] bg-bg">
	<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
	<button
		type="button"
		onclick={startQuiz}
		class="cta-shimmer w-full rounded-xl bg-accent transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg relative overflow-hidden flex items-center justify-between pl-6 pr-2 py-2"
	>
		<span class="relative z-10 font-bold text-base text-bg">Iniciar Protocolo</span>
		<!-- Bloco escuro com ícone raio -->
		<div class="relative z-10 w-12 h-12 rounded-lg bg-bg flex items-center justify-center flex-shrink-0">
			<svg class="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
		</div>
	</button>
		<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3">
			<p class="flex items-center gap-1.5 text-[10px] text-white">
				<svg class="w-3 h-3 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
				</svg>
				100% seguro
			</p>
			<p class="flex items-center gap-1.5 text-[10px] text-white">
				<svg class="w-3 h-3 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
				</svg>
				Limitado a 1 por pessoa
			</p>
		</div>
	</div>
</div>

<style>
	.cta-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 35%,
			rgba(255, 255, 255, 0.25) 50%,
			transparent 65%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: shimmer 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
