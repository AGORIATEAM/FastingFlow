import type { Goal } from '@/lib/schemas';

/**
 * Mapping between the UI goal identifiers (used by edit-profile and persisted
 * in the settings store) and the canonical Goal enum stored in SQLite.
 */
export const UI_GOALS = ['weight', 'energy', 'longevity', 'metabolic'] as const;
export type UiGoal = (typeof UI_GOALS)[number];

const UI_TO_DB: Record<UiGoal, Goal> = {
  weight: 'weight_loss',
  energy: 'mental_clarity',
  longevity: 'longevity',
  metabolic: 'metabolic_health',
};

const DB_TO_UI: Partial<Record<Goal, UiGoal>> = {
  weight_loss: 'weight',
  mental_clarity: 'energy',
  longevity: 'longevity',
  metabolic_health: 'metabolic',
};

export function goalToDb(uiGoal: string | null): Goal | null {
  if (uiGoal === null) return null;
  return UI_TO_DB[uiGoal as UiGoal] ?? 'other';
}

export function goalFromDb(goal: Goal | null): UiGoal | null {
  if (goal === null) return null;
  return DB_TO_UI[goal] ?? null;
}

/**
 * Parses a free-text weight input (kg). Accepts comma or dot decimals.
 * Returns null for an intentionally empty field, 'invalid' outside 30–300 kg.
 */
export function parseTargetWeightKg(input: string): number | null | 'invalid' {
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 30 || value > 300) return 'invalid';
  return Math.round(value * 10) / 10;
}
