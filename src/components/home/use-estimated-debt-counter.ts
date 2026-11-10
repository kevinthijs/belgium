"use client";

import { useEffect, useState } from "react";

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

export interface EstimatedDebtCounterInput {
  /** Raw EUR value at `referenceTimestamp`. */
  referenceValue: string;
  referenceTimestamp: string; // ISO
  /** Estimated EUR change per year, may be negative. */
  estimatedAnnualChange: string;
  /** Same server-provided instant for SSR and the first client render. */
  initialTimestampMs: number;
}

export interface EstimatedDebtCounterState {
  estimatedCurrentDebt: number;
  changePerSecond: number;
  changePerMinute: number;
  changePerDay: number;
  isIncreasing: boolean;
}

/**
 * Pure local animation: extrapolates linearly from the last official
 * observation. Never fetches from the server on an interval — all inputs
 * are server-provided once per page load.
 */
export function useEstimatedDebtCounter(input: EstimatedDebtCounterInput): EstimatedDebtCounterState {
  const referenceValue = Number(input.referenceValue);
  const referenceTimestampMs = new Date(input.referenceTimestamp).getTime();
  const annualChange = Number(input.estimatedAnnualChange);
  const changePerSecond = annualChange / SECONDS_PER_YEAR;

  const computeValue = (timestampMs = Date.now()) => {
    const secondsSinceReference = (timestampMs - referenceTimestampMs) / 1000;
    return referenceValue + annualChange * (secondsSinceReference / SECONDS_PER_YEAR);
  };

  const [estimatedCurrentDebt, setEstimatedCurrentDebt] = useState(() => computeValue(input.initialTimestampMs));

  useEffect(() => {
    const interval = setInterval(() => setEstimatedCurrentDebt(computeValue()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.referenceValue, input.referenceTimestamp, input.estimatedAnnualChange]);

  return {
    estimatedCurrentDebt,
    changePerSecond,
    changePerMinute: changePerSecond * 60,
    changePerDay: changePerSecond * 60 * 60 * 24,
    isIncreasing: changePerSecond >= 0,
  };
}
