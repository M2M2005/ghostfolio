import { AnalystData } from '@ghostfolio/common/interfaces';

const positive = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
};

/**
 * Extrait objectifs de cours et consensus d'une réponse quoteSummary
 * (modules financialData et recommendationTrend). undefined sans couverture.
 */
export function parseAnalystData(summary: {
  financialData?: Record<string, unknown>;
  recommendationTrend?: { trend?: Record<string, unknown>[] };
}): AnalystData | undefined {
  const financialData = summary?.financialData;

  if (!financialData) {
    return undefined;
  }

  const data: AnalystData = {
    numberOfAnalysts: positive(financialData.numberOfAnalystOpinions),
    recommendationKey:
      typeof financialData.recommendationKey === 'string' &&
      financialData.recommendationKey !== 'none'
        ? financialData.recommendationKey
        : undefined,
    recommendationMean: positive(financialData.recommendationMean),
    targetHigh: positive(financialData.targetHighPrice),
    targetLow: positive(financialData.targetLowPrice),
    targetMean: positive(financialData.targetMeanPrice),
    targetMedian: positive(financialData.targetMedianPrice)
  };

  const current = summary.recommendationTrend?.trend?.find(({ period }) => {
    return period === '0m';
  });

  if (current) {
    const counts = ['strongBuy', 'buy', 'hold', 'sell', 'strongSell'].map(
      (key) => {
        return Number(current[key]) || 0;
      }
    );
    const total = counts.reduce((sum, count) => sum + count, 0);

    if (total > 0) {
      data.buyPercent = (counts[0] + counts[1]) / total;
    }
  }

  const hasData = Object.values(data).some((value) => {
    return value !== undefined;
  });

  return hasData
    ? (Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      ) as AnalystData)
    : undefined;
}

/**
 * Avertir à l'ajout dans la liste de suivi : action (STOCK) sans aucun analyste, typiquement une
 * cotation secondaire (ex. 3HM.SG au lieu de MSCI). Les ETF, cryptos… n'ont jamais d'analystes.
 */
export function shouldWarnNoAnalysts(
  assetSubClass: string | undefined,
  analyst: AnalystData | undefined
): boolean {
  return assetSubClass === 'STOCK' && !analyst?.numberOfAnalysts;
}
