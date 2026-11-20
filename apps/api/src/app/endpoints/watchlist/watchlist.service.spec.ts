import { WatchlistService } from './watchlist.service';

describe('WatchlistService (bourse-custom : colonnes analystes)', () => {
  const build = ({ cached }: { cached?: string } = {}) => {
    const deps = {
      benchmarkService: {
        calculateChangeInPercentage: jest.fn().mockReturnValue(-0.1),
        getBenchmarkTrends: jest
          .fn()
          .mockResolvedValue({ trend50d: 'UP', trend200d: 'UP' }),
        getMarketCondition: jest.fn().mockReturnValue('NEUTRAL_MARKET'),
        getPerformancePercentFromAllTimeHigh: jest.fn().mockReturnValue(-0.1)
      },
      dataProviderService: {
        getQuotes: jest.fn().mockResolvedValue({
          'YAHOO-NVDA': { currency: 'USD', marketPrice: 150 },
          'MANUAL-X': { currency: 'EUR', marketPrice: 10 }
        })
      },
      marketDataService: {
        getMax: jest.fn().mockResolvedValue({
          date: new Date('2026-01-01'),
          marketPrice: 200
        }),
        getRange: jest.fn().mockResolvedValue([
          { dataSource: 'YAHOO', marketPrice: 140, symbol: 'NVDA' },
          { dataSource: 'YAHOO', marketPrice: 150, symbol: 'NVDA' }
        ])
      },
      prismaService: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            watchlist: [
              { dataSource: 'YAHOO', symbol: 'NVDA' },
              { dataSource: 'MANUAL', symbol: 'X' }
            ]
          })
        }
      },
      redisCacheService: {
        get: jest.fn().mockResolvedValue(cached),
        set: jest.fn().mockResolvedValue(undefined)
      },
      symbolProfileService: {
        getSymbolProfiles: jest.fn().mockResolvedValue([
          { dataSource: 'YAHOO', name: 'NVIDIA', symbol: 'NVDA' },
          { dataSource: 'MANUAL', name: 'X', symbol: 'X' }
        ])
      },
      yahooFinanceService: {
        getAnalystData: jest
          .fn()
          .mockResolvedValue({ targetLow: 130, targetMedian: 245 })
      }
    };
    const service = new WatchlistService(
      deps.benchmarkService as any,
      {} as any,
      deps.dataProviderService as any,
      deps.marketDataService as any,
      deps.prismaService as any,
      deps.redisCacheService as any,
      deps.symbolProfileService as any,
      deps.yahooFinanceService as any
    );
    return { deps, service };
  };

  it('adds price, currency, analyst data and a sparkline for Yahoo symbols', async () => {
    const { deps, service } = build();
    const [nvda, x] = await service.getWatchlistItems('user');
    expect(nvda).toMatchObject({
      analyst: { targetLow: 130, targetMedian: 245 },
      currency: 'USD',
      marketPrice: 150,
      name: 'NVIDIA',
      sparkline: [140, 150]
    });
    expect(deps.redisCacheService.set).toHaveBeenCalledWith(
      'bourse-custom-analyst-NVDA',
      JSON.stringify({ targetLow: 130, targetMedian: 245 }),
      12 * 60 * 60 * 1000
    );
    expect(x.analyst).toBeUndefined();
    expect(deps.yahooFinanceService.getAnalystData).toHaveBeenCalledTimes(1);
  });

  it('uses the cached analyst data', async () => {
    const { deps, service } = build({
      cached: JSON.stringify({ targetLow: 1 })
    });
    const [nvda] = await service.getWatchlistItems('user');
    expect(nvda.analyst).toEqual({ targetLow: 1 });
    expect(deps.yahooFinanceService.getAnalystData).not.toHaveBeenCalled();
  });
});
