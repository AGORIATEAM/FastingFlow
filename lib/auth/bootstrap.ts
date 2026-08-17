import { randomUUID } from 'expo-crypto';

import type { IUserRepository } from '@/lib/repositories/interfaces';
import type { User } from '@/lib/schemas';

interface BootstrapResult {
  user: User;
  isFirstLaunch: boolean;
}

/**
 * Ensures a user record exists in the local database.
 * On first launch, creates a guest user with a random UUID so the app is
 * immediately usable without requiring sign-up.
 * On subsequent launches, returns the existing user.
 */
export async function bootstrapUser(userRepo: IUserRepository): Promise<BootstrapResult> {
  const allUsers = await userRepo.findAll();
  const existing = allUsers[0] ?? null;

  if (existing !== null) {
    return { user: existing, isFirstLaunch: false };
  }

  const guestUser = await userRepo.create({
    id: randomUUID(),
    email: null,
    passwordHash: null,
    supabaseId: null,
    isGuest: true,
    displayName: null,
    dob: null,
    gender: null,
    weightKg: null,
    heightCm: null,
    goal: null,
  });

  return { user: guestUser, isFirstLaunch: true };
}
