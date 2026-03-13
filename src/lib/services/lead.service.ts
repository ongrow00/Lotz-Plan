import type { LeadData } from '$lib/data/types';

/**
 * Phase 1: Stub — logs to console, simulates network delay.
 *
 * Phase 2: Replace body with Supabase insert. Include utm + offer in payload:
 * ```ts
 * const payload = {
 *   name: data.name,
 *   email: data.email,
 *   profile_id: data.profileId,
 *   scores: data.scores,
 *   answers: data.answers,
 *   utm_source: data.utm?.utm_source ?? null,
 *   utm_medium: data.utm?.utm_medium ?? null,
 *   utm_campaign: data.utm?.utm_campaign ?? null,
 *   utm_term: data.utm?.utm_term ?? null,
 *   utm_content: data.utm?.utm_content ?? null,
 *   offer: data.offer ?? null,
 * };
 * const { error } = await supabase.from('leads').insert(payload);
 * if (error) throw new Error(error.message);
 * ```
 * Or use server-side route: POST /api/submit-lead
 */
export async function submitLead(data: LeadData): Promise<void> {
	// Simulate network delay for UX testing
	await new Promise((resolve) => setTimeout(resolve, 1200));

	// Phase 2: swap this stub with real Supabase / API call
	console.log('[lead.service] Lead captured:', {
		name: data.name,
		email: data.email,
		profileId: data.profileId,
		scores: data.scores,
		utm: data.utm,
		offer: data.offer
	});
}
