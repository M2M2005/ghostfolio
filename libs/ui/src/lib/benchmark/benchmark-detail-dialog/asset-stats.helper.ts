// Calculs de la fiche d'un actif (modification bourse-custom). Dates au format AAAA-MM-JJ, triées.
export interface PricePoint {
  date: string;
  value: number;
}

const DAY = 86400000;

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - days * DAY)
    .toISOString()
    .slice(0, 10);
}

/** Dernier point à la date donnée ou avant (undefined si l'historique commence après). */
function valueAt(points: PricePoint[], date: string): number | undefined {
  let found: number | undefined;

  for (const point of points) {
    if (point.date > date) {
      break;
    }

    found = point.value;
  }

  return found;
}

/** Variation du dernier cours depuis `days` jours. */
export function changeSince(
  points: PricePoint[],
  days: number
): number | undefined {
  const last = points[points.length - 1];

  if (!last) {
    return undefined;
  }

  const before = valueAt(points, shift(last.date, days));

  return before ? last.value / before - 1 : undefined;
}

/** Variation depuis la dernière clôture de l'année précédente. */
export function changeYtd(points: PricePoint[]): number | undefined {
  const last = points[points.length - 1];

  if (!last) {
    return undefined;
  }

  const before = valueAt(points, `${Number(last.date.slice(0, 4)) - 1}-12-31`);

  return before ? last.value / before - 1 : undefined;
}

export function range52w(
  points: PricePoint[]
): { high: number; low: number } | undefined {
  const last = points[points.length - 1];

  if (!last) {
    return undefined;
  }

  const from = shift(last.date, 365);
  const values = points
    .filter(({ date }) => {
      return date >= from;
    })
    .map(({ value }) => {
      return value;
    });

  return { high: Math.max(...values), low: Math.min(...values) };
}

/** Premier jour affiché pour une période de `days` jours (0 = tout l'historique). */
export function rangeStart(lastDate: string, days: number): string | undefined {
  return days ? shift(lastDate, days) : undefined;
}

export function gap(price?: number, target?: number): number | undefined {
  return price && target ? target / price - 1 : undefined;
}
