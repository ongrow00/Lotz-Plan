<script lang="ts">
	interface Props {
		message: string;
		class?: string;
	}

	let { message, class: className = '' }: Props = $props();
</script>

{#if message}
	<p role="alert" class="text-sm text-red-400 font-medium {className}">
		{message}
	</p>
{/if}
