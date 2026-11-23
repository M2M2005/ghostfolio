import { analystWarning, parseAnalystData } from './analyst-data.helper';

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

describe('analystWarning (bourse-custom)', () => {
  it('aucun analyste : cotation secondaire probable', () => {
    expect(analystWarning('STOCK', undefined)).toBe('none');
    expect(analystWarning('STOCK', { numberOfAnalysts: undefined })).toBe(
      'none'
    );
  });

  it('moins de 5 analystes : ignorée par le bot', () => {
    expect(analystWarning('STOCK', { numberOfAnalysts: 3 })).toBe('few');
    expect(analystWarning('STOCK', { numberOfAnalysts: 4 })).toBe('few');
  });

  it('se tait à partir de 5 analystes, et pour les ETF, cryptos ou types inconnus', () => {
    expect(analystWarning('STOCK', { numberOfAnalysts: 5 })).toBeNull();
    expect(analystWarning('ETF', undefined)).toBeNull();
    expect(analystWarning('CRYPTOCURRENCY', undefined)).toBeNull();
    expect(analystWarning(undefined, undefined)).toBeNull();
  });
});
