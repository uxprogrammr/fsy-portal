/**
 * Utility functions for handling date and time in the Philippines timezone (Asia/Manila)
 */

/**
 * Get the current date and time in Philippines timezone
 * @returns Date object in Philippines timezone
 */
export function getCurrentDateTimeInPH(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
}

/**
 * Format a date to a localized string in Philippines timezone
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDateTimeInPH(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }
): string {
  return date.toLocaleString('en-US', { ...options, timeZone: 'Asia/Manila' });
}

/**
 * Format a time string to 12-hour format in Philippines timezone
 * @param timeString Time string in HH:MM:SS format
 * @returns Formatted time string
 */
export function formatTimeInPH(timeString: string | undefined | null): string {
  // Return empty string if timeString is undefined or null
  if (!timeString) {
    return '';
  }
  
  // Create a date object with the time string in Philippines timezone
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
}

/**
 * Get current time string in HH:MM:SS format in Philippines timezone
 * @returns Time string in HH:MM:SS format
 */
export function getCurrentTimeStringInPH(): string {
  const now = getCurrentDateTimeInPH();
  return now.toTimeString().split(' ')[0];
} 