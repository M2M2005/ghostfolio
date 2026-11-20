import {
  AssetProfileIdentifier,
  Benchmark
} from '@ghostfolio/common/interfaces';

export interface WatchlistResponse {
  watchlist: (AssetProfileIdentifier & {
    analyst?: Benchmark['analyst'];
    currency?: Benchmark['currency'];
    marketCondition: Benchmark['marketCondition'];
    marketPrice?: Benchmark['marketPrice'];
    name: string;
    performances: Benchmark['performances'];
    sparkline?: Benchmark['sparkline'];
    trend50d: Benchmark['trend50d'];
    trend200d: Benchmark['trend200d'];
  })[];
}
