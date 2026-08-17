import type { FastSession } from '@/lib/schemas/fast-session';
import { planNotificationTriggers } from '@/lib/domain/fasting';

const BASE_UUID_USER = '00000000-0000-0000-0000-000000000001';
const BASE_UUID_SESSION = '00000000-0000-0000-0000-000000000002';

function makeSession(
  startedAtUtc: string,
  protocol: FastSession['protocol'],
  plannedDurationH: number
): FastSession {
  return {
    id: BASE_UUID_SESSION,
    userId: BASE_UUID_USER,
    protocol,
    plannedDurationH,
    startedAt: startedAtUtc,
    endedAt: null,
    status: 'active',
    notes: null,
    createdAt: startedAtUtc,
    updatedAt: startedAtUtc,
  };
}

const START = '2026-04-23T08:00:00.000Z';
const JUST_STARTED = new Date('2026-04-23T08:00:01.000Z');

describe('planNotificationTriggers', () => {
  it('plans 12h phase + completion for a 16:8 fast', () => {
    const triggers = planNotificationTriggers(makeSession(START, '16:8', 16), JUST_STARTED);
    expect(triggers).toEqual([
      { kind: 'phase', phaseId: '12h', date: new Date('2026-04-23T20:00:00.000Z') },
      { kind: 'end', phaseId: null, date: new Date('2026-04-24T00:00:00.000Z') },
    ]);
  });

  it('excludes the phase that coincides with the planned end (24h fast)', () => {
    const triggers = planNotificationTriggers(makeSession(START, '24h', 24), JUST_STARTED);
    expect(triggers.map((t) => t.phaseId)).toEqual(['12h', '16h', '18h', null]);
    expect(triggers[triggers.length - 1]?.kind).toBe('end');
  });

  it('plans all 9 phases and no end for a free fast', () => {
    const triggers = planNotificationTriggers(makeSession(START, 'free', 0), JUST_STARTED);
    expect(triggers).toHaveLength(9);
    expect(triggers.every((t) => t.kind === 'phase')).toBe(true);
    expect(triggers[0]?.phaseId).toBe('12h');
    expect(triggers[8]?.phaseId).toBe('96h');
  });

  it('drops triggers already in the past when scheduling mid-fast', () => {
    const midFast = new Date('2026-04-23T21:00:00.000Z'); // 13h elapsed
    const triggers = planNotificationTriggers(makeSession(START, '16:8', 16), midFast);
    expect(triggers).toEqual([
      { kind: 'end', phaseId: null, date: new Date('2026-04-24T00:00:00.000Z') },
    ]);
  });

  it('returns an empty plan when the fast is already past its end', () => {
    const wayPast = new Date('2026-04-25T08:00:00.000Z');
    expect(planNotificationTriggers(makeSession(START, '16:8', 16), wayPast)).toEqual([]);
  });

  it('sorts triggers chronologically', () => {
    const triggers = planNotificationTriggers(makeSession(START, '48h', 48), JUST_STARTED);
    const times = triggers.map((t) => t.date.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
