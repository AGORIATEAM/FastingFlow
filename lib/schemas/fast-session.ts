import { z } from 'zod';

export const ProtocolSchema = z.enum(['16:8', '18:6', '20:4', 'OMAD', '24h', '36h', '48h', 'free']);

export const FastSessionStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const FastSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  protocol: ProtocolSchema,
  plannedDurationH: z.number().positive(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  status: FastSessionStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateFastSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  protocol: ProtocolSchema,
  plannedDurationH: z.number().positive(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
  status: FastSessionStatusSchema,
  notes: z.string().nullable(),
});

export const UpdateFastSessionSchema = z.object({
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  status: FastSessionStatusSchema.optional(),
  notes: z.string().nullable().optional(),
  protocol: ProtocolSchema.optional(),
  plannedDurationH: z.number().positive().optional(),
});

/** Maps each protocol to its planned duration in hours */
export const PROTOCOL_DURATION_H: Record<z.infer<typeof ProtocolSchema>, number> = {
  '16:8': 16,
  '18:6': 18,
  '20:4': 20,
  OMAD: 23,
  '24h': 24,
  '36h': 36,
  '48h': 48,
  free: 0,
};

export type FastSession = z.infer<typeof FastSessionSchema>;
export type CreateFastSession = z.infer<typeof CreateFastSessionSchema>;
export type UpdateFastSession = z.infer<typeof UpdateFastSessionSchema>;
export type Protocol = z.infer<typeof ProtocolSchema>;
export type FastSessionStatus = z.infer<typeof FastSessionStatusSchema>;
