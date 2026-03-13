<script lang="ts">
	import type { CategoryKey, Scores } from '$lib/data/types';

	interface Props {
		scores: Scores;
		class?: string;
	}

	let { scores, class: className = '' }: Props = $props();

	const labels: Record<CategoryKey, string> = {
		A: 'Autonomia',
		B: 'Segurança',
		C: 'Aprendizado',
		D: 'Liderança',
		E: 'Inovação',
		F: 'Relacionamento'
	};

	const maxScore = $derived(Math.max(...Object.values(scores), 1));

	const entries = $derived(
		(Object.keys(scores) as CategoryKey[]).map((key) => ({
			key,
			label: labels[key],
			value: scores[key],
			percent: Math.round((scores[key] / maxScore) * 100)
		})).sort((a, b) => b.value - a.value)
	);
</script>

<div class="space-y-3 {className}">
	{#each entries as entry (entry.key)}
		<div class="flex items-center gap-3">
			<span class="w-24 text-xs font-medium text-muted shrink-0">{entry.label}</span>
			<div class="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
				<div
					class="h-full bg-accent rounded-full transition-all duration-700"
					style="width: {entry.percent}%"
				></div>
			</div>
			<span class="text-xs font-semibold text-body w-4 text-right">{entry.value}</span>
		</div>
	{/each}
</div>
