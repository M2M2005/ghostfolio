import { LogPerformance } from '@ghostfolio/api/interceptors/performance-logging/performance-logging.interceptor';
import { BenchmarkService } from '@ghostfolio/api/services/benchmark/benchmark.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';
import { analystWarning } from '@ghostfolio/api/services/data-provider/yahoo-finance/analyst-data.helper';
import { YahooFinanceService } from '@ghostfolio/api/services/data-provider/yahoo-finance/yahoo-finance.service';
import { MarketDataService } from '@ghostfolio/api/services/market-data/market-data.service';
import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import { DataGatheringService } from '@ghostfolio/api/services/queues/data-gathering/data-gathering.service';
import { RedisCacheService } from '@ghostfolio/api/services/redis-cache/redis-cache.service';
import { SymbolProfileService } from '@ghostfolio/api/services/symbol-profile/symbol-profile.service';
import { getAssetProfileIdentifier } from '@ghostfolio/common/helper';
import {
  AnalystCheckResponse,
  AnalystData,
  AssetProfileIdentifier,
  WatchlistResponse
} from '@ghostfolio/common/interfaces';

import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Prisma } from '@prisma/client';
import { subDays } from 'date-fns';

// Modification bourse-custom : colonnes analystes et mini-courbe dans la liste de suivi
const ANALYST_CACHE_TTL = 12 * 60 * 60 * 1000;
const SPARKLINE_DAYS = 92;

@Injectable()
export class WatchlistService {
  public constructor(
    private readonly benchmarkService: BenchmarkService,
    private readonly dataGatheringService: DataGatheringService,
    private readonly dataProviderService: DataProviderService,
    private readonly marketDataService: MarketDataService,
    private readonly prismaService: PrismaService,
    private readonly redisCacheService: RedisCacheService,
    private readonly symbolProfileService: SymbolProfileService,
    private readonly yahooFinanceService: YahooFinanceService
  ) {}

  private async getAnalystData(
    symbol: string
  ): Promise<AnalystData | undefined> {
    const key = `bourse-custom-analyst-${symbol}`;
    const cached = await this.redisCacheService.get(key);

    if (cached) {
      return JSON.parse(cached) as AnalystData;
    }

    const data = await this.yahooFinanceService.getAnalystData(symbol);

    if (data) {
      await this.redisCacheService.set(
        key,
        JSON.stringify(data),
        ANALYST_CACHE_TTL
      );
    }

    return data;
  }

  /** bourse-custom : vérification avant ajout (action sans analyste → avertissement) */
  public async getAnalystCheck({
    dataSource,
    symbol
  }: AssetProfileIdentifier): Promise<AnalystCheckResponse> {
    if (dataSource !== DataSource.YAHOO) {
      return { warning: null };
    }

    const [profile, analyst] = await Promise.all([
      this.yahooFinanceService.getAssetProfile({ symbol }),
      this.yahooFinanceService.getAnalystData(symbol)
    ]);

    return {
      numberOfAnalysts: analyst?.numberOfAnalysts,
      warning: analystWarning(profile?.assetSubClass, analyst)
    };
  }

  public async createWatchlistItem({
    dataSource,
    symbol,
    userId
  }: { userId: string } & AssetProfileIdentifier): Promise<void> {
    const symbolProfile = await this.prismaService.symbolProfile.findUnique({
      where: {
        dataSource_symbol: { dataSource, symbol }
      }
    });

    if (!symbolProfile) {
      const assetProfiles = await this.dataProviderService.getAssetProfiles([
        { dataSource, symbol }
      ]);

      const assetProfile =
        assetProfiles[getAssetProfileIdentifier({ dataSource, symbol })];

      if (!assetProfile?.currency) {
        throw new BadRequestException(
          `Asset profile not found for ${symbol} (${dataSource})`
        );
      }

      await this.symbolProfileService.add(
        assetProfile as Prisma.SymbolProfileCreateInput
      );
    }

    await this.dataGatheringService.gatherSymbol({
      dataSource,
      symbol
    });

    await this.prismaService.user.update({
      data: {
        watchlist: {
          connect: {
            dataSource_symbol: { dataSource, symbol }
          }
        }
      },
      where: { id: userId }
    });
  }

  public async deleteWatchlistItem({
    dataSource,
    symbol,
    userId
  }: { userId: string } & AssetProfileIdentifier) {
    await this.prismaService.user.update({
      data: {
        watchlist: {
          disconnect: {
            dataSource_symbol: { dataSource, symbol }
          }
        }
      },
      where: { id: userId }
    });
  }

  @LogPerformance
  public async getWatchlistItems(
    userId: string
  ): Promise<WatchlistResponse['watchlist']> {
    const user = await this.prismaService.user.findUnique({
      select: {
        watchlist: {
          select: { dataSource: true, symbol: true }
        }
      },
      where: { id: userId }
    });

    const [assetProfiles, quotes] = await Promise.all([
      this.symbolProfileService.getSymbolProfiles(user.watchlist),
      this.dataProviderService.getQuotes({
        items: user.watchlist.map(({ dataSource, symbol }) => {
          return { dataSource, symbol };
        })
      })
    ]);

    const watchlist = await Promise.all(
      user.watchlist.map(async ({ dataSource, symbol }) => {
        const assetProfile = assetProfiles.find((profile) => {
          return profile.dataSource === dataSource && profile.symbol === symbol;
        });

        const [allTimeHigh, trends, analyst, history] = await Promise.all([
          this.marketDataService.getMax({
            dataSource,
            symbol
          }),
          this.benchmarkService.getBenchmarkTrends({ dataSource, symbol }),
          dataSource === DataSource.YAHOO
            ? this.getAnalystData(symbol)
            : Promise.resolve(undefined),
          this.marketDataService.getRange({
            assetProfileIdentifiers: [{ dataSource, symbol }],
            dateQuery: { gte: subDays(new Date(), SPARKLINE_DAYS) }
          })
        ]);
        const quote = quotes[getAssetProfileIdentifier({ dataSource, symbol })];

        const performancePercent =
          this.benchmarkService.calculateChangeInPercentage(
            allTimeHigh?.marketPrice,
            quotes[getAssetProfileIdentifier({ dataSource, symbol })]
              ?.marketPrice
          );

        return {
          dataSource,
          symbol,
          analyst,
          assetSubClass: assetProfile?.assetSubClass ?? undefined,
          currency: quote?.currency,
          marketPrice: quote?.marketPrice,
          sparkline: history.map(({ marketPrice }) => {
            return marketPrice;
          }),
          marketCondition:
            this.benchmarkService.getMarketCondition(performancePercent),
          name: assetProfile?.name,
          performances: {
            allTimeHigh: {
              date: allTimeHigh?.date,
              performancePercent:
                this.benchmarkService.getPerformancePercentFromAllTimeHigh(
                  performancePercent
                )
            }
          },
          trend50d: trends.trend50d,
          trend200d: trends.trend200d
        };
      })
    );

    return watchlist.sort((a, b) => {
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }

  public async hasWatchlistItem({
    dataSource,
    symbol,
    userId
  }: { userId: string } & AssetProfileIdentifier): Promise<boolean> {
    const assetProfile = await this.prismaService.symbolProfile.findFirst({
      where: {
        dataSource,
        symbol,
        watchedBy: { some: { id: userId } }
      }
    });

    return !!assetProfile;
  }
}
