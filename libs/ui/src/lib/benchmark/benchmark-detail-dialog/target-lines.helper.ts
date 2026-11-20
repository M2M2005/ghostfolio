// Lignes d'objectifs d'analystes sur le graphique de la fiche (modification bourse-custom).
import { AnalystData } from '@ghostfolio/common/interfaces';

export interface TargetLine {
  color: string;
  label: string;
  value: number;
}

export function targetLines(
  analyst: AnalystData | undefined,
  currency: string | undefined,
  locale: string
): TargetLine[] {
  const format = (value: number) => {
    return `${value.toLocaleString(locale, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ''}`;
  };
  const lines: TargetLine[] = [];

  if (analyst?.targetMean) {
    lines.push({
      color: '#1baf7a',
      label: `Objectif moyen · ${format(analyst.targetMean)}`,
      value: analyst.targetMean
    });
  }

  if (analyst?.targetLow) {
    lines.push({
      color: '#eda100',
      label: `Objectif bas · ${format(analyst.targetLow)}`,
      value: analyst.targetLow
    });
  }

  return lines;
}
