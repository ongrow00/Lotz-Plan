<script lang="ts">
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import { leadStore } from '$lib/stores/lead.store';
	import { resultProfile } from '$lib/stores/result.store';
	import { sessionStore } from '$lib/stores/session.store';
	import { submitLead } from '$lib/services/lead.service';
	import { trackLeadSubmit } from '$lib/services/analytics.service';
	import { validateLeadForm } from '$lib/utils/validation';
	import FormField from './FormField.svelte';
	import SubmitButton from './SubmitButton.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';

	const state = $derived($leadStore);
	const profile = $derived($resultProfile);
	const quiz = $derived($quizStore);
	const session = $derived($sessionStore);

	let fieldErrors = $state<Record<string, string>>({});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const { valid, errors } = validateLeadForm(state.name, state.email);
		fieldErrors = errors;
		if (!valid) return;

		if (!profile) {
			leadStore.setError('Perfil não encontrado. Por favor, reinicie o quiz.');
			return;
		}

		leadStore.setLoading(true);

		try {
			await submitLead({
				name: state.name.trim(),
				email: state.email.trim().toLowerCase(),
				profileId: profile.id,
				scores: quiz.scores,
				answers: quiz.answers,
				utm: Object.keys(session.utm).length > 0 ? session.utm : undefined,
				offer: session.offer ?? undefined
			});

			trackLeadSubmit(profile.id);
			leadStore.setSubmitted();
			quizStore.reset();
			await goto('/obrigado');
		} catch {
			leadStore.setError('Algo deu errado. Por favor, tente novamente.');
		}
	}
</script>

<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-5">
	<div class="space-y-1">
		<h2 class="text-xl font-bold text-heading">Receba seu plano personalizado</h2>
		<p class="text-sm text-muted">
			Enviamos seu resultado completo + próximos passos diretamente no seu e-mail.
		</p>
	</div>

	<FormField
		id="name"
		label="Seu nome"
		value={state.name}
		placeholder="Como podemos te chamar?"
		autocomplete="given-name"
		error={fieldErrors.name}
		oninput={(v) => leadStore.setField('name', v)}
	/>

	<FormField
		id="email"
		label="Seu melhor e-mail"
		type="email"
		value={state.email}
		placeholder="voce@exemplo.com"
		autocomplete="email"
		error={fieldErrors.email}
		oninput={(v) => leadStore.setField('email', v)}
	/>

	{#if state.error}
		<ErrorMessage message={state.error} />
	{/if}

	<SubmitButton loading={state.loading} />

	<p class="text-xs text-center text-muted">
		Sem spam. Você pode cancelar a qualquer momento.
	</p>
</form>
