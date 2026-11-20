import { NUMERICAL_PRECISION_THRESHOLD_4_FIGURES } from '@ghostfolio/common/config';
import { DATE_FORMAT } from '@ghostfolio/common/helper';
import {
  AdminMarketDataDetails,
  LineChartItem
} from '@ghostfolio/common/interfaces';
import { GfDialogFooterComponent } from '@ghostfolio/ui/dialog-footer';
import { GfDialogHeaderComponent } from '@ghostfolio/ui/dialog-header';
import { DataService } from '@ghostfolio/ui/services';

import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { format } from 'date-fns';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';

import { consensusName } from '../analyst-columns.helper';
import {
  GfAssetPriceChartComponent,
  Purchase
} from './asset-price-chart/asset-price-chart.component';
import {
  changeSince,
  changeYtd,
  gap,
  PricePoint,
  range52w
} from './asset-stats.helper';
import { BenchmarkDetailDialogParams } from './interfaces/interfaces';
import { TargetLine, targetLines } from './target-lines.helper';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-flex flex-column h-100' },
  imports: [
    GfDialogFooterComponent,
    GfDialogHeaderComponent,
    GfAssetPriceChartComponent,
    MatDialogModule,
    NgxSkeletonLoaderModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'gf-benchmark-detail-dialog',
  styleUrls: ['./benchmark-detail-dialog.component.scss'],
  templateUrl: 'benchmark-detail-dialog.html'
})
export class GfBenchmarkDetailDialogComponent implements OnInit {
  public assetProfile?: AdminMarketDataDetails['assetProfile'];
  public historicalDataItems: LineChartItem[];
  public isLoading = true;
  public precision = 2;
  /** bourse-custom : cases de synthèse et achat */
  public purchase?: Purchase;
  public stats: { label: string; percent?: number; text?: string }[] = [];
  public potentialMedian?: number;
  public points: PricePoint[] = [];
  public targetLines: TargetLine[] = [];
  public value: number;

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private destroyRef: DestroyRef,
    public dialogRef: MatDialogRef<GfBenchmarkDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BenchmarkDetailDialogParams
  ) {}

  public ngOnInit() {
    this.dataService
      .fetchHoldingDetail({
        dataSource: this.data.dataSource,
        symbol: this.data.symbol
      })
      .pipe(
        catchError(() => {
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((holding) => {
        if (
          holding?.quantity &&
          holding.averagePrice &&
          holding.dateOfFirstActivity
        ) {
          this.purchase = {
            date: format(holding.dateOfFirstActivity, DATE_FORMAT),
            price: holding.averagePrice
          };
          this.changeDetectorRef.markForCheck();
        }
      });

    this.dataService
      .fetchAsset({
        dataSource: this.data.dataSource,
        symbol: this.data.symbol
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ assetProfile, marketData }) => {
        this.assetProfile = assetProfile;

        this.historicalDataItems = marketData.map(
          ({ date, marketPrice }, index) => {
            if (marketData.length - 1 === index) {
              this.value = marketPrice;
            }

            return {
              date: format(date, DATE_FORMAT),
              value: marketPrice
            };
          }
        );

        if (
          this.data.deviceType === 'mobile' &&
          this.value >= NUMERICAL_PRECISION_THRESHOLD_4_FIGURES
        ) {
          this.precision = 0;
        }

        this.points = this.historicalDataItems;
        this.computeStats();

        this.targetLines = targetLines(
          this.data.analyst,
          assetProfile?.currency,
          this.data.locale
        );

        this.isLoading = false;

        this.changeDetectorRef.markForCheck();
      });
  }

  private computeStats() {
    const analyst = this.data.analyst;
    const high52 = range52w(this.points);
    const money = (value?: number) => {
      return value === undefined
        ? '—'
        : `${value.toLocaleString(this.data.locale, { maximumFractionDigits: 2 })}${this.assetProfile?.currency ? ` ${this.assetProfile.currency}` : ''}`;
    };

    this.potentialMedian = gap(this.value, analyst?.targetMedian);
    this.stats = [
      { label: '1 mois', percent: changeSince(this.points, 30) },
      { label: '1 an', percent: changeSince(this.points, 365) },
      { label: 'Depuis le 1er janv.', percent: changeYtd(this.points) },
      { label: 'Plus haut 52 sem.', text: money(high52?.high) },
      { label: 'Plus bas 52 sem.', text: money(high52?.low) },
      ...(analyst?.numberOfAnalysts
        ? [
            {
              label: 'Analystes',
              text: `${analyst.numberOfAnalysts} · ${consensusName(analyst)}${
                analyst.recommendationMean
                  ? ` (${analyst.recommendationMean.toLocaleString(this.data.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })})`
                  : ''
              }`
            }
          ]
        : [])
    ];
  }

  public formatPercent(value?: number) {
    return value === undefined
      ? '—'
      : `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString(this.data.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`;
  }

  public percentClass(value?: number) {
    return value === undefined
      ? ''
      : value >= 0
        ? 'text-success'
        : 'text-danger';
  }

  public onClose() {
    this.dialogRef.close();
  }
}
