import { PHASE_TRIGGER_HOURS, type PhaseId } from '@/lib/schemas/phase-reached';
import type { FastSession } from '@/lib/schemas/fast-session';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the highest PhaseId whose trigger hour has been reached,
 * or null if the elapsed time is below 12 hours.
 */
export function calculateCurrentPhase(elapsedHours: number): PhaseId | null {
  let current: PhaseId | null = null;
  for (const hours of PHASE_TRIGGER_HOURS) {
    if (elapsedHours >= hours) {
      current = `${hours}h` as PhaseId;
    }
  }
  return current;
}

/**
 * Returns a 0–1 progress ratio toward plannedDurationH.
 * Clamped to [0, 1]. Returns 0 for free protocol (plannedDurationH === 0).
 */
export function calculateProgress(elapsedHours: number, plannedDurationH: number): number {
  if (plannedDurationH <= 0) return 0;
  return Math.min(Math.max(elapsedHours / plannedDurationH, 0), 1);
}

/**
 * Returns the PhaseIds whose trigger hour is strictly above elapsedHours,
 * in ascending order.
 */
export function getUpcomingPhaseIds(elapsedHours: number): PhaseId[] {
  return PHASE_TRIGGER_HOURS.filter((h) => h > elapsedHours).map((h) => `${h}h` as PhaseId);
}

/**
 * Returns the phases a session has crossed that are not yet recorded,
 * each with the exact timestamp at which it was reached (startedAt + trigger).
 * Used on every tick and to catch up after the app was killed mid-fast.
 */
export function computeMissingPhases(
  session: FastSession,
  recordedPhaseIds: readonly PhaseId[],
  now: Date = new Date()
): { phaseId: PhaseId; reachedAt: string }[] {
  const startedMs = new Date(session.startedAt).getTime();
  const elapsedHours = (now.getTime() - startedMs) / 3_600_000;
  const recorded = new Set<PhaseId>(recordedPhaseIds);
  return PHASE_TRIGGER_HOURS.filter((h) => elapsedHours >= h)
    .map((h) => ({
      phaseId: `${h}h` as PhaseId,
      reachedAt: new Date(startedMs + h * 3_600_000).toISOString(),
    }))
    .filter((p) => !recorded.has(p.phaseId));
}

/**
 * Returns the number of consecutive days (going backward from now) on which
 * the user completed at least one fast.
 *
 * - If there is a completed fast today → count starts from today.
 * - If there is no fast today but one yesterday → count starts from yesterday
 *   (streak is still considered "active" until midnight).
 * - Any longer gap resets the streak to 0.
 *
 * All date comparisons use UTC day boundaries.
 */
export function calculateStreak(sessions: FastSession[], now: Date = new Date()): number {
  const completedDates = new Set<string>(
    sessions
      .filter(
        (s): s is FastSession & { endedAt: string } =>
          s.status === 'completed' && s.endedAt !== null
      )
      .map((s) => toUtcDate(new Date(s.endedAt)))
  );

  if (completedDates.size === 0) return 0;

  const today = toUtcDate(now);
  const yesterday = toUtcDate(new Date(now.getTime() - MS_PER_DAY));

  const startDate = completedDates.has(today)
    ? today
    : completedDates.has(yesterday)
      ? yesterday
      : null;

  if (startDate === null) return 0;

  let streak = 0;
  const cursor = new Date(startDate + 'T00:00:00.000Z');
  while (completedDates.has(toUtcDate(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function toUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
