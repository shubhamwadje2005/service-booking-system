export const BUSINESS_HOURS_START = "09:00";
export const BUSINESS_HOURS_END = "18:00";

/**
 * Converts a time string (HH:mm or HH:mm:ss) to total minutes from midnight.
 */
export const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.trim().split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  return hours * 60 + minutes;
};

/**
 * Converts total minutes from midnight to a 24-hour time string (HH:mm).
 */
export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Adds minutes to an existing time string and returns the resulting time in HH:mm.
 */
export const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const total = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(total);
};

/**
 * Strictly evaluates whether two time intervals overlap.
 * Mathematical rule: newStart < existingEnd AND newEnd > existingStart.
 */
export const isOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
};

/**
 * Strictly verifies whether a date string is formatted as YYYY-MM-DD and represents
 * a valid Gregorian calendar date (e.g. rejects 2026-02-30, 2026-04-31).
 */
export const isValidDateString = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Checks if a given YYYY-MM-DD date is strictly in the past (before today).
 */
export const isPastDate = (dateStr: string): boolean => {
  return dateStr < getTodayDateString();
};

/**
 * Checks if a given time slot for today's date has already passed.
 */
export const isPastTimeToday = (dateStr: string, timeStr: string): boolean => {
  const today = getTodayDateString();
  if (dateStr < today) {
    return true;
  }
  if (dateStr > today) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(timeStr) <= currentMinutes;
};
