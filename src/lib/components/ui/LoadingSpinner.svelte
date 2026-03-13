<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 24, class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="animate-spin text-muted {className}"
	aria-label="Carregando..."
>
	<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
	></circle>
	<path
		class="opacity-75"
		fill="currentColor"
		d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
	></path>
</svg>
