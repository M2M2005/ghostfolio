// bourse-custom : dans l'onglet « Positions », la performance affichée est celle de la position en
// cours (valeur actuelle / coût des titres détenus), comme Trade Republic, et non celle de tout
// l'historique du titre (achats et ventes passés compris).
interface HoldingPerformance {
  investment?: number;
  netPerformancePercentWithCurrencyEffect?: number;
  netPerformanceWithCurrencyEffect?: number;
  quantity?: number;
  valueInBaseCurrency?: number;
}

export function withCurrentPositionPerformance<T extends HoldingPerformance>(
  holdings: T[]
): T[] {
  return holdings.map((holding) => {
    const { investment, quantity, valueInBaseCurrency } = holding;

    if (
      !quantity ||
      !investment ||
      investment <= 0 ||
      valueInBaseCurrency === undefined ||
      valueInBaseCurrency === null
    ) {
      return holding;
    }

    return {
      ...holding,
      netPerformancePercentWithCurrencyEffect:
        valueInBaseCurrency / investment - 1,
      netPerformanceWithCurrencyEffect: valueInBaseCurrency - investment
    };
  });
}
