/**
 * Date Utilities Module
 * Pure date manipulation functions for streak and recovery calculations
 */

/**
 * Get start of day (00:00:00) for a given date
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of week (Sunday 00:00:00) for a given date
 */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day; // Sunday is 0, so subtract 0-6 days
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Get end of week (Saturday 23:59:59) for a given date
 */
export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const week1 = startOfWeek(d1);
  const week2 = startOfWeek(d2);
  return week1.getTime() === week2.getTime();
}

/**
 * Calculate number of days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const day1 = startOfDay(d1);
  const day2 = startOfDay(d2);
  const diff = day2.getTime() - day1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate number of weeks between two dates
 */
export function weeksBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const week1 = startOfWeek(d1);
  const week2 = startOfWeek(d2);
  const diff = week2.getTime() - week1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

/**
 * Get today's date at start of day
 */
export function today(): Date {
  return startOfDay(new Date());
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}
