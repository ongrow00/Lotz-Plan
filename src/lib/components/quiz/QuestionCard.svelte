<script lang="ts">
	import type { Question } from '$lib/data/types';
	import OptionButton from './OptionButton.svelte';


	interface Props {
		question: Question;
		selectedValue: string | string[] | undefined;
		onSelect: (questionId: string, value: string | string[]) => void;
		/** Override title */
		titleOverride?: string;
		/** Override subtext (e.g. dynamic "seu plano de emagrecimento") */
		subtextOverride?: string;
	}

	let { question, selectedValue, onSelect, titleOverride, subtextOverride }: Props = $props();

	const displayTitle = $derived(titleOverride ?? question.text);
	const displaySubtext = $derived(subtextOverride ?? question.subtext ?? '');

	const isMultiple = $derived(question.type === 'multiple');

	const selected = $derived<string[]>(
		selectedValue === undefined
			? []
			: Array.isArray(selectedValue)
				? selectedValue
				: [selectedValue]
	);

	// Exclusive option ids: when selected, disable other options and keep only this one (Nenhuma, Corpo inteiro)
	const noneOptionIds = $derived(
		question.id === 'injuries'
			? ['inj-nenhuma']
			: question.id === 'diet_restrictions'
				? ['diet-nenhuma']
				: question.id === 'focus_areas'
					? ['fa-inteiro']
					: []
	);
	const hasNoneSelected = $derived(noneOptionIds.length > 0 && noneOptionIds.some((id) => selected.includes(id)));

	function handleOptionClick(optionId: string) {
		if (isMultiple) {
			const max = question.maxSelections ?? Infinity;
			let next: string[];
			const isNoneOption = noneOptionIds.includes(optionId);
			if (isNoneOption) {
				next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [optionId];
			} else if (hasNoneSelected) {
				next = [optionId];
			} else if (selected.includes(optionId)) {
				next = selected.filter((id) => id !== optionId);
			} else if (selected.length < max) {
				next = [...selected.filter((id) => !noneOptionIds.includes(id)), optionId];
			} else {
				next = [...selected.slice(1).filter((id) => !noneOptionIds.includes(id)), optionId];
			}
			onSelect(question.id, next);
		} else {
			onSelect(question.id, optionId);
		}
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Title block -->
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-tight">{displayTitle}</h2>
		{#if displaySubtext}
			<p class="text-sm text-body leading-relaxed">{displaySubtext}</p>
		{/if}
	</div>

	<!-- Options -->
	<div
		class="flex flex-col gap-1 {question.optionsLayout === 'horizontal' || question.optionsLayout === 'grid' ? 'w-full' : ''}"
	>
		<div
			class="flex gap-2 {question.optionsLayout === 'horizontal'
				? 'flex-row w-full'
				: question.optionsLayout === 'grid'
					? 'grid grid-cols-4 gap-2'
					: 'flex-col gap-3'}"
		>
			{#each (question.options ?? []) as option (option.id)}
				<OptionButton
					{option}
					selected={selected.includes(option.id)}
					type={isMultiple ? 'multiple' : 'single'}
					disabled={hasNoneSelected && !noneOptionIds.includes(option.id)}
					minimal={question.optionsLayout === 'minimal'}
					horizontal={question.optionsLayout === 'horizontal'}
					stacked={question.optionsLayout === 'grid'}
					onclick={handleOptionClick}
				/>
			{/each}
		</div>
		{#if question.optionsLayout === 'horizontal' && question.type === 'scale'}
			<div class="flex justify-between w-full text-xs text-muted px-0.5">
				<span>pouco</span>
				<span>muito</span>
			</div>
		{/if}
	</div>
</div>
