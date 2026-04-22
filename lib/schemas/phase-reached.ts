import { z } from 'zod';

/** The 9 notification trigger points (hours). Used in PhaseReached log table. */
export const PHASE_TRIGGER_HOURS = [12, 16, 18, 24, 36, 48, 56, 72, 96] as const;
export type PhaseTriggerHour = (typeof PHASE_TRIGGER_HOURS)[number];

export const PhaseIdSchema = z.enum([
  '12h',
  '16h',
  '18h',
  '24h',
  '36h',
  '48h',
  '56h',
  '72h',
  '96h',
]);

export const PhaseReachedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fastSessionId: z.string().uuid(),
  phaseId: PhaseIdSchema,
  reachedAt: z.string().datetime(),
});

export const CreatePhaseReachedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fastSessionId: z.string().uuid(),
  phaseId: PhaseIdSchema,
  reachedAt: z.string().datetime(),
});

export type PhaseReached = z.infer<typeof PhaseReachedSchema>;
export type CreatePhaseReached = z.infer<typeof CreatePhaseReachedSchema>;
export type PhaseId = z.infer<typeof PhaseIdSchema>;
