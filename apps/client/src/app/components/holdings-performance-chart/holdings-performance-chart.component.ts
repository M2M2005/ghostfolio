// Graphique « performance depuis l'achat » : une courbe par position + le portefeuille.
// Même bibliothèque et même style que bourse.cyprienbons.com (modification bourse-custom).
import { getLocale } from '@ghostfolio/common/helper';
import { LineChartItem } from '@ghostfolio/common/interfaces';
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
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

export interface HoldingSeries {
  dataItems: LineChartItem[];
  name: string;
}

// Palette catégorielle de bourse.cyprienbons.com (validée contraste / daltonisme), ordre fixe.
const COLORS_LIGHT = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948'
];
const COLORS_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#0ca30c',
  '#9085e9',
  '#e66767'
];

const RANGES = [
  { days: 7, label: '1 S' },
  { days: 30, label: '1 M' },
  { days: 90, label: '3 M' },
  { days: 365, label: '1 A' },
  { days: 0, label: 'Tout' }
];

interface LegendItem {
  color: string;
  isPortfolio: boolean;
  name: string;
  value?: number;
  visible: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxSkeletonLoaderModule],
  selector: 'gf-holdings-performance-chart',
  styleUrls: ['./holdings-performance-chart.component.scss'],
  templateUrl: './holdings-performance-chart.component.html'
})
export class GfHoldingsPerformanceChartComponent
  implements OnChanges, OnDestroy
{
  public readonly colorScheme = input<ColorScheme>();
  public readonly holdings = input<HoldingSeries[]>([]);
  public readonly isLoading = input<boolean>();

  public readonly locale = input(getLocale(), {
    transform: (value?: string) => {
      return value ?? getLocale();
    }
  });

  public readonly portfolioDataItems = input<LineChartItem[]>([]);

  protected legend: LegendItem[] = [];
  protected legendDate = '';
  protected range = 0;
  protected readonly ranges = RANGES;

  private chart?: IChartApi;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly chartContainer =
    viewChild<ElementRef<HTMLDivElement>>('chartContainer');
  private lastDate?: string;
  private series: ISeriesApi<'Line'>[] = [];
  private seriesData: { time: string; value: number }[][] = [];

  public ngOnChanges() {
    // laisse le temps au conteneur d'apparaître (il est masqué pendant le chargement)
    setTimeout(() => {
      this.initialize();
    });
  }

  public ngOnDestroy() {
    this.chart?.remove();
  }

  protected formatPercent(value?: number): string {
    if (value === undefined) {
      return '—';
    }

    return `${value >= 0 ? '+' : ''}${value.toLocaleString(this.locale(), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1
    })} %`;
  }

  protected valueClass(value?: number): string {
    if (value === undefined) {
      return '';
    }

    return value >= 0 ? 'text-success' : 'text-danger';
  }

  protected onRange(days: number) {
    this.range = days;

    if (!this.chart || !this.lastDate) {
      return;
    }

    if (!days) {
      this.chart.timeScale().fitContent();
    } else {
      const to = new Date(`${this.lastDate}T00:00:00Z`);
      const from = new Date(to.getTime() - days * 86400000);

      this.chart.timeScale().setVisibleRange({
        from: from.toISOString().slice(0, 10) as Time,
        to: this.lastDate as Time
      });
    }
  }

  protected onToggle(index: number) {
    const item = this.legend[index];

    item.visible = !item.visible;
    this.series[index]?.applyOptions({ visible: item.visible });
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
    this.series = [];
    this.seriesData = [];

    const dark = this.isDark();
    const palette = dark ? COLORS_DARK : COLORS_LIGHT;
    const text = dark ? '#e8ecf1' : '#0f1720';
    const muted = dark ? '#9aa4b0' : '#5a6573';
    const grid = dark ? 'rgba(232, 236, 241, 0.06)' : 'rgba(15, 23, 32, 0.06)';

    const lines = [
      ...(this.portfolioDataItems().length > 0
        ? [
            {
              color: text,
              dataItems: this.portfolioDataItems(),
              isPortfolio: true,
              name: $localize`Portfolio`
            }
          ]
        : []),
      ...this.holdings()
        .filter(({ dataItems }) => {
          return dataItems.length > 0;
        })
        .map(({ dataItems, name }, index) => {
          return {
            color: palette[Math.min(index, palette.length - 1)],
            dataItems,
            isPortfolio: false,
            name
          };
        })
    ];

    this.legend = lines.map(({ color, dataItems, isPortfolio, name }) => {
      return {
        color,
        isPortfolio,
        name,
        value: dataItems[dataItems.length - 1].value * 100,
        visible: true
      };
    });
    this.lastDate = lines[0]?.dataItems[lines[0].dataItems.length - 1].date;
    this.legendDate = this.lastDate
      ? `Au ${this.formatDate(this.lastDate)}`
      : '';
    this.changeDetectorRef.markForCheck();

    const container = this.chartContainer()?.nativeElement;

    if (!container || lines.length === 0) {
      return;
    }

    this.chart = createChart(container, {
      autoSize: true,
      crosshair: {
        horzLine: { color: muted, labelBackgroundColor: text },
        vertLine: { color: muted, labelBackgroundColor: text }
      },
      grid: { horzLines: { color: grid }, vertLines: { visible: false } },
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
          return this.formatPercent(value);
        }
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false }
    });

    // dessinées en ordre inverse : le portefeuille par-dessus
    [...lines].reverse().forEach((line) => {
      const data = line.dataItems.map(({ date, value }) => {
        return { time: date, value: value * 100 };
      });
      const series = this.chart!.addLineSeries({
        color: line.color,
        crosshairMarkerBorderColor: dark ? '#151b23' : '#ffffff',
        crosshairMarkerBorderWidth: 2,
        crosshairMarkerRadius: 4,
        lastValueVisible: line.isPortfolio,
        lineWidth: line.isPortfolio ? 3 : 2,
        priceLineVisible: false
      });

      series.setData(data as { time: Time; value: number }[]);
      this.series.unshift(series);
      this.seriesData.unshift(data);
    });

    this.series[0].createPriceLine({
      axisLabelVisible: false,
      color: muted,
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      price: 0
    });

    this.chart.subscribeCrosshairMove((param: MouseEventParams) => {
      this.onCrosshair(param);
    });

    this.onRange(this.range);
  }

  private onCrosshair(param: MouseEventParams) {
    if (!param.time) {
      this.legend.forEach((item, i) => {
        const data = this.seriesData[i];
        item.value = data[data.length - 1]?.value;
      });
      this.legendDate = this.lastDate
        ? `Au ${this.formatDate(this.lastDate)}`
        : '';
    } else {
      this.legendDate = `Le ${this.formatDate(String(param.time))}`;
      this.legend.forEach((item, i) => {
        const point = param.seriesData.get(this.series[i]) as
          { value?: number } | undefined;
        item.value = point?.value;
      });
    }

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
