import type { IUserRepository } from '@/lib/repositories/interfaces';
import type { User } from '@/lib/schemas';
import { getSupabase } from '@/lib/supabase';

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

const GENERIC_ERROR = 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';

function frenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cet email.';
  if (m.includes('password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('is invalid') || m.includes('invalid email')) return 'Adresse email invalide.';
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Connexion impossible. Vérifiez votre réseau.';
  return GENERIC_ERROR;
}

/**
 * Links the local (guest) user row to a Supabase identity: the local data
 * (sessions, journal, phases) is preserved and now belongs to the account.
 */
async function linkLocalUser(
  users: IUserRepository,
  localUser: User,
  email: string,
  supabaseId: string | null
): Promise<User> {
  return users.update(localUser.id, {
    email,
    supabaseId,
    isGuest: false,
  });
}

export async function signUpWithEmail(
  users: IUserRepository,
  localUser: User,
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "L'authentification n'est pas configurée." };
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: frenchAuthError(error.message) };
    const user = await linkLocalUser(users, localUser, email, data.user?.id ?? null);
    return { ok: true, user };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function signInWithEmail(
  users: IUserRepository,
  localUser: User,
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "L'authentification n'est pas configurée." };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: frenchAuthError(error.message) };
    const user = await linkLocalUser(users, localUser, email, data.user?.id ?? null);
    return { ok: true, user };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "L'authentification n'est pas configurée." };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'fastlife://reset-password',
    });
    if (error) return { ok: false, error: frenchAuthError(error.message) };
    return { ok: true };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

/**
 * Ends the Supabase session. Local data stays intact; the row keeps its
 * account link so the user can sign back in later.
 */
export async function signOutSession(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Session cleanup is best-effort; local usage continues either way
  }
}

/** True when a Supabase session is currently active. */
export async function hasActiveSession(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session !== null;
  } catch {
    return false;
  }
}
