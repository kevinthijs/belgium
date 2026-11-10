import Decimal from "decimal.js";

/**
 * Centralized Belgian-Dutch number/money formatters. Components must never
 * format financial numbers ad hoc — always go through these utilities so
 * "€ 706,6 miljard" style output stays consistent across the app.
 */

type NumberInput = Decimal | number | string;

function toDecimal(value: NumberInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

/** 706581000000 -> "€ 706,6 miljard" */
export function formatCompactCurrency(value: NumberInput, locale = "nl-BE"): string {
  const d = toDecimal(value);
  const abs = d.abs();
  let scaled: Decimal;
  let suffix: string;

  if (abs.gte(1_000_000_000)) {
    scaled = d.div(1_000_000_000);
    suffix = "miljard";
  } else if (abs.gte(1_000_000)) {
    scaled = d.div(1_000_000);
    suffix = "miljoen";
  } else if (abs.gte(1_000)) {
    scaled = d.div(1_000);
    suffix = "duizend";
  } else {
    scaled = d;
    suffix = "";
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: suffix ? 1 : 0,
    maximumFractionDigits: suffix ? 1 : 0,
  }).format(scaled.toNumber());

  return suffix ? `€ ${formatted} ${suffix}` : `€ ${formatted}`;
}

/** 706581000000 -> "€ 706.581.000.000" (full precision, grouped) */
export function formatCurrency(value: NumberInput, locale = "nl-BE"): string {
  const d = toDecimal(value);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(d.toNumber());
  return `€ ${formatted}`;
}

/** 109.14 -> "109,1%" */
export function formatPercentage(value: NumberInput, locale = "nl-BE", fractionDigits = 1): string {
  const d = toDecimal(value);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(d.toNumber());
  return `${formatted}%`;
}

/** 12450 -> "€ 12.450 per inwoner" */
export function formatPerCapita(value: NumberInput, locale = "nl-BE"): string {
  const d = toDecimal(value);
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(d.toNumber());
  return `€ ${formatted} per inwoner`;
}

export function formatInteger(value: NumberInput, locale = "nl-BE"): string {
  const d = toDecimal(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(d.toNumber());
}

/** Signed delta, e.g. +€ 12,3 miljard / -€ 3,1 miljard */
export function formatDelta(value: NumberInput, locale = "nl-BE"): string {
  const d = toDecimal(value);
  const sign = d.isNegative() ? "-" : "+";
  return `${sign}${formatCompactCurrency(d.abs(), locale)}`;
}

/** StatisticalPeriod label -> human label, e.g. "2026-Q1" -> "eerste kwartaal 2026" */
export function formatPeriod(label: string): string {
  const quarterMatch = /^(\d{4})-Q(\d)$/.exec(label);
  if (quarterMatch) {
    const ordinals = ["eerste", "tweede", "derde", "vierde"];
    const q = Number(quarterMatch[2]);
    return `${ordinals[q - 1] ?? `${q}e`} kwartaal ${quarterMatch[1]}`;
  }
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(label);
  if (monthMatch) {
    const months = [
      "januari", "februari", "maart", "april", "mei", "juni",
      "juli", "augustus", "september", "oktober", "november", "december",
    ];
    return `${months[Number(monthMatch[2]) - 1]} ${monthMatch[1]}`;
  }
  return label;
}
