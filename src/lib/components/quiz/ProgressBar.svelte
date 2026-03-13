<script lang="ts">
	interface Props {
		percent: number;
		class?: string;
	}

	let { percent, class: className = '' }: Props = $props();

	const clamped = $derived(Math.min(100, Math.max(0, percent)));
</script>

<div class="w-full {className}" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
	<div class="h-1 w-full bg-line rounded-full overflow-hidden">
		<div
			class="h-full bg-accent rounded-full transition-all duration-500 ease-out"
			style="width: {clamped}%"
		></div>
	</div>
	<p class="sr-only">{clamped}% concluído</p>
</div>
