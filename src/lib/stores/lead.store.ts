import { writable } from 'svelte/store';

export interface LeadFormState {
	name: string;
	email: string;
	loading: boolean;
	error: string | null;
	submitted: boolean;
}

const INITIAL: LeadFormState = {
	name: '',
	email: '',
	loading: false,
	error: null,
	submitted: false
};

function createLeadStore() {
	const { subscribe, set, update } = writable<LeadFormState>(INITIAL);

	return {
		subscribe,

		setField(field: 'name' | 'email', value: string) {
			update((s) => ({ ...s, [field]: value }));
		},

		setLoading(loading: boolean) {
			update((s) => ({ ...s, loading, error: null }));
		},

		setError(error: string) {
			update((s) => ({ ...s, error, loading: false }));
		},

		setSubmitted() {
			update((s) => ({ ...s, submitted: true, loading: false, error: null }));
		},

		reset() {
			set(INITIAL);
		}
	};
}

export const leadStore = createLeadStore();
