/**
 * Build date filter for time-based queries
 */
const IST_OFFSET_MINUTES = 5 * 60 + 30;

const getISTDateParts = (date: Date) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
  };
};

const startOfISTDayUTC = (date: Date) => {
  const { year, month, day } = getISTDateParts(date);
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MINUTES * 60 * 1000);
};

const startOfISTMonthUTC = (date: Date) => {
  const { year, month } = getISTDateParts(date);
  return new Date(Date.UTC(year, month, 1) - IST_OFFSET_MINUTES * 60 * 1000);
};

export const buildDateFilter = (
  timeFilter: string,
  field: string = "createdAt"
): Record<string, unknown> => {
  const now = new Date();

  if (timeFilter === "today") {
    const start = startOfISTDayUTC(now);
    return { [field]: { $gte: start } };
  }
  if (timeFilter === "month") {
    const start = startOfISTMonthUTC(now);
    return { [field]: { $gte: start } };
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
