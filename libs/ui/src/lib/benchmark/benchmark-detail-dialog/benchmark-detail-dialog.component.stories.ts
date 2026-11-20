// bourse-custom : contrôle visuel de la fiche d'un actif (données simulées, aucun appel réseau)
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { applicationConfig } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { of } from 'rxjs';

import { DataService } from '../../services/data.service';
import { GfBenchmarkDetailDialogComponent } from './benchmark-detail-dialog.component';

const marketData = Array.from({ length: 1100 }, (_, i) => {
  return {
    date: new Date(Date.UTC(2023, 10, 20) + i * 86400000),
    marketPrice: 420 + i * 0.16 + Math.sin(i / 23) * 28 + Math.sin(i / 5) * 6
  };
});

function dataService(held: boolean) {
  return {
    fetchAsset: () => {
      return of({
        assetProfile: { currency: 'USD', name: 'MSCI Inc.', symbol: 'MSCI' },
        marketData
      });
    },
    fetchHoldingDetail: () => {
      return held
        ? of({
            averagePrice: 540,
            dateOfFirstActivity: new Date(Date.UTC(2026, 2, 12)),
            quantity: 2
          })
        : of(undefined);
    }
  };
}

function meta(held: boolean, deviceType = 'desktop') {
  return [
    applicationConfig({
      providers: [
        provideNoopAnimations(),
        { provide: DataService, useValue: dataService(held) },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            analyst: {
              buyPercent: 0.71,
              numberOfAnalysts: 17,
              recommendationKey: 'buy',
              recommendationMean: 1.8,
              targetLow: 520,
              targetMean: 690.4,
              targetMedian: 690
            },
            dataSource: 'YAHOO',
            deviceType,
            locale: 'fr',
            symbol: 'MSCI'
          }
        }
      ]
    })
  ];
}

export default {
  title: 'Fiche actif (bourse-custom)',
  component: GfBenchmarkDetailDialogComponent,
  render: () => ({
    template: `<div style="width: 800px; padding: 24px; margin: auto"><gf-benchmark-detail-dialog /></div>`
  })
} as Meta<GfBenchmarkDetailDialogComponent>;

export const Suivie: StoryObj<GfBenchmarkDetailDialogComponent> = {
  decorators: meta(false)
};

export const Detenue: StoryObj<GfBenchmarkDetailDialogComponent> = {
  decorators: meta(true)
};

export const Mobile: StoryObj<GfBenchmarkDetailDialogComponent> = {
  decorators: meta(true, 'mobile'),
  render: () => ({
    template: `<div style="width: 100%; padding: 8px"><gf-benchmark-detail-dialog /></div>`
  })
};
