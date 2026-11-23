import { withCurrentPositionPerformance } from './current-position-performance.helper';

describe('withCurrentPositionPerformance (bourse-custom)', () => {
  it('performance de la position en cours : valeur / coût des titres détenus', () => {
    const [mu] = withCurrentPositionPerformance([
      {
        investment: 200,
        netPerformancePercentWithCurrencyEffect: 0.2136,
        netPerformanceWithCurrencyEffect: 32.76,
        quantity: 0.34,
        valueInBaseCurrency: 199
      }
    ]);

    expect(mu.netPerformanceWithCurrencyEffect).toBeCloseTo(-1);
    expect(mu.netPerformancePercentWithCurrencyEffect).toBeCloseTo(-0.005);
  });

  it('laisse intactes les positions soldées et les valeurs absentes', () => {
    const soldee = {
      investment: 0,
      netPerformancePercentWithCurrencyEffect: 0.1,
      netPerformanceWithCurrencyEffect: 9,
      quantity: 0,
      valueInBaseCurrency: 0
    };

    expect(withCurrentPositionPerformance([soldee])).toEqual([soldee]);
    expect(
      withCurrentPositionPerformance([
        {
          ...soldee,
          quantity: 1,
          investment: 100,
          valueInBaseCurrency: undefined
        }
      ])[0].netPerformanceWithCurrencyEffect
    ).toBe(9);
  });
});
