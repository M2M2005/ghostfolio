// Graphique « performance depuis l'achat » : une courbe par position + le portefeuille
// (modification bourse-custom, d'après benchmark-comparator).
import {
  getChartBorderColor,
  getChartElementsOptions,
  getTimeAxisOptions,
  getValueAxisOptions,
  getVerticalHoverLinePlugin,
  getZeroLineAnnotation
} from '@ghostfolio/common/chart-helper';
import { primaryColorRgb } from '@ghostfolio/common/config';
import { getLocale, parseDate } from '@ghostfolio/common/helper';
import { LineChartItem } from '@ghostfolio/common/interfaces';
import { ColorScheme } from '@ghostfolio/common/types';
import {
  getTimeSeriesTooltipOptions,
  onPrefersColorSchemeChange,
  registerChartConfiguration
} from '@ghostfolio/ui/chart';

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
  Chart,
  ChartData,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

export interface HoldingSeries {
  dataItems: LineChartItem[];
  name: string;
}

// Palette catégorielle validée (contraste et daltonisme), dans un ordre fixe.
const COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948'
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

  protected chart?: Chart<'line'>;
  protected legend: LegendItem[] = [];

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly chartCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  public constructor() {
    Chart.register(
      LinearScale,
      LineController,
      LineElement,
      PointElement,
      TimeScale,
      Tooltip
    );

    registerChartConfiguration();

    onPrefersColorSchemeChange(() => {
      if (this.chart && !this.colorScheme()) {
        this.chart.destroy();
        this.chart = undefined;

        this.initialize();
      }
    });
  }

  public ngOnChanges() {
    this.chart?.destroy();
    this.chart = undefined;

    this.initialize();
  }

  public ngOnDestroy() {
    this.chart?.destroy();
  }

  protected formatPercent(value?: number): string {
    if (value === undefined) {
      return '—';
    }

    return `${value >= 0 ? '+' : ''}${(value * 100).toLocaleString(
      this.locale(),
      { maximumFractionDigits: 1, minimumFractionDigits: 1 }
    )} %`;
  }

  protected valueClass(value?: number): string {
    if (value === undefined) {
      return '';
    }

    return value >= 0 ? 'text-success' : 'text-danger';
  }

  protected onToggle(index: number) {
    const item = this.legend[index];

    item.visible = !item.visible;
    this.chart?.setDatasetVisibility(index, item.visible);
    this.chart?.update();
  }

  private initialize() {
    const portfolioColor = `rgb(${primaryColorRgb.r}, ${primaryColorRgb.g}, ${primaryColorRgb.b})`;

    const series = [
      ...(this.portfolioDataItems().length > 0
        ? [
            {
              color: portfolioColor,
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
            color: COLORS[index % COLORS.length],
            dataItems,
            isPortfolio: false,
            name
          };
        })
    ];

    this.legend = series.map(({ color, dataItems, isPortfolio, name }) => {
      return {
        color,
        isPortfolio,
        name,
        value: dataItems[dataItems.length - 1]?.value,
        visible: true
      };
    });

    const data: ChartData<'line'> = {
      datasets: series.map(({ color, dataItems, isPortfolio, name }) => {
        return {
          backgroundColor: color,
          borderColor: color,
          borderWidth: isPortfolio ? 3 : 2,
          data: dataItems.map(({ date, value }) => {
            return { x: parseDate(date)?.getTime() ?? null, y: value * 100 };
          }),
          label: name
        };
      })
    };

    const canvas = this.chartCanvas();

    if (!canvas || series.length === 0) {
      return;
    }

    this.chart = new Chart<'line'>(canvas.nativeElement, {
      data,
      options: {
        animation: false,
        elements: getChartElementsOptions(this.colorScheme()),
        interaction: { intersect: false, mode: 'index' },
        maintainAspectRatio: true,
        onHover: (_event, elements) => {
          this.updateLegendValues(
            elements.map(({ datasetIndex, index }) => {
              return { datasetIndex, index };
            })
          );
        },
        plugins: {
          annotation: {
            annotations: { yAxis: getZeroLineAnnotation(this.colorScheme()) }
          },
          legend: { display: false },
          tooltip: getTimeSeriesTooltipOptions<'line'>({
            colorScheme: this.colorScheme(),
            locale: this.locale(),
            unit: '%'
          }),
          verticalHoverLine: { color: getChartBorderColor(this.colorScheme()) }
        },
        responsive: true,
        scales: {
          x: getTimeAxisOptions({
            colorScheme: this.colorScheme(),
            locale: this.locale()
          }),
          y: getValueAxisOptions({
            colorScheme: this.colorScheme(),
            tickCallback: (tickValue) => {
              return `${Number(tickValue).toFixed(0)} %`;
            }
          })
        }
      },
      plugins: [getVerticalHoverLinePlugin(canvas, this.colorScheme())],
      type: 'line'
    });

    this.changeDetectorRef.markForCheck();
  }

  private updateLegendValues(
    points: { datasetIndex: number; index: number }[]
  ) {
    if (!this.chart) {
      return;
    }

    if (points.length === 0) {
      this.legend.forEach((item, i) => {
        const values = this.chart?.data.datasets[i].data as { y: number }[];
        item.value = values[values.length - 1]?.y / 100;
      });
    } else {
      this.legend.forEach((item) => {
        item.value = undefined;
      });

      for (const { datasetIndex, index } of points) {
        const point = this.chart.data.datasets[datasetIndex].data[index] as {
          y: number;
        };

        this.legend[datasetIndex].value = point?.y / 100;
      }
    }

    this.changeDetectorRef.markForCheck();
  }
}
