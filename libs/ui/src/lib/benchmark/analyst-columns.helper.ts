// Colonnes « analystes » de la liste de suivi (modification bourse-custom).
import { AnalystData } from '@ghostfolio/common/interfaces';

const CONSENSUS: Record<string, string> = {
  buy: 'Achat',
  hold: 'Neutre',
  sell: 'Vente',
  strong_buy: 'Achat+',
  underperform: 'Alléger'
};

/** ~21 séances de bourse = 1 mois */
const SEANCES_PAR_MOIS = 21;

export function potential(price?: number, target?: number): number | undefined {
  return price && target ? target / price - 1 : undefined;
}

export function change1m(values?: number[]): number | undefined {
  if (!values || values.length < 2) {
    return undefined;
  }

  const last = values[values.length - 1];
  const before = values[Math.max(0, values.length - 1 - SEANCES_PAR_MOIS)];

  return before ? last / before - 1 : undefined;
}

export function consensusLabel(
  analyst: AnalystData | undefined,
  locale: string
): string {
  if (!analyst) {
    return '';
  }

  const parts: string[] = [];

  if (analyst.recommendationKey) {
    parts.push(
      CONSENSUS[analyst.recommendationKey] ?? analyst.recommendationKey
    );
  }

  if (analyst.recommendationMean) {
    parts.push(
      analyst.recommendationMean.toLocaleString(locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      })
    );
  }

  if (analyst.buyPercent !== undefined) {
    parts.push(`${Math.round(analyst.buyPercent * 100)} %`);
  }

  return parts.join(' · ');
}

export function sparkPoints(
  values: number[] | undefined,
  width: number,
  height: number
): string {
  if (!values || values.length < 2) {
    return '';
  }

  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;

  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * (width - 4) + 2;
      const y = height - 3 - ((value - min) / range) * (height - 6);

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function trendClass(values?: number[]): string {
  const change = change1m(values);

  if (change === undefined) {
    return '';
  }

  return change >= 0 ? 'text-success' : 'text-danger';
}
