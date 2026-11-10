import { prisma } from "@/lib/prisma";
import type { NormalizedObservation } from "@/data/core/types";

export function periodBounds(
  obs: Pick<NormalizedObservation, "periodType" | "year" | "quarter" | "month" | "referenceDate">,
) {
  if (obs.periodType === "YEAR") {
    return { startDate: new Date(Date.UTC(obs.year, 0, 1)), endDate: new Date(Date.UTC(obs.year, 11, 31)) };
  }
  if (obs.periodType === "QUARTER") {
    const q = obs.quarter ?? 1;
    const startMonth = (q - 1) * 3;
    return {
      startDate: new Date(Date.UTC(obs.year, startMonth, 1)),
      endDate: new Date(Date.UTC(obs.year, startMonth + 3, 0)),
    };
  }
  if (obs.periodType === "MONTH") {
    const m = obs.month ?? 1;
    return {
      startDate: new Date(Date.UTC(obs.year, m - 1, 1)),
      endDate: new Date(Date.UTC(obs.year, m, 0)),
    };
  }
  if (obs.periodType === "DATE") {
    // A DATE period is a point-in-time stock measurement (e.g. Statbel's
    // legal population "op 1 januari"), not a range — start and end both
    // pin to the exact reference date so it's never mistaken for an
    // annual average.
    if (!obs.referenceDate) {
      throw new Error("DATE period type requires a referenceDate");
    }
    return { startDate: obs.referenceDate, endDate: obs.referenceDate };
  }
  throw new Error(`Unsupported period type for bounds calculation: ${obs.periodType}`);
}

// Postgres unique constraints treat NULL as distinct from NULL, so a
// nullable column can't be relied on for upsert matching. 0 is used as an
// explicit "not applicable" sentinel for quarter/month on YEAR periods.
const NOT_APPLICABLE = 0;

/** Finds or creates the StatisticalPeriod row for a normalized observation's period. */
export async function resolvePeriodId(
  obs: Pick<
    NormalizedObservation,
    "periodType" | "year" | "quarter" | "month" | "periodLabel" | "referenceDate"
  >,
): Promise<string> {
  const { startDate, endDate } = periodBounds(obs);
  const quarter = obs.quarter ?? NOT_APPLICABLE;
  // DATE periods (e.g. one Jan-1 population snapshot per year) only ever
  // have one occurrence per year in practice, so the sentinel isn't needed
  // to disambiguate them — the reference date's month is stored for
  // informational purposes instead.
  const month = obs.periodType === "DATE" && obs.referenceDate
    ? obs.referenceDate.getUTCMonth() + 1
    : obs.month ?? NOT_APPLICABLE;
  const period = await prisma.statisticalPeriod.upsert({
    where: {
      periodType_year_quarter_month: {
        periodType: obs.periodType,
        year: obs.year,
        quarter,
        month,
      },
    },
    create: {
      periodType: obs.periodType,
      year: obs.year,
      quarter,
      month,
      label: obs.periodLabel,
      startDate,
      endDate,
      referenceDate: obs.referenceDate,
    },
    update: {},
  });
  return period.id;
}
