// Deprecated shim: money helpers now live inline with consumers.
// Keeping exports for compatibility in case of lingering imports.

const toCentsCompat = (amount: number): number => {
	if (!Number.isFinite(amount)) return 0;
	return Math.round(amount * 100);
};

const fromCentsCompat = (cents: number): number => cents / 100;

export const toCents = toCentsCompat;
export const fromCents = fromCentsCompat;
export const ensureNonNegative = (cents: number): number => (cents < 0 ? 0 : cents);
export const formatMoney = (cents: number, locale = 'en', currency = 'SAR'): string =>
	new Intl.NumberFormat(locale, { style: 'currency', currency }).format(fromCentsCompat(cents));
