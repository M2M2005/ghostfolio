// bourse-custom : contrôle visuel de la liste de suivi (colonnes analystes) à une largeur réaliste.
import { Benchmark } from '@ghostfolio/common/interfaces';

import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';

import { EntityLogoImageSourceService } from '../entity-logo/entity-logo-image-source.service';
import { EntityLogoImageSourceServiceMock } from '../mocks/entity-logo-image-source.service.mock';
import { NotificationService } from '../notifications';
import { GfBenchmarkComponent } from './benchmark.component';

function spark(start: number, drift: number): number[] {
  const values: number[] = [];
  let v = start;

  for (let i = 0; i < 64; i++) {
    v = v * (1 + drift + Math.sin(i / 3) * 0.01);
    values.push(v);
  }

  return values;
}

function item(
  name: string,
  symbol: string,
  price: number,
  low: number,
  median: number,
  key: string,
  drift: number,
  assetSubClass = 'STOCK'
): Benchmark {
  const sparkline = spark(price / (1 + drift * 64), drift);

  return {
    analyst: {
      numberOfAnalysts: 30,
      recommendationKey: key,
      recommendationMean:
        key === 'strong_buy' ? 1.3 : key === 'buy' ? 1.9 : 2.8,
      targetLow: low,
      targetMedian: median
    },
    assetSubClass,
    currency: 'EUR',
    dataSource: 'YAHOO',
    marketCondition: 'NEUTRAL_MARKET',
    marketPrice: sparkline[sparkline.length - 1],
    name,
    performances: {
      allTimeHigh: { date: new Date('2026-10-01'), performancePercent: -0.08 }
    },
    sparkline,
    symbol,
    trend200d: 'UP',
    trend50d: 'UP'
  };
}

const benchmarks: Benchmark[] = [
  {
    ...item(
      'Bitcoin EUR',
      'BTC-EUR',
      54700,
      0,
      0,
      '',
      -0.003,
      'CRYPTOCURRENCY'
    ),
    analyst: undefined
  },
  {
    ...item(
      'Amundi Physical Gold ETC C',
      'GLDA.DE',
      128,
      0,
      0,
      '',
      -0.002,
      'PRECIOUS_METAL'
    ),
    analyst: undefined
  },
  item('Alphabet Inc.', 'GOOG', 264, 230, 300, 'strong_buy', 0.002),
  {
    ...item(
      'Amundi Index Solutions - Amundi MSCI Emerging Markets UCITS ETF-C EUR',
      'AEEM.PA',
      7.1,
      0,
      0,
      '',
      -0.001,
      'ETF'
    ),
    analyst: undefined
  },
  item('Intel Corporation', 'INTC', 21, 15, 22, 'hold', -0.004),
  item('MSCI Inc.', 'MSCI', 560, 520, 650, 'buy', 0.001),
  item('NVIDIA Corporation', 'NVDA', 160, 140, 240, 'strong_buy', 0.003),
  item('Schneider Electric S.E.', 'SU.PA', 230, 249.95, 328.9, 'buy', 0.0015),
  item('SK hynix Inc.', 'HY9H.F', 120, 90, 110, 'underperform', -0.002)
];

export default {
  title: 'Benchmark (liste de suivi)',
  component: GfBenchmarkComponent,
  decorators: [
    applicationConfig({
      providers: [provideNoopAnimations(), provideRouter([])]
    }),
    moduleMetadata({
      imports: [CommonModule, MatDialogModule],
      providers: [
        NotificationService,
        {
          provide: EntityLogoImageSourceService,
          useValue: new EntityLogoImageSourceServiceMock()
        }
      ]
    })
  ],
  render: (args) => ({
    props: { ...args, benchmarks },
    // même mise en page que home-watchlist.html, dans la zone à droite du menu latéral
    template: `<div id="zone" style="margin-left: 14rem"><div class="container" style="max-width: 1400px"><div class="row"><div class="col-12">
      <gf-benchmark deviceType="desktop" locale="fr" [benchmarks]="benchmarks" [hasPermissionToDeleteItem]="true" [showAnalystColumns]="true" [showIcon]="true" />
    </div></div></div></div>`
  })
} as Meta<GfBenchmarkComponent>;

export const ListeDeSuivi: StoryObj<GfBenchmarkComponent> = {};
