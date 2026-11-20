// Données d'analystes (objectifs de cours et consensus) issues de Yahoo Finance.
export interface AnalystData {
  /** Part des analystes à l'achat (achat fort + achat), entre 0 et 1 */
  buyPercent?: number;
  numberOfAnalysts?: number;
  /** strong_buy, buy, hold, underperform, sell */
  recommendationKey?: string;
  /** 1 = achat fort … 5 = vente */
  recommendationMean?: number;
  targetHigh?: number;
  targetLow?: number;
  targetMean?: number;
  targetMedian?: number;
}

/** Vérification avant ajout à la liste de suivi (modification bourse-custom) */
export interface AnalystCheckResponse {
  /** Action sans aucun analyste sur Yahoo : sans doute une cotation secondaire */
  warnNoAnalysts: boolean;
}
