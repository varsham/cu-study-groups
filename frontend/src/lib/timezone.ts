// ABOUTME: Timezone utilities for CU Study Groups
// ABOUTME: Handles formatting dates in Eastern Time for Columbia

import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const EASTERN_TIMEZONE = "America/New_York";

/**
 * Format a date string for display in Eastern Time.
 * @param isoString - ISO 8601 date string from database
 * @returns Formatted date like "Friday, January 17, 2026"
 */
export function formatDate(isoString: string): string {
  const date = parseISO(isoString);
  return formatInTimeZone(date, EASTERN_TIMEZONE, "EEEE, MMMM d, yyyy");
}

/**
 * Format a time string for display in Eastern Time.
 * @param isoString - ISO 8601 date string from database
 * @returns Formatted time like "3:00 PM"
 */
export function formatTime(isoString: string): string {
  const date = parseISO(isoString);
  return formatInTimeZone(date, EASTERN_TIMEZONE, "h:mm a");
}

/**
 * Format a time range for display.
 * @param startIso - ISO 8601 start time
 * @param endIso - ISO 8601 end time
 * @returns Formatted range like "3:00 PM – 5:00 PM"
 */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/**
 * Format a short date for compact display.
 * @param isoString - ISO 8601 date string
 * @returns Formatted date like "Jan 17"
 */
export function formatShortDate(isoString: string): string {
  const date = parseISO(isoString);
  return formatInTimeZone(date, EASTERN_TIMEZONE, "MMM d");
}

/**
 * Check if a date is today.
 * @param isoString - ISO 8601 date string
 * @returns True if the date is today in Eastern Time
 */
export function isToday(isoString: string): boolean {
  const date = parseISO(isoString);
  const now = new Date();
  const dateInET = formatInTimeZone(date, EASTERN_TIMEZONE, "yyyy-MM-dd");
  const nowInET = formatInTimeZone(now, EASTERN_TIMEZONE, "yyyy-MM-dd");
  return dateInET === nowInET;
}

/**
 * Get relative day label (Today, Tomorrow, or date).
 * @param isoString - ISO 8601 date string
 * @returns "Today", "Tomorrow", or formatted date
 */
export function getRelativeDay(isoString: string): string {
  const date = parseISO(isoString);
  const now = new Date();

  const dateInET = formatInTimeZone(date, EASTERN_TIMEZONE, "yyyy-MM-dd");
  const nowInET = formatInTimeZone(now, EASTERN_TIMEZONE, "yyyy-MM-dd");

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowInET = formatInTimeZone(
    tomorrow,
    EASTERN_TIMEZONE,
    "yyyy-MM-dd",
  );

  if (dateInET === nowInET) {
    return "Today";
  } else if (dateInET === tomorrowInET) {
    return "Tomorrow";
  } else {
    return formatInTimeZone(date, EASTERN_TIMEZONE, "EEEE, MMM d");
  }
}
