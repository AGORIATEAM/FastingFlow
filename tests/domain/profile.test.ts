import { goalFromDb, goalToDb, parseTargetWeightKg } from '@/lib/domain/profile';

describe('goalToDb', () => {
  it('maps every UI goal to its canonical enum', () => {
    expect(goalToDb('weight')).toBe('weight_loss');
    expect(goalToDb('energy')).toBe('mental_clarity');
    expect(goalToDb('longevity')).toBe('longevity');
    expect(goalToDb('metabolic')).toBe('metabolic_health');
  });

  it('maps unknown values to other and null to null', () => {
    expect(goalToDb('something-else')).toBe('other');
    expect(goalToDb(null)).toBeNull();
  });
});

describe('goalFromDb', () => {
  it('is the inverse of goalToDb for the four UI goals', () => {
    for (const ui of ['weight', 'energy', 'longevity', 'metabolic'] as const) {
      expect(goalFromDb(goalToDb(ui))).toBe(ui);
    }
  });

  it('returns null for other and null', () => {
    expect(goalFromDb('other')).toBeNull();
    expect(goalFromDb(null)).toBeNull();
  });
});

describe('parseTargetWeightKg', () => {
  it('returns null for an empty or blank field', () => {
    expect(parseTargetWeightKg('')).toBeNull();
    expect(parseTargetWeightKg('   ')).toBeNull();
  });

  it('parses dot and comma decimals to one decimal place', () => {
    expect(parseTargetWeightKg('70')).toBe(70);
    expect(parseTargetWeightKg('70.55')).toBe(70.6);
    expect(parseTargetWeightKg('70,5')).toBe(70.5);
  });

  it('rejects out-of-range and non-numeric input', () => {
    expect(parseTargetWeightKg('29.9')).toBe('invalid');
    expect(parseTargetWeightKg('301')).toBe('invalid');
    expect(parseTargetWeightKg('abc')).toBe('invalid');
    expect(parseTargetWeightKg('-70')).toBe('invalid');
  });

  it('accepts the exact bounds', () => {
    expect(parseTargetWeightKg('30')).toBe(30);
    expect(parseTargetWeightKg('300')).toBe(300);
  });
});
