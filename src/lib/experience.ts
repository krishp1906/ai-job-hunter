/**
 * Dynamic Experience Calculator for Candidate Profile
 * 
 * Accurately calculates elapsed professional experience from employment dates,
 * respecting manual overrides if specified by the candidate.
 */

export interface ExperienceResult {
  years: number;
  months: number;
  decimalYears: number;
  formatted: string;
  isManualOverride: boolean;
}

export function calculateExperienceFromDates(
  startDate: Date,
  endDate: Date = new Date()
): { years: number; months: number; decimalYears: number; formatted: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  // Account for partial month if end day is before start day
  if (end.getDate() < start.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const decimalYears = Math.round((totalMonths / 12) * 10) / 10;

  let formatted = "";
  if (years === 0) {
    formatted = `${remainingMonths} mos`;
  } else if (remainingMonths === 0) {
    formatted = `${years} yr${years > 1 ? "s" : ""}`;
  } else {
    formatted = `${years} yr${years > 1 ? "s" : ""} ${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
  }

  return {
    years,
    months: remainingMonths,
    decimalYears,
    formatted,
  };
}

export function getEffectiveCandidateExperience(
  employmentStartDate: Date,
  manualExperienceYears?: number | null
): ExperienceResult {
  if (manualExperienceYears != null && manualExperienceYears > 0) {
    const years = Math.floor(manualExperienceYears);
    const months = Math.round((manualExperienceYears - years) * 12);
    return {
      years,
      months,
      decimalYears: manualExperienceYears,
      formatted: `${manualExperienceYears} yrs (Manual)`,
      isManualOverride: true,
    };
  }

  const calculated = calculateExperienceFromDates(employmentStartDate);
  return {
    ...calculated,
    isManualOverride: false,
  };
}
