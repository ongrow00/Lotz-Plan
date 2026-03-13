<script lang="ts">
	import { tick } from 'svelte';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { goto, preloadData } from '$app/navigation';
	import { navigating } from '$app/state';
	import {
		quizStore,
		currentQuestion,
		isLastQuestion,
		nextQuestion,
		quizNavigationEnded
	} from '$lib/stores/quiz.store';
	import { trackQuestionAnswer, trackQuizComplete } from '$lib/services/analytics.service';
	import QuestionCard from './QuestionCard.svelte';
	import InfoScreen from './InfoScreen.svelte';
	import MicroResultScreen from './MicroResultScreen.svelte';
	import QuestionInputNumber from './QuestionInputNumber.svelte';
	import QuestionInputDate from './QuestionInputDate.svelte';
	import QuestionInputText from './QuestionInputText.svelte';
	import QuestionSlider from './QuestionSlider.svelte';
	import QuestionRuler from './QuestionRuler.svelte';
	import QuestionWeightCurrent from './QuestionWeightCurrent.svelte';
	import QuestionWeightGoal from './QuestionWeightGoal.svelte';
	import QuestionBodyFatGrid from './QuestionBodyFatGrid.svelte';
	import TransitionWrapper from './TransitionWrapper.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { getMicroResultData } from '$lib/utils/microresult-data';

	const quiz = $derived($quizStore);
	const question = $derived($currentQuestion);
	const isLast = $derived($isLastQuestion);
	const next = $derived($nextQuestion);

	// body_fat_grid uses a slider + Continuar; no auto-advance on every slider move
	const isSingleChoiceQuestion = $derived(
		question?.type === 'single' ||
			question?.type === 'boolean' ||
			question?.type === 'scale'
	);

	const isInfoOrMicroResult = $derived(
		question?.type === 'info' || question?.type === 'microresult'
	);

	const currentAnswer = $derived(question ? quiz.answers[question.id] : undefined);

	/** Para body_fat_goal: estágio "antes" = resposta de body_fat_level (0..5). */
	const bodyFatBeforeStage = $derived.by(() => {
		if (question?.id !== 'body_fat_goal') return undefined;
		const v = quiz.answers['body_fat_level'];
		if (typeof v !== 'string') return undefined;
		const n = parseInt(v, 10);
		return Number.isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
	});
	const hasValidAnswer = $derived(
		currentAnswer !== undefined &&
			(Array.isArray(currentAnswer)
				? currentAnswer.length > 0
				: typeof currentAnswer === 'string'
					? currentAnswer.trim() !== ''
					: true)
	);
	const canGoNext = $derived(
		question
			? isInfoOrMicroResult
				? true
				: question.required
					? hasValidAnswer
					: true
			: false
	);

	const showNextButton = $derived(!isSingleChoiceQuestion);

	/** Delay do botão na cascata (300ms entre cada item). Microresult: mr-1/mr-3 → 1200ms, mr-2 → 1200 ou 1500 se cardio, mr-5 → 900ms. */
	const buttonCascadeDelay = $derived.by(() => {
		if (question?.type !== 'microresult' || !question) return 0;
		if (question.id === 'mr-1') return 4 * 300; // badge, título, parágrafo, chart
		if (question.id === 'mr-2') {
			const data = getMicroResultData(question.id, quiz.answers, quizConfig.questions);
			const nexo = data?.nexo as { variant?: string; showCardioBox?: boolean } | undefined;
			return nexo?.showCardioBox ? 5 * 300 : 4 * 300; // +1 se tiver caixa cardio
		}
		if (question.id === 'mr-3') return 4 * 300; // badge, título, parágrafo, chart
		if (question.id === 'mr-5') return 3 * 300; // badge, título+subtitle, grid fatores
		return 0;
	});

	/** Lock para evitar duplo clique em Continuar */
	let advancing = $state(false);

	// Rede de segurança: quando a navegação termina (afterNavigate), limpa o lock advancing
	$effect(() => {
		$quizNavigationEnded; // track store so effect re-runs when it's bumped
		advancing = false;
	});

	// Timeout de segurança: se advancing ficar true por muito tempo (ex.: goto nunca resolve), libera a UI
	const ADVANCING_TIMEOUT_MS = 4000;
	$effect(() => {
		if (!advancing) return;
		const t = setTimeout(() => {
			advancing = false;
		}, ADVANCING_TIMEOUT_MS);
		return () => clearTimeout(t);
	});

	// event_date: show selected event name instead of "evento" (e.g. "Qual é a data do casamento?")
	const eventDateTitle = $derived.by(() => {
		if (question?.id !== 'event_date') return undefined;
		const eventTypeId = quiz.answers['event_type'];
		if (!eventTypeId || typeof eventTypeId !== 'string') return undefined;
		const eventQuestion = quizConfig.questions.find((q) => q.id === 'event_type');
		const option = eventQuestion?.options?.find((o) => o.id === eventTypeId);
		if (!option) return undefined;
		return `Qual é a data de ${option.text}?`;
	});

	// whatsapp: address user by name (e.g. "Maria, qual é o seu WhatsApp?")
	const whatsappTitle = $derived.by(() => {
		if (question?.id !== 'whatsapp') return undefined;
		const name = quiz.answers['user_name'];
		if (!name || typeof name !== 'string' || !name.trim()) return undefined;
		const firstName = name.trim().split(/\s+/)[0] ?? name.trim();
		return `${firstName}, qual é o seu WhatsApp?`;
	});

	// gender: subtext with goal (e.g. "Isso muda seu plano de emagrecimento.")
	const genderSubtextOverride = $derived.by(() => {
		if (question?.id !== 'gender') return undefined;
		const goal = quiz.answers['goal_type'];
		const planLabel = goal === 'goal-massa' ? 'ganho de massa' : 'emagrecimento';
		return `Metabolismo, hormônios e resposta ao treino funcionam de formas diferentes. Isso muda seu plano de ${planLabel}.`;
	});

	// success_metrics: title with "no seu objetivo"
	const successMetricsTitleOverride = $derived.by(() => {
		if (question?.id !== 'success_metrics') return undefined;
		return 'Como você vai saber que está progredindo no seu objetivo?';
	});

	// All steps use same CTA: "Continuar" with thin arrow on the right
	const buttonLabel = $derived('Continuar');

	function handleSelect(questionId: string, value: string | string[]) {
		if (navigating.from != null || advancing) return;
		quizStore.answer(questionId, value);
		trackQuestionAnswer(questionId, value);
		if (isSingleChoiceQuestion) {
			if (!question) return;
			// Ao selecionar "Nenhum" no evento, vai direto para o carregamento (pula event_date e resto)
			const selectedEventNenhuma =
				questionId === 'event_type' &&
				(value === 'event-nenhuma' || (Array.isArray(value) && value[0] === 'event-nenhuma'));
			if (selectedEventNenhuma) {
				queueMicrotask(() => handleNext(null, true));
				return;
			}
			// Calcula próximo com a resposta já aplicada, para não depender de estado reativo no callback
			const newAnswers = { ...quiz.answers, [questionId]: value };
			const visible = computeVisibleQuestions(quizConfig.questions, newAnswers);
			const idx = visible.findIndex((q) => q.id === question.id);
			// Só passar nextId/isLastStep quando a pergunta atual está na lista (idx >= 0); senão usa reativos após tick
			if (idx >= 0) {
				const nextQ = visible[idx + 1] ?? null;
				const isLastStep = idx === visible.length - 1;
				tick().then(() => handleNext(nextQ?.id ?? null, isLastStep));
			} else {
				tick().then(() => handleNext());
			}
		}
	}

	/** Lê o próximo passo a partir do estado atual do store (valor no momento do clique). */
	function getNextStepFromStore(): { nextId: string | null; isLast: boolean } {
		const state = get(quizStore);
		if (!state.currentQuestionId) return { nextId: null, isLast: false };
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const idx = visible.findIndex((q) => q.id === state.currentQuestionId);
		if (idx < 0) return { nextId: null, isLast: false };
		const nextQ = visible[idx + 1] ?? null;
		return { nextId: nextQ?.id ?? null, isLast: idx === visible.length - 1 };
	}

	async function handleNext(nextIdOrUndefined?: string | null, isLastStep?: boolean) {
		if (navigating.from != null || advancing) return;

		const useExplicit = nextIdOrUndefined !== undefined || isLastStep !== undefined;
		const step = useExplicit
			? { nextId: nextIdOrUndefined ?? null, isLast: isLastStep ?? false }
			: getNextStepFromStore();
		const { nextId, isLast: last } = step;

		if (last) {
			advancing = true;
			try {
				quizStore.complete();
				trackQuizComplete('');
				await goto('/carregando');
			} finally {
				advancing = false;
			}
		} else if (nextId && typeof nextId === 'string') {
			advancing = true;
			try {
				preloadData(`/plan/${nextId}`).catch(() => {});
				quizStore.goTo(nextId);
				await goto(`/plan/${nextId}`);
			} finally {
				advancing = false;
			}
		}
	}

	/** Pular a pergunta de data (event_date): não salva data e avança. O fluxo ignora a data daqui em diante. */
	function skipEventDateAndNext() {
		if (question?.id !== 'event_date' || advancing || navigating.from != null) return;
		quizStore.answer('event_date', '');
		tick().then(() => handleNext());
	}
</script>

{#if question}
	<!-- Question content — extra padding when Next button is visible; info_medication: alinhado no topo -->
	<div
		class="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full px-4 pt-6 {showNextButton ? 'pb-32' : 'pb-8'} {question.id === 'info_medication'
			? 'justify-start'
			: question.type === 'microresult'
				? 'justify-center'
				: ''}"
	>
		<TransitionWrapper key={question.id}>
			{#if question.type === 'info'}
				<InfoScreen {question} center={question.id === 'info_medication'} />
			{:else if question.type === 'microresult'}
				<MicroResultScreen {question} answers={quiz.answers} />
			{:else if question.type === 'number'}
				<QuestionInputNumber
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'date'}
				<div class="flex flex-col gap-4">
					<QuestionInputDate
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						titleOverride={eventDateTitle}
					/>
					{#if question.id === 'event_date'}
						<div class="flex justify-center pt-1">
							<button
								type="button"
								onclick={skipEventDateAndNext}
								disabled={advancing}
								class="text-white text-sm underline disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
							>
								Pular pergunta
							</button>
						</div>
					{/if}
				</div>
			{:else if question.type === 'text'}
				<QuestionInputText
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
					titleOverride={whatsappTitle}
				/>
			{:else if question.type === 'slider'}
				<QuestionSlider
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'ruler'}
				{#if question.id === 'weight_current_kg'}
					<QuestionWeightCurrent
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else if question.id === 'weight_goal_kg'}
					<QuestionWeightGoal
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else}
					<QuestionRuler
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
					/>
				{/if}
			{:else if question.type === 'body_fat_grid'}
				<QuestionBodyFatGrid
					{question}
					genderAnswer={typeof quiz.answers['gender'] === 'string' ? quiz.answers['gender'] : undefined}
					selectedValue={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					beforeStage={bodyFatBeforeStage}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else}
				<QuestionCard
					{question}
					selectedValue={currentAnswer}
					onSelect={handleSelect}
					titleOverride={successMetricsTitleOverride}
					subtextOverride={genderSubtextOverride}
				/>
			{/if}
		</TransitionWrapper>
	</div>

	<!-- Fixed bottom box — hidden for single choice. Botão entra na cascata (delay 300ms entre itens) em microresult. -->
	{#if showNextButton}
		<div class="fixed bottom-0 left-0 right-0 bg-bg px-4 pt-4 pb-8">
			<button
				type="button"
				onclick={() => handleNext()}
				disabled={!canGoNext || navigating.from != null || advancing}
				class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				in:fade={{ duration: 400, delay: buttonCascadeDelay }}
				out:fade={{ duration: 200 }}
			>
				<span>{buttonLabel}</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</button>
		</div>
	{/if}
{/if}
