import { holdingPerformance } from './holding-performance.helper';

describe('holdingPerformance (bourse-custom)', () => {
  it('returns the % versus the average price for the current holding period', () => {
    const items = [
      { averagePrice: 100, date: '2026-10-29', marketPrice: 100, quantity: 1 },
      { averagePrice: 100, date: '2026-11-17', marketPrice: 110, quantity: 1 },
      { averagePrice: 0, date: '2026-11-18', marketPrice: 105, quantity: 0 }, // vendue
      {
        averagePrice: 264.6,
        date: '2026-11-19',
        marketPrice: 264.6,
        quantity: 0.75
      },
      {
        averagePrice: 264.6,
        date: '2026-11-20',
        marketPrice: 254,
        quantity: 0.75
      }
    ];

    const result = holdingPerformance(items);

    expect(result.map(({ date }) => date)).toEqual([
      '2026-11-19',
      '2026-11-20'
    ]);
    expect(result[0].value).toBeCloseTo(0);
    expect(result[1].value).toBeCloseTo(254 / 264.6 - 1);
  });

  it('ignores points without price', () => {
    expect(
      holdingPerformance([
        { averagePrice: 10, date: '2026-01-01', quantity: 1 }
      ])
    ).toEqual([]);
  });
});
