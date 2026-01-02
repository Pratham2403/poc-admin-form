import { AppError } from "../errors/AppError";

/**
 * Escape special regex characters to prevent ReDoS attacks.
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build a safe case-insensitive regex from user input.
 */
export const buildSafeRegex = (search: string, maxLength = 128): RegExp => {
  const trimmed = search.slice(0, maxLength);
  return new RegExp(escapeRegex(trimmed), "i");
};

/**
 * Build date filter using explicit date range.
 * Expects UTC ISO strings (the client converts IST wall-time to UTC instants).
 */
export const buildDateRangeFilter = (
  startDate?: string,
  endDate?: string,
  field: string = "createdAt"
): Record<string, unknown> => {
  if (!startDate && !endDate) return {};

  const filter: Record<string, Date> = {};

  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      throw AppError.badRequest("Invalid startDate");
    }
    filter.$gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      throw AppError.badRequest("Invalid endDate");
    }
    filter.$lte = end;
  }

  if (filter.$gte && filter.$lte && filter.$gte > filter.$lte) {
    throw AppError.badRequest("startDate must be <= endDate");
  }

  return { [field]: filter };
};

/**
 * Helper function to format hour in 12-hour format
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
}
