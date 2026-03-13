import type { Answers, Question } from '$lib/data/types';

function getOptionLabel(questionId: string, optionId: string, questions: Question[]): string {
	const q = questions.find((x) => x.id === questionId);
	if (!q?.options) return optionId;
	const opt = q.options.find((o) => o.id === optionId);
	return opt?.text ?? optionId;
}

function getOptionLabels(questionId: string, answer: string | string[] | undefined, questions: Question[]): string[] {
	if (answer === undefined || answer === null) return [];
	const ids = Array.isArray(answer) ? answer : [answer];
	return ids.map((id) => getOptionLabel(questionId, id, questions)).filter(Boolean);
}

function top2(questionId: string, answer: string | string[] | undefined, questions: Question[]): string {
	return getOptionLabels(questionId, answer, questions).slice(0, 2).join(', ') || '—';
}

/** Retorna a frase do "futuro" (como quer estar) adaptada ao sexo para encaixar em "ficar [futuro]" ou equivalente. */
function getBodyGoalFraseParaFuturo(
	bodyGoalOptionId: string | undefined,
	isMale: boolean
): string {
	switch (bodyGoalOptionId) {
		case 'body-magro':
			return isMale ? 'magro e definido' : 'magra e definida';
		case 'body-barriga':
			return 'com menos barriga';
		case 'body-saude':
			return 'com saúde, sem exageros';
		case 'body-musculo':
			return isMale ? 'musculoso e forte' : 'musculosa e forte';
		case 'body-grande':
			return isMale ? 'grande e definido' : 'grande e definida';
		case 'body-atletico':
			return isMale ? 'atlético, sem exagerar no volume' : 'atlética, sem exagerar no volume';
		default:
			return 'o seu futuro';
	}
}

export interface NexoCentralizadaMr1 {
	variant: 'mr-1';
	smallLabel: string;
	headlineHighlight: string;
	paragraphHighlights: { sexo: string; futuro: string };
}

export interface NexoCentralizadaMr2 {
	variant: 'mr-2';
	/** Sujeito do headline: "Homens", "Mulheres" ou "Pessoas" (conforme sexo escolhido) */
	headlineSubject: string;
	/** Fragmento para "... que treinam [X] com nosso protocolo..." (ex.: "em casa", "na academia") */
	headlineLocalFragment: string;
	/** Fragmento para "montado especificamente pra [X], em..." (ex.: "você treinar em casa") */
	paragraphLocalFragment: string;
	/** Duração por dia (ex.: "1 hora", "30 minutos") — exibido em verde */
	paragraphTempo: string;
	/** Ex.: "3 por semana" — exibido em verde; omitido se não houver dias selecionados */
	paragraphTempoPerWeek?: string;
	showCardioBox: boolean;
}

export interface NexoCentralizadaMr3 {
	variant: 'mr-3';
	/** Peso atual em kg (ex.: 73) */
	currentKg: number;
	/** Meta de peso em kg (ex.: 68) */
	goalKg: number;
	/** Quanto emagrecer/ganhar em valor absoluto (ex.: 5 para "perder até 5kg") */
	kgToReach: number;
	/** Estimativa de semanas para chegar à meta */
	weeksEstimate: number;
	/** true = emagrecer, false = ganhar massa */
	isWeightLoss: boolean;
	/** "homens" ou "mulheres" (conforme sexo escolhido) */
	sexo: string;
	/** Idade em anos (ex.: 35) */
	idade: number | null;
}

export type NexoCentralizada = NexoCentralizadaMr1 | NexoCentralizadaMr2 | NexoCentralizadaMr3;

/** Farol do fator: verde, laranja ou vermelho */
export type LifestyleFactorStatus = 'green' | 'orange' | 'red';

/** Fator de estilo de vida para o layout de micro resultado (mr-5): apenas Sono, Movimento, Energia */
export interface LifestyleFactor {
	category: 'sono' | 'movimento' | 'energia';
	label: string;
	value: string;
	status: LifestyleFactorStatus;
}

/** Dados para o layout "fatores do estilo de vida" (telas de micro resultado padronizadas) */
export interface LifestyleFactorsData {
	/** Título: "Identificamos fatores... que influenciam seu {goalType}" */
	goalType: string;
	subtitle: string;
	factors: LifestyleFactor[];
	/** Texto da caixa inferior (com **bold** para goalType e "milimetricamente") */
	bottomText: string;
}

export interface MicroResultData {
	title: string;
	bullets: string[];
	insight?: string;
	ctaText: string;
	/** Layout centralizado (mr-1 ou mr-2) — quando presente, substitui title/bullets/insight */
	nexo?: NexoCentralizada;
	/** Layout fatores do estilo de vida (mr-5) — quando presente, usa padrão de micro resultado */
	lifestyleFactors?: LifestyleFactorsData;
}

export function getMicroResultData(
	stepId: string,
	answers: Answers,
	questions: Question[]
): MicroResultData {
	const label = (qId: string, key?: string) =>
		getOptionLabel(qId, answers[key ?? qId] as string, questions) || '—';
	const labelsTop2 = (qId: string, key?: string) => top2(qId, answers[key ?? qId], questions);

	switch (stepId) {
		case 'mr-1': {
			const goalId = answers['goal_type'] as string | undefined;
			// Headline: "Primeiro passo para você emagrecer/ganhar massa foi concluído."
			const headlineHighlight =
				goalId === 'goal-emagrecer'
					? 'você emagrecer'
					: goalId === 'goal-massa'
						? 'você ganhar massa'
						: 'seu objetivo';
			// Parágrafo: "Para homens/mulheres com seu objetivo..."
			const genderId = answers['gender'] as string | undefined;
			const sexo =
				genderId === 'gender-m' ? 'homens' : genderId === 'gender-f' ? 'mulheres' : 'você';
			// Futuro: frase adaptada ao sexo (magro/magra, definido/definida, etc.)
			const bodyGoalQuestionId =
				goalId === 'goal-emagrecer' ? 'body_goal_emagrecer' : 'body_goal_massa';
			const bodyGoalAnswer = answers[bodyGoalQuestionId] as string | undefined;
			const isMale = genderId === 'gender-m';
			const futuro = getBodyGoalFraseParaFuturo(bodyGoalAnswer, isMale);
			return {
				title: '',
				bullets: [],
				ctaText: 'Perfeito, continuar →',
				nexo: {
					variant: 'mr-1',
					smallLabel: 'Seus Objetivos',
					headlineHighlight,
					paragraphHighlights: {
						sexo,
						futuro
					}
				}
			};
		}
		case 'mr-2': {
			const genderId = answers['gender'] as string | undefined;
			const headlineSubject =
				genderId === 'gender-m' ? 'Homens' : genderId === 'gender-f' ? 'Mulheres' : 'Pessoas';
			const locationId = answers['workout_location'] as string | undefined;
			const durationId = answers['workout_duration_pref'] as string | undefined;
			const tempo =
				durationId === 'dur-30'
					? '30 minutos'
					: durationId === 'dur-45'
						? '45 minutos'
						: durationId === 'dur-60'
							? '1 hora'
							: durationId === 'dur-60plus'
								? '1 hora ou mais'
								: 'seu tempo';
			const workoutDays = answers['workout_days'];
			const daysCount = Array.isArray(workoutDays) ? workoutDays.length : 0;
			const paragraphTempoPerWeek = daysCount > 0 ? `${daysCount}x por semana` : undefined;
			const showCardioBox = answers['cardio_enabled'] === 'cardio-sim';
			// Fragmentos gramaticais para cada opção de local (headline e parágrafo). Qualquer tipo de academia = só "academia".
			const { headlineFragment, paragraphFragment } = (() => {
				switch (locationId) {
					case 'loc-casa':
						return {
							headlineFragment: 'em casa',
							paragraphFragment: 'você treinar em casa'
						};
					case 'loc-academia':
					case 'loc-condominio':
						return {
							headlineFragment: 'na academia',
							paragraphFragment: 'você treinar na academia'
						};
					case 'loc-varia':
						return {
							headlineFragment: 'em vários lugares',
							paragraphFragment: 'você treinar onde for melhor'
						};
					default:
						return {
							headlineFragment: 'no seu local',
							paragraphFragment: 'seu contexto'
						};
				}
			})();
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →',
				nexo: {
					variant: 'mr-2',
					headlineSubject,
					headlineLocalFragment: headlineFragment,
					paragraphLocalFragment: paragraphFragment,
					paragraphTempo: tempo,
					paragraphTempoPerWeek,
					showCardioBox
				}
			};
		}
		case 'mr-3': {
			const genderId = answers['gender'] as string | undefined;
			const sexo =
				genderId === 'gender-m' ? 'homens' : genderId === 'gender-f' ? 'mulheres' : 'pessoas';
			const rawAge = answers['age_years'];
			const idade =
				rawAge != null
					? (typeof rawAge === 'string' ? parseInt(rawAge, 10) : Array.isArray(rawAge) ? parseInt(String(rawAge[0]), 10) : Number(rawAge))
					: null;
			const idadeValida = typeof idade === 'number' && Number.isFinite(idade) ? idade : null;

			const current = answers['weight_current_kg'];
			const goal = answers['weight_goal_kg'];
			const currentNum = typeof current === 'string' ? parseFloat(current) : NaN;
			const goalNum = typeof goal === 'string' ? parseFloat(goal) : NaN;
			const kgToReach = !isNaN(currentNum) && !isNaN(goalNum) ? Math.abs(goalNum - currentNum) : 0;
			const weeksEstimate = kgToReach > 0 ? Math.ceil(kgToReach * 2) : 12;
			const isWeightLoss = !isNaN(currentNum) && !isNaN(goalNum) && goalNum < currentNum;
			return {
				title: '',
				bullets: [],
				ctaText: 'Quero chegar lá →',
				nexo: {
					variant: 'mr-3',
					currentKg: isNaN(currentNum) ? 0 : currentNum,
					goalKg: isNaN(goalNum) ? 0 : goalNum,
					kgToReach,
					weeksEstimate,
					isWeightLoss,
					sexo,
					idade: idadeValida
				}
			};
		}
		case 'mr-5': {
			const goalId = answers['goal_type'] as string | undefined;
			const goalType =
				goalId === 'goal-emagrecer'
					? 'emagrecimento'
					: goalId === 'goal-massa'
						? 'ganho de massa'
						: 'objetivo';

			// Farol classificado pelas respostas do quiz (ids = question.id em questions.ts)
			const answer = (qId: string) => (answers[qId] as string | undefined) ?? undefined;

			// Sono: faixa de horas → valor + farol (vermelho <5h, laranja 5–6h, verde 7–8h e 9h+)
			const sleepId = answer('sleep_hours_range');
			const { value: sonoValue, status: sonoStatus } = (() => {
				switch (sleepId) {
					case 'sleep-menos5':
						return { value: '4 horas', status: 'red' as const };
					case 'sleep-5-6':
						return { value: '6 horas', status: 'orange' as const };
					case 'sleep-7-8':
						return { value: '7 horas', status: 'green' as const };
					case 'sleep-mais8':
						return { value: '9 horas', status: 'green' as const };
					default:
						return { value: '—', status: 'orange' as const };
				}
			})();

			// Movimento: classificado pela resposta a daily_walk_range
			const walkId = answer('daily_walk_range');
			const { value: movimentoValue, status: movimentoStatus } = (() => {
				switch (walkId) {
					case 'walk-sentado':
						return { value: 'Baixo', status: 'red' as const };
					case 'walk-moderado':
						return { value: 'Médio', status: 'orange' as const };
					case 'walk-ativo':
						return { value: 'Alto', status: 'green' as const };
					default:
						return { value: '—', status: 'orange' as const };
				}
			})();

			// Energia: classificado pela resposta a energy_level
			const energyId = answer('energy_level');
			const { value: energiaValue, status: energiaStatus } = (() => {
				switch (energyId) {
					case 'energy-cansado':
						return { value: 'Baixo', status: 'red' as const };
					case 'energy-media':
						return { value: 'Médio', status: 'orange' as const };
					case 'energy-disposto':
						return { value: 'Alto', status: 'green' as const };
					default:
						return { value: '—', status: 'orange' as const };
				}
			})();

			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →',
				lifestyleFactors: {
					goalType,
					subtitle: 'Seu protocolo será ajustado milimetricamente para funcionar dentro da sua realidade.',
					factors: [
						{ category: 'sono', label: 'Sono', value: sonoValue, status: sonoStatus },
						{
							category: 'movimento',
							label: 'Movimento',
							value: movimentoValue,
							status: movimentoStatus
						},
						{
							category: 'energia',
							label: 'Energia',
							value: energiaValue,
							status: energiaStatus
						}
					],
					bottomText: `Com base no seu objetivo de **${goalType}** e nos padrões que identificamos no seu estilo de vida, seu protocolo será ajustado **milimetricamente** para funcionar dentro da sua realidade, não contra ela.`
				}
			};
		}
		default:
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →'
			};
	}
}
