import { targetLines } from './target-lines.helper';

describe('targetLines (bourse-custom)', () => {
  it('trace objectif moyen et objectif bas, avec la devise', () => {
    expect(
      targetLines({ targetLow: 520, targetMean: 690.4 }, 'USD', 'fr')
    ).toEqual([
      { color: '#1baf7a', label: 'Objectif moyen · 690,4 USD', value: 690.4 },
      { color: '#eda100', label: 'Objectif bas · 520 USD', value: 520 }
    ]);
  });

  it('ignore les objectifs absents (ETF, cotation secondaire)', () => {
    expect(targetLines(undefined, 'EUR', 'fr')).toEqual([]);
    expect(targetLines({ targetLow: 63 }, 'USD', 'fr')).toEqual([
      { color: '#eda100', label: 'Objectif bas · 63 USD', value: 63 }
    ]);
  });
});
