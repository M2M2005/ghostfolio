import {
  changeSince,
  changeYtd,
  gap,
  range52w,
  rangeStart
} from './asset-stats.helper';

const points = [
  { date: '2025-01-02', value: 100 },
  { date: '2025-11-20', value: 120 },
  { date: '2026-01-02', value: 110 },
  { date: '2026-10-20', value: 150 },
  { date: '2026-11-20', value: 165 }
];

describe('asset stats (bourse-custom)', () => {
  it('variation depuis N jours, sur le dernier point disponible à cette date', () => {
    expect(changeSince(points, 31)).toBeCloseTo(165 / 150 - 1);
    expect(changeSince(points, 365)).toBeCloseTo(165 / 120 - 1);
  });

  it("pas de variation si l'historique ne remonte pas assez", () => {
    expect(changeSince(points.slice(3), 365)).toBeUndefined();
    expect(changeSince([], 31)).toBeUndefined();
  });

  it('variation depuis le 1er janvier (dernière clôture de l’année précédente)', () => {
    expect(changeYtd(points)).toBeCloseTo(165 / 120 - 1);
    expect(changeYtd(points.slice(2))).toBeUndefined();
  });

  it('plus haut / plus bas sur 52 semaines', () => {
    expect(range52w(points)).toEqual({ high: 165, low: 110 });
    expect(range52w([])).toBeUndefined();
  });

  it('début de période (0 = tout)', () => {
    expect(rangeStart('2026-11-20', 30)).toBe('2026-10-21');
    expect(rangeStart('2026-11-20', 0)).toBeUndefined();
  });

  it('écart du cours à un objectif', () => {
    expect(gap(100, 125)).toBeCloseTo(0.25);
    expect(gap(100, undefined)).toBeUndefined();
  });
});
