import { z } from 'zod';

export const GenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export const GoalSchema = z.enum([
  'weight_loss',
  'metabolic_health',
  'longevity',
  'mental_clarity',
  'other',
]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  passwordHash: z.string().nullable(),
  isGuest: z.boolean(),
  displayName: z.string().nullable(),
  dob: z.string().nullable(),
  gender: GenderSchema.nullable(),
  weightKg: z.number().positive().nullable(),
  heightCm: z.number().positive().nullable(),
  goal: GoalSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  passwordHash: z.string().nullable(),
  isGuest: z.boolean(),
  displayName: z.string().nullable(),
  dob: z.string().nullable(),
  gender: GenderSchema.nullable(),
  weightKg: z.number().positive().nullable(),
  heightCm: z.number().positive().nullable(),
  goal: GoalSchema.nullable(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  passwordHash: z.string().optional(),
  isGuest: z.boolean().optional(),
  displayName: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  gender: GenderSchema.nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  goal: GoalSchema.nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Goal = z.infer<typeof GoalSchema>;
