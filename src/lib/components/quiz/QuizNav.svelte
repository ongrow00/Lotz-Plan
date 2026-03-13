<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		canGoBack: boolean;
		canGoNext: boolean;
		isLast: boolean;
		onBack: () => void;
		onNext: () => void;
	}

	let { canGoBack, canGoNext, isLast, onBack, onNext }: Props = $props();
</script>

<div class="flex items-center gap-3 pt-4">
	{#if canGoBack}
		<Button variant="ghost" size="md" onclick={onBack} class="gap-1">
			<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
				<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Voltar
		</Button>
	{/if}

	<Button
		variant="primary"
		size="lg"
		onclick={onNext}
		disabled={!canGoNext}
		class="flex-1"
	>
		{isLast ? 'Ver meu resultado' : 'Próxima'}
		{#if !isLast}
			<svg class="w-4 h-4 ml-1" viewBox="0 0 16 16" fill="none">
				<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		{/if}
	</Button>
</div>
