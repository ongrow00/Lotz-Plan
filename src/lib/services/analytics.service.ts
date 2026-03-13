/**
 * Phase 1: Stub analytics service.
 * Phase 2: Integrate GA4 / Plausible.
 *
 * Usage: call these functions at key quiz moments.
 */

export function trackQuizStart(): void {
	console.log('[analytics] quiz_start');
	// Phase 2: gtag('event', 'quiz_start') or plausible('quiz_start')
}

export function trackQuestionAnswer(questionId: string, optionId: string | string[]): void {
	console.log('[analytics] question_answer', { questionId, optionId });
	// Phase 2: gtag('event', 'question_answer', { question_id: questionId })
}

export function trackQuizComplete(profileId: string): void {
	console.log('[analytics] quiz_complete', { profileId });
	// Phase 2: gtag('event', 'quiz_complete', { profile_id: profileId })
}

export function trackLeadSubmit(profileId: string): void {
	console.log('[analytics] lead_submit', { profileId });
	// Phase 2: gtag('event', 'lead_submit', { profile_id: profileId })
}
