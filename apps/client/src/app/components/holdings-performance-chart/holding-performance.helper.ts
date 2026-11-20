// Performance d'une position depuis son achat (modification bourse-custom).
import { LineChartItem } from '@ghostfolio/common/interfaces';

interface HoldingHistoryItem {
  averagePrice?: number;
  date: string;
  marketPrice?: number;
  quantity?: number;
}

/**
 * % de variation du cours par rapport au prix de revient moyen, jour par jour,
 * sur la période de détention en cours (après la dernière vente totale).
 * Valeurs en fraction (0,05 = +5 %), comme les autres séries de Ghostfolio.
 */
export function holdingPerformance(
  items: HoldingHistoryItem[]
): LineChartItem[] {
  let start = 0;

  items.forEach(({ quantity }, i) => {
    if (!quantity) {
      start = i + 1;
    }
  });

  const result: LineChartItem[] = [];

  for (const { averagePrice, date, marketPrice } of items.slice(start)) {
    if (averagePrice && marketPrice && averagePrice > 0 && marketPrice > 0) {
      result.push({ date, value: marketPrice / averagePrice - 1 });
    }
  }

  return result;
}
