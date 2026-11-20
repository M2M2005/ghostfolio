import { BenchmarkTrend } from '@ghostfolio/common/types/';

import { AnalystData } from './analyst-data.interface';
import { EnhancedAssetProfile } from './enhanced-asset-profile.interface';

export interface Benchmark {
  /** Liste de suivi uniquement (modification bourse-custom) */
  analyst?: AnalystData;
  currency?: string;
  dataSource: EnhancedAssetProfile['dataSource'];
  marketCondition: 'ALL_TIME_HIGH' | 'BEAR_MARKET' | 'NEUTRAL_MARKET';
  marketPrice?: number;
  name: EnhancedAssetProfile['name'];
  performances: {
    allTimeHigh: {
      date: Date;
      performancePercent: number;
    };
  };
  /** Cours de clôture sur environ 3 mois (mini-courbe) */
  sparkline?: number[];
  symbol: EnhancedAssetProfile['symbol'];
  trend50d: BenchmarkTrend;
  trend200d: BenchmarkTrend;
}
