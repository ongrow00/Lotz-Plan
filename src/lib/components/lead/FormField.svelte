<script lang="ts">
	interface Props {
		id: string;
		label: string;
		type?: string;
		value: string;
		placeholder?: string;
		error?: string;
		autocomplete?: string;
		oninput: (value: string) => void;
	}

	let { id, label, type = 'text', value, placeholder = '', error, autocomplete, oninput }: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-semibold text-body">{label}</label>
	<input
		{id}
		{type}
		{value}
		{placeholder}
		{autocomplete}
		oninput={(e) => oninput((e.target as HTMLInputElement).value)}
		class="w-full px-4 py-3.5 rounded-2xl border-2 text-heading placeholder-muted transition-colors focus:outline-none bg-surface-2
			{error
			? 'border-red-500/60 bg-red-950/20'
			: 'border-line hover:border-accent/30 focus:border-accent'}"
		aria-describedby={error ? `${id}-error` : undefined}
		aria-invalid={error ? 'true' : undefined}
	/>
	{#if error}
		<p id="{id}-error" class="text-sm text-red-400 font-medium" role="alert">{error}</p>
	{/if}
</div>
