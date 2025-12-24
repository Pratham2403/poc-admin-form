/**
 * Build date filter for time-based queries
 */
export const buildDateFilter = (
  timeFilter: string
): Record<string, unknown> => {
  const now = new Date();
  if (timeFilter === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { createdAt: { $gte: start } };
  }
  if (timeFilter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { createdAt: { $gte: start } };
  }
  return {};
};



/**
 * Helper function to format hour in 12-hour format
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
}
