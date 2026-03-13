<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		currentKg: number;
		goalKg: number;
		weeks: number;
		/** Oculta os rótulos "Semana 1" / "Semana N" no eixo */
		hideAxisLabels?: boolean;
	}

	let { currentKg, goalKg, weeks, hideAxisLabels = false }: Props = $props();

	const weeksDisplay = Math.max(1, weeks);
	const CHART_HEIGHT = 200;
	const CHART_WIDTH = 340;
	const PAD_X = 0;
	const PAD_Y_TOP = 44;
	const PAD_Y_BOTTOM = 32;
	const graphWidth = CHART_WIDTH - PAD_X * 2;
	const graphHeight = CHART_HEIGHT - PAD_Y_TOP - PAD_Y_BOTTOM;

	const minKg = Math.min(currentKg, goalKg);
	const maxKg = Math.max(currentKg, goalKg);
	const range = maxKg - minKg || 1;
	const yScale = (kg: number) => PAD_Y_TOP + (maxKg - kg) / range * graphHeight;
	const xStart = PAD_X;
	const xEnd = CHART_WIDTH - PAD_X;
	const yStart = yScale(currentKg);
	const yEnd = yScale(goalKg);
	const cp1X = xStart + graphWidth * 0.35;
	const cp1Y = yStart;
	const cp2X = xEnd - graphWidth * 0.35;
	const cp2Y = yEnd;
	const pathD = `M ${xStart} ${yStart} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${xEnd} ${yEnd}`;
	const areaD = `${pathD} L ${xEnd} ${PAD_Y_TOP + graphHeight} L ${xStart} ${PAD_Y_TOP + graphHeight} Z`;

	const gridLines = [1, 2, 3, 4];
	const dotRadius = 7;
	const labelWidth = 52;
	const labelHeight = 24;
	const axisPadPercent = (PAD_X / CHART_WIDTH) * 100;

	let lineEl: SVGPathElement | undefined = $state();
	let totalLength = $state(1000);
	let animate = $state(false);

	onMount(() => {
		if (lineEl) totalLength = lineEl.getTotalLength();
		requestAnimationFrame(() => requestAnimationFrame(() => { animate = true; }));
	});
</script>

<div
	class="flex flex-col w-full"
	role="img"
	aria-label="Gráfico de evolução do peso da semana 1 à semana {weeksDisplay}"
>
	<div class="relative w-full" style="min-height: {CHART_HEIGHT}px;">
		<svg
			width="100%"
			height={CHART_HEIGHT}
			viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
			class="overflow-visible block"
			fill="none"
		>
		<defs>
			<linearGradient id="weight-chart-gradient" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.2" />
				<stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
			</linearGradient>
			<filter id="weight-line-glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur stdDeviation="2" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
			<filter id="weight-dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="var(--color-accent)" flood-opacity="0.4" />
			</filter>
			<clipPath id="weight-area-reveal">
				<rect
					x={xStart}
					y="0"
					width={animate ? (xEnd - xStart) : 0}
					height={CHART_HEIGHT + 50}
					class="chart-clip-rect"
				/>
			</clipPath>
		</defs>

		<!-- Grid horizontal -->
		<g
			stroke="var(--color-line)" stroke-width="0.5" stroke-opacity="0.5"
			class="chart-grid"
			class:chart-animate={animate}
		>
			{#each gridLines as _, i}
				{@const y = PAD_Y_TOP + (i + 1) * (graphHeight / 5)}
				<line x1={xStart} y1={y} x2={CHART_WIDTH - PAD_X} y2={y} stroke-dasharray="6 4" />
			{/each}
		</g>

		<!-- Área preenchida sob a curva -->
		<path
			d={areaD}
			fill="url(#weight-chart-gradient)"
			clip-path="url(#weight-area-reveal)"
		/>

		<!-- Linha de evolução com glow -->
		<path
			bind:this={lineEl}
			d={pathD}
			stroke="var(--color-accent)"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			filter="url(#weight-line-glow)"
			class="chart-line"
			style="stroke-dasharray: {totalLength}; stroke-dashoffset: {animate ? 0 : totalLength};"
		/>

		<!-- Marcador início -->
		<g class="chart-marker-start" class:chart-animate={animate}>
			<circle
				cx={xStart}
				cy={yStart}
				r={dotRadius + 5}
				class="fill-[var(--color-accent)]"
				opacity="0.2"
			/>
			<circle
				cx={xStart}
				cy={yStart}
				r={dotRadius}
				class="fill-[var(--color-accent)] stroke-[var(--color-bg)]"
				stroke-width="2"
				filter="url(#weight-dot-shadow)"
			/>
			<rect
				x={xStart - labelWidth / 2}
				y={yStart - labelHeight - 10}
				width={labelWidth}
				height={labelHeight}
				rx="8"
				ry="8"
				class="fill-surface-2 stroke-line/60"
				stroke-width="0.5"
			/>
			<text
				x={xStart}
				y={yStart - labelHeight / 2 - 2}
				text-anchor="middle"
				class="fill-heading text-[13px] font-semibold tabular-nums"
			>
				{currentKg} kg
			</text>
		</g>

		<!-- Marcador fim -->
		<g class="chart-marker-end" class:chart-animate={animate}>
			<circle
				cx={xEnd}
				cy={yEnd}
				r={dotRadius + 5}
				class="fill-[var(--color-accent)]"
				opacity="0.2"
			/>
			<circle
				cx={xEnd}
				cy={yEnd}
				r={dotRadius}
				class="fill-[var(--color-accent)] stroke-[var(--color-bg)]"
				stroke-width="2"
				filter="url(#weight-dot-shadow)"
			/>
			<rect
				x={xEnd - labelWidth / 2}
				y={yEnd - labelHeight - 10}
				width={labelWidth}
				height={labelHeight}
				rx="8"
				ry="8"
				class="fill-surface-2 stroke-line/60"
				stroke-width="0.5"
			/>
			<text
				x={xEnd}
				y={yEnd - labelHeight / 2 - 2}
				text-anchor="middle"
				class="fill-heading text-[13px] font-semibold tabular-nums"
			>
				{goalKg} kg
			</text>
		</g>
	</svg>
	</div>
	{#if !hideAxisLabels}
		<div
			class="flex justify-between w-full -mt-1 chart-axis"
			class:chart-animate={animate}
			style="padding-left: {axisPadPercent}%; padding-right: {axisPadPercent}%;"
		>
			<span class="text-xs font-medium text-muted tracking-wide">Semana 1</span>
			<span class="text-xs font-medium text-muted tracking-wide">Semana {weeksDisplay}</span>
		</div>
	{/if}
</div>

<style>
	.chart-line {
		transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.15s;
	}

	.chart-clip-rect {
		transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.15s;
	}

	.chart-grid {
		opacity: 0;
		transition: opacity 0.5s ease-out;
	}
	.chart-grid.chart-animate {
		opacity: 1;
	}

	.chart-marker-start {
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
	}
	.chart-marker-start.chart-animate {
		opacity: 1;
	}

	.chart-marker-end {
		opacity: 0;
		transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.15s;
	}
	.chart-marker-end.chart-animate {
		opacity: 1;
	}

	.chart-axis {
		opacity: 0;
		transition: opacity 0.4s ease-out 1.2s;
	}
	.chart-axis.chart-animate {
		opacity: 1;
	}
</style>
