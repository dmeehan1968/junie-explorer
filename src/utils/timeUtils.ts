/**
 * Utility functions for formatting time values
 */

/**
 * Format milliseconds as HH:MM:SS.MS
 * @param milliseconds Time in milliseconds
 * @returns Formatted time string
 */
export function formatMilliseconds(milliseconds: number): string {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return '00:00:00.000';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const ms = Math.floor(milliseconds % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds as HH:MM:SS
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}