export interface FormatNumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(options: FormatNumberOptions = {}): Intl.NumberFormat {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
  const key = `${minimumFractionDigits}:${maximumFractionDigits}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(value: number | string | null | undefined, options?: FormatNumberOptions): string {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  const safeValue = typeof numericValue === 'number' && Number.isFinite(numericValue) ? numericValue : 0;
  return getFormatter(options).format(safeValue);
}

export function formatInteger(value: number | string | null | undefined): string {
  return formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatPercent(value: number | string | null | undefined, fractionDigits = 2): string {
  return `${formatNumber(value, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`;
}
