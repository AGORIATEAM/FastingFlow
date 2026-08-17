import type { FastSession } from '@/lib/schemas/fast-session';
import {
  calculateCurrentPhase,
  calculateProgress,
  calculateStreak,
  computeMissingPhases,
  getUpcomingPhaseIds,
} from '@/lib/domain/fasting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_UUID_USER = '00000000-0000-0000-0000-000000000001';
const BASE_UUID_SESSION = '00000000-0000-0000-0000-000000000002';

function makeCompletedSession(endedAtUtc: string): FastSession {
  const endedAt = new Date(endedAtUtc);
  const startedAt = new Date(endedAt.getTime() - 16 * 60 * 60 * 1000).toISOString();
  return {
    id: BASE_UUID_SESSION,
    userId: BASE_UUID_USER,
    protocol: '16:8',
    plannedDurationH: 16,
    startedAt,
    endedAt: endedAtUtc,
    status: 'completed',
    notes: null,
    createdAt: startedAt,
    updatedAt: endedAtUtc,
  };
}

// Fixed "now" for all streak tests: 2026-04-23 12:00 UTC
const NOW = new Date('2026-04-23T12:00:00.000Z');
const TODAY = '2026-04-23';
const YESTERDAY = '2026-04-22';
const TWO_DAYS_AGO = '2026-04-21';
const THREE_DAYS_AGO = '2026-04-20';

// ---------------------------------------------------------------------------
// calculateCurrentPhase
// ---------------------------------------------------------------------------

describe('calculateCurrentPhase', () => {
  it('returns null when elapsed < 12h', () => {
    expect(calculateCurrentPhase(0)).toBeNull();
    expect(calculateCurrentPhase(11.99)).toBeNull();
  });

  it('returns 12h at exactly 12 hours', () => {
    expect(calculateCurrentPhase(12)).toBe('12h');
  });

  it('returns 12h between 12h and 16h', () => {
    expect(calculateCurrentPhase(14)).toBe('12h');
    expect(calculateCurrentPhase(15.99)).toBe('12h');
  });

  it('returns 16h at exactly 16 hours', () => {
    expect(calculateCurrentPhase(16)).toBe('16h');
  });

  it('returns 18h at exactly 18 hours', () => {
    expect(calculateCurrentPhase(18)).toBe('18h');
  });

  it('returns 24h at exactly 24 hours', () => {
    expect(calculateCurrentPhase(24)).toBe('24h');
  });

  it('returns 96h at 96 hours and beyond', () => {
    expect(calculateCurrentPhase(96)).toBe('96h');
    expect(calculateCurrentPhase(200)).toBe('96h');
  });

  it('handles each trigger point exactly', () => {
    const expected: [number, string][] = [
      [12, '12h'],
      [16, '16h'],
      [18, '18h'],
      [24, '24h'],
      [36, '36h'],
      [48, '48h'],
      [56, '56h'],
      [72, '72h'],
      [96, '96h'],
    ];
    for (const [hours, id] of expected) {
      expect(calculateCurrentPhase(hours)).toBe(id);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateProgress
// ---------------------------------------------------------------------------

describe('calculateProgress', () => {
  it('returns 0 at the start', () => {
    expect(calculateProgress(0, 16)).toBe(0);
  });

  it('returns 0.5 at half the planned duration', () => {
    expect(calculateProgress(8, 16)).toBe(0.5);
  });

  it('returns 1 at exactly the planned duration', () => {
    expect(calculateProgress(16, 16)).toBe(1);
  });

  it('clamps to 1 when elapsed exceeds planned duration', () => {
    expect(calculateProgress(24, 16)).toBe(1);
    expect(calculateProgress(100, 16)).toBe(1);
  });

  it('returns 0 for free protocol (plannedDurationH = 0)', () => {
    expect(calculateProgress(8, 0)).toBe(0);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('handles fractional hours correctly', () => {
    expect(calculateProgress(4, 16)).toBeCloseTo(0.25);
    expect(calculateProgress(12, 18)).toBeCloseTo(0.6667, 4);
  });
});

// ---------------------------------------------------------------------------
// getUpcomingPhaseIds
// ---------------------------------------------------------------------------

describe('getUpcomingPhaseIds', () => {
  it('returns all 9 phases when elapsed = 0', () => {
    const upcoming = getUpcomingPhaseIds(0);
    expect(upcoming).toEqual(['12h', '16h', '18h', '24h', '36h', '48h', '56h', '72h', '96h']);
  });

  it('returns phases above 16h when elapsed = 16', () => {
    expect(getUpcomingPhaseIds(16)).toEqual(['18h', '24h', '36h', '48h', '56h', '72h', '96h']);
  });

  it('returns empty array when elapsed >= 96', () => {
    expect(getUpcomingPhaseIds(96)).toEqual([]);
    expect(getUpcomingPhaseIds(200)).toEqual([]);
  });

  it('excludes the current phase (strictly greater than)', () => {
    // At exactly 18h, 18h is the current phase — not in upcoming
    expect(getUpcomingPhaseIds(18)).not.toContain('18h');
    expect(getUpcomingPhaseIds(18)).toContain('24h');
  });

  it('returns phases in ascending order', () => {
    const upcoming = getUpcomingPhaseIds(12);
    const hours = upcoming.map((id) => parseInt(id));
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
  });
});

// ---------------------------------------------------------------------------
// calculateStreak
// ---------------------------------------------------------------------------

describe('calculateStreak', () => {
  it('returns 0 with no sessions', () => {
    expect(calculateStreak([], NOW)).toBe(0);
  });

  it('returns 0 when no session is completed', () => {
    const session: FastSession = {
      ...makeCompletedSession(TODAY + 'T08:00:00.000Z'),
      status: 'cancelled',
    };
    expect(calculateStreak([session], NOW)).toBe(0);
  });

  it('returns 0 when last fast was 2+ days ago', () => {
    const session = makeCompletedSession(TWO_DAYS_AGO + 'T08:00:00.000Z');
    expect(calculateStreak([session], NOW)).toBe(0);
  });

  it('returns 1 with a single session completed today', () => {
    const session = makeCompletedSession(TODAY + 'T08:00:00.000Z');
    expect(calculateStreak([session], NOW)).toBe(1);
  });

  it('returns 1 with a session completed yesterday (no fast today yet)', () => {
    const session = makeCompletedSession(YESTERDAY + 'T08:00:00.000Z');
    expect(calculateStreak([session], NOW)).toBe(1);
  });

  it('returns 2 with sessions today and yesterday', () => {
    const sessions = [
      makeCompletedSession(TODAY + 'T08:00:00.000Z'),
      makeCompletedSession(YESTERDAY + 'T08:00:00.000Z'),
    ];
    expect(calculateStreak(sessions, NOW)).toBe(2);
  });

  it('returns 3 with three consecutive days ending yesterday', () => {
    const sessions = [
      makeCompletedSession(YESTERDAY + 'T08:00:00.000Z'),
      makeCompletedSession(TWO_DAYS_AGO + 'T08:00:00.000Z'),
      makeCompletedSession(THREE_DAYS_AGO + 'T08:00:00.000Z'),
    ];
    expect(calculateStreak(sessions, NOW)).toBe(3);
  });

  it('stops counting at a gap', () => {
    const sessions = [
      makeCompletedSession(TODAY + 'T08:00:00.000Z'),
      makeCompletedSession(YESTERDAY + 'T08:00:00.000Z'),
      // gap: TWO_DAYS_AGO missing
      makeCompletedSession(THREE_DAYS_AGO + 'T08:00:00.000Z'),
    ];
    expect(calculateStreak(sessions, NOW)).toBe(2);
  });

  it('counts multiple fasts on the same day as one streak day', () => {
    const sessions = [
      makeCompletedSession(TODAY + 'T06:00:00.000Z'),
      makeCompletedSession(TODAY + 'T20:00:00.000Z'),
    ];
    expect(calculateStreak(sessions, NOW)).toBe(1);
  });

  it('ignores sessions without endedAt', () => {
    const session: FastSession = {
      ...makeCompletedSession(TODAY + 'T08:00:00.000Z'),
      endedAt: null,
    };
    expect(calculateStreak([session], NOW)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeMissingPhases
// ---------------------------------------------------------------------------

describe('computeMissingPhases', () => {
  function makeActiveSession(startedAtUtc: string): FastSession {
    return {
      id: BASE_UUID_SESSION,
      userId: BASE_UUID_USER,
      protocol: '24h',
      plannedDurationH: 24,
      startedAt: startedAtUtc,
      endedAt: null,
      status: 'active',
      notes: null,
      createdAt: startedAtUtc,
      updatedAt: startedAtUtc,
    };
  }

  it('returns nothing before the first trigger (12h)', () => {
    const session = makeActiveSession('2026-04-23T06:00:00.000Z');
    const now = new Date('2026-04-23T17:59:00.000Z'); // 11h59 elapsed
    expect(computeMissingPhases(session, [], now)).toEqual([]);
  });

  it('returns the crossed phases with their exact reach timestamps', () => {
    const session = makeActiveSession('2026-04-22T12:00:00.000Z');
    const now = new Date('2026-04-23T06:00:00.000Z'); // 18h elapsed
    expect(computeMissingPhases(session, [], now)).toEqual([
      { phaseId: '12h', reachedAt: '2026-04-23T00:00:00.000Z' },
      { phaseId: '16h', reachedAt: '2026-04-23T04:00:00.000Z' },
      { phaseId: '18h', reachedAt: '2026-04-23T06:00:00.000Z' },
    ]);
  });

  it('excludes phases already recorded', () => {
    const session = makeActiveSession('2026-04-22T12:00:00.000Z');
    const now = new Date('2026-04-23T06:00:00.000Z'); // 18h elapsed
    expect(computeMissingPhases(session, ['12h', '16h'], now)).toEqual([
      { phaseId: '18h', reachedAt: '2026-04-23T06:00:00.000Z' },
    ]);
  });

  it('returns nothing when every crossed phase is recorded', () => {
    const session = makeActiveSession('2026-04-22T12:00:00.000Z');
    const now = new Date('2026-04-23T06:00:00.000Z');
    expect(computeMissingPhases(session, ['12h', '16h', '18h'], now)).toEqual([]);
  });

  it('catches up all 9 phases after a very long fast', () => {
    const session = makeActiveSession('2026-04-18T12:00:00.000Z');
    const now = new Date('2026-04-22T14:00:00.000Z'); // 98h elapsed
    const missing = computeMissingPhases(session, [], now);
    expect(missing.map((m) => m.phaseId)).toEqual([
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
  });

  it('includes a phase at its exact trigger instant', () => {
    const session = makeActiveSession('2026-04-23T00:00:00.000Z');
    const now = new Date('2026-04-23T12:00:00.000Z'); // exactly 12h
    expect(computeMissingPhases(session, [], now)).toEqual([
      { phaseId: '12h', reachedAt: '2026-04-23T12:00:00.000Z' },
    ]);
  });
});
