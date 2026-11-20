import { parseAnalystData, shouldWarnNoAnalysts } from './analyst-data.helper';

describe('parseAnalystData', () => {
  it('extracts targets, consensus and the share of buy ratings', () => {
    const data = parseAnalystData({
      financialData: {
        numberOfAnalystOpinions: 53,
        recommendationKey: 'strong_buy',
        recommendationMean: 1.3,
        targetHighPrice: 450,
        targetLowPrice: 300,
        targetMeanPrice: 395,
        targetMedianPrice: 400
      },
      recommendationTrend: {
        trend: [
          {
            buy: 30,
            hold: 4,
            period: '0m',
            sell: 1,
            strongBuy: 15,
            strongSell: 0
          },
          {
            buy: 1,
            hold: 30,
            period: '-1m',
            sell: 0,
            strongBuy: 1,
            strongSell: 0
          }
        ]
      }
    } as any);

    expect(data).toEqual({
      buyPercent: 45 / 50,
      numberOfAnalysts: 53,
      recommendationKey: 'strong_buy',
      recommendationMean: 1.3,
      targetHigh: 450,
      targetLow: 300,
      targetMean: 395,
      targetMedian: 400
    });
  });

  it('returns undefined when Yahoo has no analyst coverage', () => {
    expect(parseAnalystData({ financialData: {} } as any)).toBeUndefined();
    expect(parseAnalystData(undefined)).toBeUndefined();
  });

  it('ignores non positive targets and an empty breakdown', () => {
    const data = parseAnalystData({
      financialData: {
        numberOfAnalystOpinions: 3,
        targetLowPrice: 0,
        targetMedianPrice: 10
      },
      recommendationTrend: {
        trend: [
          {
            buy: 0,
            hold: 0,
            period: '0m',
            sell: 0,
            strongBuy: 0,
            strongSell: 0
          }
        ]
      }
    } as any);

    expect(data.targetLow).toBeUndefined();
    expect(data.targetMedian).toBe(10);
    expect(data.buyPercent).toBeUndefined();
  });
});

describe('shouldWarnNoAnalysts (bourse-custom)', () => {
  it('avertit pour une action sans aucun analyste (cotation secondaire)', () => {
    expect(shouldWarnNoAnalysts('STOCK', undefined)).toBe(true);
    expect(shouldWarnNoAnalysts('STOCK', { numberOfAnalysts: undefined })).toBe(
      true
    );
  });

  it('se tait pour une action couverte, un ETF, une crypto ou un type inconnu', () => {
    expect(shouldWarnNoAnalysts('STOCK', { numberOfAnalysts: 17 })).toBe(false);
    expect(shouldWarnNoAnalysts('ETF', undefined)).toBe(false);
    expect(shouldWarnNoAnalysts('CRYPTOCURRENCY', undefined)).toBe(false);
    expect(shouldWarnNoAnalysts(undefined, undefined)).toBe(false);
  });
});
