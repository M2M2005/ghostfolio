import { AnalystData } from '@ghostfolio/common/interfaces';
import { ColorScheme } from '@ghostfolio/common/types';
import { DataSource } from '@ghostfolio/prisma/enums';

export interface BenchmarkDetailDialogParams {
  /** bourse-custom : objectifs d'analystes à tracer sur le graphique */
  analyst?: AnalystData;
  colorScheme?: ColorScheme;
  dataSource: DataSource;
  deviceType: string;
  locale: string;
  symbol: string;
}
