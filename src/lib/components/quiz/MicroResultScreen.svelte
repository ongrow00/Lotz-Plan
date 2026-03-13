<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Question } from '$lib/data/types';
	import type { Answers } from '$lib/data/types';
	import {
		getMicroResultData,
		type NexoCentralizadaMr1,
		type NexoCentralizadaMr2,
		type NexoCentralizadaMr3,
	} from '$lib/utils/microresult-data';
	import { quizConfig } from '$lib/data/quiz.config';
	import BodyRadarChart from './BodyRadarChart.svelte';
	import ProtocolComparisonChart from './ProtocolComparisonChart.svelte';
	import WeightLossLineChart from './WeightLossLineChart.svelte';

	const CONTAGEM_DURATION_MS = 2000;
	const CONTAGEM_TARGET = 3;

	// ─── Timing da cascata ────────────────────────────────────────────────────
	// Elementos se sobrepõem (gap < duração) → tela nunca para, ritmo contínuo.
	// Pausa dramática antes do botão (botão controlado pelo QuizShell).
	const DUR   = 600;   // duração de cada texto entrando
	const DUR_C = 900;   // duração dos gráficos (elemento maior, merece mais tempo)
	const OUT   = 200;   // saída rápida
	const Y     = 12;    // deslocamento vertical sutil (px)
	const GAP   = 250;   // intervalo entre inícios (overlap = DUR - GAP = 350ms)
	// Delays calculados: badge=0, título=250, parágrafo=500, chart=800
	// Chart termina em 800+900=1700ms. Botão entra em 2800ms (pausa intencional ~1s).

	interface Props {
		question: Question;
		answers: Answers;
	}

	let { question, answers }: Props = $props();

	const data = $derived(getMicroResultData(question.id, answers, quizConfig.questions));
	const isMr1 = question.id === 'mr-1';
	const contagemCtx = getContext<{ value: number }>('quizContagem');
	const mr2Contagem = contagemCtx?.value ?? 7;
	const mr3Contagem = contagemCtx?.value ?? 10;
	const mr5Contagem = contagemCtx?.value ?? 13;

	let mr1DisplayCount = $state(0);

	onMount(() => {
		if (!isMr1) return;
		let cancelled = false;
		const start = performance.now();
		let rafId: number;
		function tick(now: number) {
			if (cancelled) return;
			const elapsed = now - start;
			const t = Math.min(1, elapsed / CONTAGEM_DURATION_MS);
			const eased = 1 - (1 - t) * (1 - t);
			mr1DisplayCount = Math.round(eased * CONTAGEM_TARGET);
			if (t < 1) rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => { cancelled = true; cancelAnimationFrame(rafId); };
	});
</script>

{#if data.nexo}
	<div class="flex flex-col items-center text-center px-4 py-8 max-w-md mx-auto gap-1">

		{#if data.nexo?.variant === 'mr-1'}
			{@const focusAreas = answers['focus_areas']}
			{@const nexo1 = data.nexo as NexoCentralizadaMr1}
			<div class="flex flex-col items-center text-center gap-1 w-full">
				<!--
					Cascata mr-1 (~3.5s):
					badge(0) → título(250) → parágrafo(500) → chart(800) ↔ contagem 0→3 roda até 2000ms → botão(2800, QuizShell)
				-->
				<div
					class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
					aria-label="Contagem"
					in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
						<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span class="text-sm text-white font-medium tabular-nums min-w-[1ch] inline-block text-center">
						{mr1DisplayCount}
					</span>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<h2 class="text-2xl font-extrabold text-heading leading-none">
						Primeiro passo para <span class="text-accent">{nexo1.headlineHighlight}</span> foi concluído.
					</h2>
				</div>

				<div
					class="flex flex-col items-center text-center w-full"
					in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<p class="text-body text-sm leading-none mt-[10px] mb-[10px]">
						Para <span class="text-accent">{nexo1.paragraphHighlights.sexo}</span> com seu objetivo, o erro mais comum é seguir um plano genérico. O seu plano vai ser construído para você ficar <span class="text-accent">{nexo1.paragraphHighlights.futuro}</span> do jeito certo.
					</p>
				</div>

				<div
					class="flex flex-col items-center w-full"
					in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<BodyRadarChart selected={Array.isArray(focusAreas) ? focusAreas : focusAreas ? [focusAreas] : []} />
				</div>
			</div>

		{:else if data.nexo?.variant === 'mr-2'}
			{@const nexo2 = data.nexo as NexoCentralizadaMr2 | undefined}
			{#if nexo2}
				<div class="flex flex-col items-center text-center gap-1 w-full">
					<!--
						Cascata mr-2 (~3.5s / ~3.8s com cardio):
						badge(0) → título(250) → parágrafo(500) → chart(800) → [cardio(1400)] → botão(2800/3200, QuizShell)
					-->
					<div
						class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
						aria-label="Contagem"
						in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="text-sm text-white font-medium tabular-nums min-w-[1ch] inline-block text-center">{mr2Contagem}</span>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<h2 class="text-2xl font-extrabold text-heading leading-none">
							{nexo2?.headlineSubject ?? 'Pessoas'} que treinam <span class="text-accent">{nexo2?.headlineLocalFragment}</span> com nosso protocolo evoluem <span class="text-accent">2.3x</span> mais rápido.
						</h2>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<p class="text-body text-sm leading-none mt-[10px] mb-[40px] pb-[25px]">
							Seu treino vai ser montado especificamente pra {nexo2?.paragraphLocalFragment}, em <span class="text-accent">{nexo2?.paragraphTempo}</span> por dia{#if nexo2?.paragraphTempoPerWeek}, <span class="text-accent">{nexo2.paragraphTempoPerWeek}</span>{/if}. Cada exercício, cada série, cada minuto tem um motivo.
						</p>
					</div>

					<div
						class="w-full flex flex-col gap-0"
						in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<ProtocolComparisonChart />
						{#if nexo2?.showCardioBox}
							<div
								class="w-full rounded-b-xl bg-surface px-3 py-2.5 -mt-px"
								in:fly={{ y: Y, duration: DUR, delay: GAP * 3 + 50 + 600, easing: cubicOut }}
								out:fade={{ duration: OUT }}
							>
								<div class="flex items-center gap-0 text-left">
									<span class="shrink-0 flex items-center justify-center text-muted mx-[10px]" aria-hidden="true">
										<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</span>
									<div class="min-w-0">
										<h3 class="text-sm font-bold text-body leading-tight">Plano de Cardio</h3>
										<p class="text-xs text-muted leading-snug mt-0.5">
											Vamos integrar um plano de cardio no protocolo pra acelerar sua performance.
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

		{:else if data.nexo?.variant === 'mr-3'}
			{@const nexo3 = data.nexo as NexoCentralizadaMr3 | undefined}
			{#if nexo3}
				<div class="flex flex-col items-center text-center gap-1 w-full">
					<!--
						Cascata mr-3 (~3.5s):
						badge(0) → título(250) → parágrafo(500) → chart(800) → botão(2800, QuizShell)
					-->
					<div
						class="contagem-badge-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2"
						aria-label="Contagem"
						in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="text-sm text-white font-medium tabular-nums min-w-[1ch] inline-block text-center">{mr3Contagem}</span>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<h2 class="text-2xl font-extrabold text-heading leading-6">
							Vamos montar um protocolo personalizado para você
							<span class="text-accent">
								{nexo3?.isWeightLoss ? 'perder' : 'ganhar'} até {nexo3?.kgToReach ?? 0}kg.
							</span>
						</h2>
					</div>

					<div
						class="flex flex-col items-center text-center w-full"
						in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<p class="text-body text-sm leading-[14px] mt-[10px] mb-[25px]">
							Em média, <span class="text-accent">{nexo3?.sexo ?? 'pessoas'}</span>
							{#if nexo3 != null && nexo3.idade != null}
								com aproximadamente <span class="text-accent">{nexo3.idade} anos</span>
							{:else}
								com um perfil semelhante ao seu
							{/if}
							conseguem <span class="text-accent">{nexo3?.isWeightLoss ? 'emagrecer' : 'evoluir'}</span> até
							<span class="text-accent">{nexo3?.kgToReach ?? 0} kg</span>
							em aproximadamente
							<span class="text-accent">{nexo3?.weeksEstimate ?? 12} semanas</span>
							seguindo o protocolo.
						</p>
					</div>

					<div
						class="flex flex-col items-center w-full mt-2"
						in:fly={{ y: Y, duration: DUR_C, delay: GAP * 3 + 50, easing: cubicOut }}
						out:fade={{ duration: OUT }}
					>
						<WeightLossLineChart
							currentKg={nexo3?.currentKg ?? 0}
							goalKg={nexo3?.goalKg ?? 0}
							weeks={nexo3?.weeksEstimate ?? 12}
						/>
					</div>
				</div>
			{/if}
		{/if}
	</div>

{:else if data.lifestyleFactors?.factors}
	{@const lf = data.lifestyleFactors}
	<div class="flex flex-col gap-6 w-full max-w-md mx-auto">
		<!--
			Cascata mr-5 (~3.5s):
			badge(0) → título+subtítulo(250) → card0(600) → card1(800) → card2(1000) → botão(2800, QuizShell)
			Cada card entra individualmente → efeito de "desvendar" muito mais rico.
		-->
		<div
			class="contagem-badge-shimmer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent mb-2 w-fit self-center"
			aria-label="Contagem"
			in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
			out:fade={{ duration: OUT }}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span class="text-sm text-white font-medium tabular-nums min-w-[1ch] inline-block text-center">{mr5Contagem}</span>
		</div>

		<div
			class="space-y-2 text-center"
			in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }}
			out:fade={{ duration: OUT }}
		>
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
				Identificamos fatores do seu estilo de vida que influenciam seu <span class="text-accent">{lf.goalType}</span>.
			</h2>
			<p class="text-sm text-muted leading-[14px]">
				{lf.subtitle}
			</p>
		</div>

		<!-- Cada card entra individualmente com stagger de 200ms entre eles -->
		<div class="grid grid-cols-3 gap-x-4 gap-y-6">
			{#each (lf?.factors ?? []) as factor, i (factor.category)}
				<div
					class="flex flex-col items-center text-center gap-1.5 rounded-xl border border-line/50 pt-[25px] pb-[25px] px-3"
					in:fly={{ y: Y, duration: DUR, delay: 600 + i * 200, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<span class="flex items-center justify-center w-10 h-10 text-accent shrink-0" aria-hidden="true">
						{#if factor.category === 'sono'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
						{:else if factor.category === 'movimento'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
						{:else if factor.category === 'energia'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
						{/if}
					</span>
					<span class="text-sm font-medium text-heading">{factor.label}</span>
					<div class="flex items-center justify-center gap-1.5">
						<span
							class="shrink-0 w-2.5 h-2.5 rounded-full {factor.status === 'green'
							? 'bg-[var(--color-accent)]'
							: factor.status === 'orange'
								? 'bg-[var(--color-farol-orange)]'
								: 'bg-[var(--color-farol-red)]'}"
							aria-hidden="true"
						></span>
						<span class="text-sm text-body">{factor.value}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

{:else}
	<div class="flex flex-col gap-6">
		<div class="space-y-3">
			<div in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }} out:fade={{ duration: OUT }}>
				<h2 class="text-2xl font-extrabold text-heading leading-tight">{data.title}</h2>
			</div>
			{#if data.bullets.length > 0}
				<div in:fly={{ y: Y, duration: DUR, delay: GAP, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<ul class="list-none space-y-2 text-body">
						{#each data.bullets as bullet}
							<li class="leading-relaxed">
								{@html bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.insight}
				<div in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<p class="text-body leading-relaxed mt-3 italic">"{data.insight}"</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.contagem-badge-shimmer {
		position: relative;
		overflow: hidden;
	}
	.contagem-badge-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 60%;
		background: linear-gradient(
			100deg,
			transparent 0%,
			transparent 40%,
			rgba(255, 255, 255, 0.12) 50%,
			transparent 60%,
			transparent 100%
		);
		animation: contagem-badge-shimmer 3.5s ease-in-out infinite;
		pointer-events: none;
		border-radius: inherit;
	}
	@keyframes contagem-badge-shimmer {
		0%   { transform: translateX(-100%) skewX(-8deg); }
		100% { transform: translateX(200%)  skewX(-8deg); }
	}
</style>
