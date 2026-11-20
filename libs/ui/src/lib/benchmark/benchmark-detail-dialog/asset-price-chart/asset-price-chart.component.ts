// Graphique du cours d'un actif face aux objectifs des analystes (modification bourse-custom).
// Même moteur et même style que « Performance depuis l'achat » (Lightweight Charts 4.2.0).
import { getLocale } from '@ghostfolio/common/helper';
import { ColorScheme } from '@ghostfolio/common/types';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  type ElementRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  viewChild
} from '@angular/core';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineStyle,
  MouseEventParams,
  Time
} from 'lightweight-charts';

import { gap, PricePoint, rangeStart } from '../asset-stats.helper';
import { TargetLine } from '../target-lines.helper';

export interface Purchase {
  date: string;
  price: number;
}

const RANGES = [
  { days: 30, label: '1 M' },
  { days: 91, label: '3 M' },
  { days: 182, label: '6 M' },
  { days: 365, label: '1 A' },
  { days: 1826, label: '5 A' },
  { days: 0, label: 'Tout' }
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'gf-asset-price-chart',
  styleUrls: ['./asset-price-chart.component.scss'],
  templateUrl: './asset-price-chart.component.html'
})
export class GfAssetPriceChartComponent implements OnChanges, OnDestroy {
  public readonly colorScheme = input<ColorScheme>();
  public readonly currency = input<string>();
  public readonly locale = input(getLocale(), {
    transform: (value?: string) => {
      return value ?? getLocale();
    }
  });
  public readonly points = input<PricePoint[]>([]);
  public readonly purchase = input<Purchase>();
  public readonly targetLines = input<TargetLine[]>([]);

  protected legendDate = '';
  protected legendGaps: { color: string; label: string; value?: number }[] = [];
  protected legendPrice?: number;
  protected range = 365;
  protected readonly ranges = RANGES;

  private chart?: IChartApi;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly chartContainer =
    viewChild<ElementRef<HTMLDivElement>>('chartContainer');
  private series?: ISeriesApi<'Area'>;

  public ngOnChanges() {
    setTimeout(() => {
      this.initialize();
    });
  }

  public ngOnDestroy() {
    this.chart?.remove();
  }

  protected formatGap(value?: number): string {
    if (value === undefined) {
      return '—';
    }

    return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString(
      this.locale(),
      {
        maximumFractionDigits: 0
      }
    )} %`;
  }

  protected formatPrice(value?: number): string {
    if (value === undefined) {
      return '—';
    }

    return `${value.toLocaleString(this.locale(), {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}${this.currency() ? ` ${this.currency()}` : ''}`;
  }

  protected gapClass(value?: number): string {
    if (value === undefined) {
      return '';
    }

    return value >= 0 ? 'text-success' : 'text-danger';
  }

  protected onRange(days: number) {
    this.range = days;
    const points = this.points();
    const last = points[points.length - 1]?.date;

    if (!this.chart || !last) {
      return;
    }

    const from = rangeStart(last, days);

    if (!from || from <= points[0].date) {
      this.chart.timeScale().fitContent();
    } else {
      this.chart.timeScale().setVisibleRange({
        from: from as Time,
        to: last as Time
      });
    }
  }

  private isDark(): boolean {
    const scheme = this.colorScheme();

    if (scheme) {
      return scheme === 'DARK';
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private initialize() {
    this.chart?.remove();
    this.chart = undefined;

    const points = this.points();
    const container = this.chartContainer()?.nativeElement;

    this.updateLegend();

    if (!container || points.length === 0) {
      return;
    }

    const dark = this.isDark();
    const accent = dark ? '#3987e5' : '#2a78d6';
    const text = dark ? '#e8ecf1' : '#0f1720';
    const muted = dark ? '#9aa4b0' : '#5a6573';
    const grid = dark ? 'rgba(232, 236, 241, 0.06)' : 'rgba(15, 23, 32, 0.06)';
    const purchase = this.purchase();
    // seul le prix d'achat reste toujours visible ; les objectifs peuvent sortir du cadre (zoom sur la courbe)
    const levels = purchase ? [purchase.price] : [];

    this.chart = createChart(container, {
      autoSize: true,
      crosshair: {
        horzLine: { color: muted, labelBackgroundColor: text },
        vertLine: { color: muted, labelBackgroundColor: text }
      },
      grid: { horzLines: { color: grid }, vertLines: { visible: false } },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      },
      layout: {
        background: { color: 'transparent' },
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        textColor: muted
      },
      localization: {
        dateFormat: 'dd/MM/yyyy',
        locale: this.locale(),
        priceFormatter: (value: number) => {
          return value.toLocaleString(this.locale(), {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          });
        }
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false }
    });

    this.series = this.chart.addAreaSeries({
      autoscaleInfoProvider: (original: () => any) => {
        const res = original();

        if (!res || levels.length === 0) {
          return res;
        }

        return {
          ...res,
          priceRange: {
            maxValue: Math.max(res.priceRange.maxValue, ...levels),
            minValue: Math.min(res.priceRange.minValue, ...levels)
          }
        };
      },
      bottomColor: dark ? 'rgba(57, 135, 229, 0)' : 'rgba(42, 120, 214, 0)',
      crosshairMarkerBorderColor: dark ? '#151b23' : '#ffffff',
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerRadius: 4,
      lineColor: accent,
      lineWidth: 2,
      priceLineVisible: false,
      topColor: dark ? 'rgba(57, 135, 229, 0.22)' : 'rgba(42, 120, 214, 0.16)'
    });
    this.series.setData(
      points.map(({ date, value }) => {
        return { time: date as Time, value };
      })
    );

    for (const line of this.targetLines()) {
      this.series.createPriceLine({
        axisLabelVisible: true,
        color: line.color,
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        price: line.value
      });
    }

    if (purchase) {
      this.series.createPriceLine({
        axisLabelVisible: true,
        color: muted,
        lineStyle: LineStyle.Dotted,
        lineWidth: 1,
        price: purchase.price,
        title: 'Mon achat'
      });

      const point = points.find(({ date }) => {
        return date >= purchase.date;
      });

      if (point) {
        this.series.setMarkers([
          {
            color: text,
            position: 'belowBar',
            shape: 'arrowUp',
            text: 'Achat',
            time: point.date as Time
          }
        ]);
      }
    }

    this.chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const value = param.time
        ? (param.seriesData.get(this.series!) as { value?: number } | undefined)
            ?.value
        : undefined;

      this.updateLegend(param.time ? String(param.time) : undefined, value);
    });

    this.onRange(this.range);
  }

  private updateLegend(date?: string, price?: number) {
    const points = this.points();
    const last = points[points.length - 1];

    if (!date || price === undefined) {
      date = last?.date;
      price = last?.value;
      this.legendDate = date ? `Au ${this.formatDate(date)}` : '';
    } else {
      this.legendDate = `Le ${this.formatDate(date)}`;
    }

    this.legendPrice = price;
    this.legendGaps = [
      ...this.targetLines().map(({ color, label, value }) => {
        return {
          color,
          label: `→ ${label.split(' · ')[0].toLowerCase()}`,
          value: gap(price, value)
        };
      }),
      ...(this.purchase()
        ? [
            {
              color: '',
              label: 'depuis mon achat',
              value:
                price === undefined
                  ? undefined
                  : price / this.purchase()!.price - 1
            }
          ]
        : [])
    ];
    this.changeDetectorRef.markForCheck();
  }

  private formatDate(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString(this.locale(), {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      weekday: 'short',
      year: 'numeric'
    });
  }
}
