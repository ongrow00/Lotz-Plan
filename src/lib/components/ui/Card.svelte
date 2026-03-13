<script lang="ts">
	interface Props {
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="rounded-3xl bg-surface border border-line {className}">
	{@render children?.()}
</div>
