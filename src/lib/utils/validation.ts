export interface ValidationResult {
	valid: boolean;
	errors: Record<string, string>;
}

export function validateLeadForm(name: string, email: string): ValidationResult {
	const errors: Record<string, string> = {};

	const trimmedName = name.trim();
	if (!trimmedName) {
		errors.name = 'Nome é obrigatório';
	} else if (trimmedName.length < 2) {
		errors.name = 'Nome deve ter ao menos 2 caracteres';
	}

	const trimmedEmail = email.trim().toLowerCase();
	if (!trimmedEmail) {
		errors.email = 'E-mail é obrigatório';
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
		errors.email = 'E-mail inválido';
	}

	return {
		valid: Object.keys(errors).length === 0,
		errors
	};
}
