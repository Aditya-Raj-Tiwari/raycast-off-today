/**
 * Format ISO date string to a more readable format
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(
  dateToCheck: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean {
  const checkDate = new Date(dateToCheck);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time components for accurate date comparison
  checkDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return checkDate >= start && checkDate <= end;
}