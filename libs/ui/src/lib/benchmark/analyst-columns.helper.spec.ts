import {
  change1m,
  trendClass,
  consensusClass,
  consensusLabel,
  heatClass,
  potential,
  sparkPoints
} from './analyst-columns.helper';

describe('analyst columns (bourse-custom)', () => {
  it('computes the potential to a target', () => {
    expect(potential(150, 245)).toBeCloseTo(245 / 150 - 1);
    expect(potential(150, undefined)).toBeUndefined();
    expect(potential(undefined, 245)).toBeUndefined();
  });

  it('computes the change over about one month of trading days', () => {
    const values = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(change1m(values)).toBeCloseTo(129 / 108 - 1);
    expect(change1m([1])).toBeUndefined();
  });

  it('labels the consensus', () => {
    expect(
      consensusLabel(
        {
          buyPercent: 0.91,
          recommendationKey: 'strong_buy',
          recommendationMean: 1.34
        },
        'fr'
      )
    ).toBe('Achat+ · 1,3 · 91 %');
    expect(consensusLabel({ recommendationKey: 'hold' }, 'fr')).toBe('Neutre');
    expect(consensusLabel(undefined, 'fr')).toBe('');
  });

  it('builds sparkline points within the box', () => {
    const points = sparkPoints([1, 3, 2], 84, 26).split(' ');
    expect(points).toHaveLength(3);
    expect(points[0]).toBe('2.0,23.0');
    expect(points[1]).toBe('42.0,3.0');
    expect(sparkPoints([5], 84, 26)).toBe('');
  });
});

describe('trendClass (bourse-custom)', () => {
  it('colours the sparkline by its one month change', () => {
    expect(trendClass([100, 110])).toBe('text-success');
    expect(trendClass([110, 100])).toBe('text-danger');
    expect(trendClass([1])).toBe('');
  });
});

describe('consensusClass', () => {
  it('colore achat, vente et neutre', () => {
    expect(consensusClass({ recommendationKey: 'strong_buy' })).toBe(
      'pill pill-buy'
    );
    expect(consensusClass({ recommendationKey: 'underperform' })).toBe(
      'pill pill-sell'
    );
    expect(consensusClass({ recommendationKey: 'hold' })).toBe(
      'pill pill-hold'
    );
    expect(consensusClass(undefined)).toBe('');
  });
});

describe('heatClass', () => {
  it('gradue la couleur selon le signe et l’ampleur', () => {
    expect(heatClass(0.05, 0.1)).toBe('heat heat-up-1');
    expect(heatClass(0.2, 0.1)).toBe('heat heat-up-2');
    expect(heatClass(0.45, 0.1)).toBe('heat heat-up-3');
    expect(heatClass(-0.04, 0.03)).toBe('heat heat-down-2');
    expect(heatClass(-0.5, 0.1)).toBe('heat heat-down-3');
    expect(heatClass(undefined, 0.1)).toBe('');
  });
});
