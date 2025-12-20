/**
 * Build date filter for time-based queries
 */
export const buildDateFilter = (timeFilter: string): Record<string, unknown> => {
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
  