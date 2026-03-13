<script lang="ts">
	import { browser } from '$app/environment';
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		/** Override title (e.g. "Qual é a data do casamento?" when event type is known) */
		titleOverride?: string;
	}

	let { question, value, onSelect, titleOverride }: Props = $props();

	const displayTitle = $derived(titleOverride ?? question.text);

	const today = browser ? new Date().toISOString().slice(0, 10) : '';
	// min = amanhã (picker nativo já bloqueia datas anteriores)
	const minDate = browser
		? (() => {
				const d = new Date();
				d.setDate(d.getDate() + 1);
				return d.toISOString().slice(0, 10);
			})()
		: '';

	let inputValue = $state(value ?? '');
	let errorMsg = $state('');

	function handleInput(raw: string) {
		inputValue = raw;
		if (!raw) {
			errorMsg = '';
			onSelect(question.id, '');
			return;
		}
		if (raw <= today) {
			errorMsg =
				raw === today
					? 'A data precisa ser após hoje, não no mesmo dia.'
					: 'Escolha uma data no futuro.';
			// Invalida a resposta para bloquear o botão "Próxima"
			onSelect(question.id, '');
		} else {
			errorMsg = '';
			onSelect(question.id, raw);
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-tight">{displayTitle}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>
	<input
		type="date"
		min={minDate}
		value={inputValue}
		oninput={(e) => handleInput(e.currentTarget.value)}
		class="date-input-white-icon w-full px-4 py-4 rounded-2xl border-2 bg-surface text-body focus:outline-none focus:ring-2 transition-colors
			{errorMsg
			? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
			: 'border-line focus:border-accent focus:ring-accent/20'}"
	/>
	{#if errorMsg}
		<p class="text-sm text-red-400">{errorMsg}</p>
	{/if}
</div>

<style>
	:global(.date-input-white-icon::-webkit-calendar-picker-indicator) {
		filter: invert(1);
	}
</style>
