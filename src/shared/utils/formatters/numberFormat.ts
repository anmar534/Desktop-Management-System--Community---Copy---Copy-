export interface FormatNumberOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

const DEFAULT_LOCALE = 'ar-SA'

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(options: FormatNumberOptions = {}): Intl.NumberFormat {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2, locale = DEFAULT_LOCALE } = options
  const cacheKey = `${locale}:${minimumFractionDigits}:${maximumFractionDigits}`
  let formatter = formatterCache.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    })
    formatterCache.set(cacheKey, formatter)
  }
  return formatter
}

const coerceNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    )
    const parsed = Number(normalized.trim())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function formatNumber(
  value: number | string | null | undefined,
  options?: FormatNumberOptions,
): string {
  const safeValue = coerceNumber(value)
  return getFormatter(options).format(safeValue)
}

export function formatInteger(
  value: number | string | null | undefined,
  options?: Pick<FormatNumberOptions, 'locale'>,
): string {
  return formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 0, ...options })
}

export function formatPercent(
  value: number | string | null | undefined,
  fractionDigits = 2,
  options?: Pick<FormatNumberOptions, 'locale'>,
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE
  const numeric = coerceNumber(value)
  const percentFormatter = getFormatter({
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    locale,
  })
  const formatted = percentFormatter.format(numeric)
  return `${formatted}٪`
}
