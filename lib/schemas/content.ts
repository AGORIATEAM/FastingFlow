import { z } from 'zod';

import { PhaseIdSchema } from './phase-reached';

export const MechanismSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const PhaseContentSchema = z.object({
  id: PhaseIdSchema,
  triggerHours: z.number().positive(),
  title: z.string().min(1),
  whatHappens: z.array(z.string()).min(1),
  mechanisms: z.array(MechanismSchema).min(1),
  bodyBenefits: z.array(z.string()).min(1),
  mindBenefits: z.array(z.string()).min(1),
  keyTerms: z.array(z.string()),
});

export const LexiconEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  definition: z.string().min(1),
  bodyImpact: z.string().min(1),
  mindImpact: z.string().min(1),
  activationPhases: z.array(PhaseIdSchema),
});

export const PhasesContentSchema = z.array(PhaseContentSchema).length(9);
export const LexiconContentSchema = z.array(LexiconEntrySchema).min(1);

export type Mechanism = z.infer<typeof MechanismSchema>;
export type PhaseContent = z.infer<typeof PhaseContentSchema>;
export type LexiconEntry = z.infer<typeof LexiconEntrySchema>;
export type PhasesContent = z.infer<typeof PhasesContentSchema>;
export type LexiconContent = z.infer<typeof LexiconContentSchema>;
