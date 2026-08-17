import { z } from 'zod';

const MoodScale = z.number().int().min(1).max(5);
const TenPointScale = z.number().int().min(1).max(10);

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fastSessionId: z.string().uuid().nullable(),
  mood: MoodScale,
  energy: TenPointScale,
  hunger: TenPointScale,
  mentalClarity: TenPointScale,
  waterMl: z.number().int().min(0),
  text: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const CreateJournalEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fastSessionId: z.string().uuid().nullable(),
  mood: MoodScale,
  energy: TenPointScale,
  hunger: TenPointScale,
  mentalClarity: TenPointScale,
  waterMl: z.number().int().min(0).default(0),
  text: z.string().nullable(),
});

export const UpdateJournalEntrySchema = z.object({
  mood: MoodScale.optional(),
  energy: TenPointScale.optional(),
  hunger: TenPointScale.optional(),
  mentalClarity: TenPointScale.optional(),
  waterMl: z.number().int().min(0).optional(),
  text: z.string().nullable().optional(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type CreateJournalEntry = z.infer<typeof CreateJournalEntrySchema>;
export type UpdateJournalEntry = z.infer<typeof UpdateJournalEntrySchema>;
