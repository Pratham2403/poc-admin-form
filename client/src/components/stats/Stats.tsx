import * as React from "react";
import { type ReactNode } from "react";
import { StatCard } from "./StatCard";
import { cn } from "../../lib/utils";
import { SearchFilterBar } from "../search-filter/SearchFilterBar";

import { type DateRange, type TimePreset } from "../../utils/dateRange.utils";

interface StatItem {
  icon: ReactNode;
  title: string;
  value: number | string;
  hoverContent?: ReactNode;
}

interface StatsProps {
  stats: StatItem[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showTimePresets?: boolean;
  showDateRange?: boolean;
  className?: string;
}

export const Stats: React.FC<StatsProps> = ({
  stats,
  dateRange,
  onDateRangeChange,
  showTimePresets = true,
  showDateRange = false,
  className,
}) => {
  const canFilter = !!onDateRangeChange;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters are composed via SearchFilterBar (SRP/SOLID) */}
      {canFilter && (showTimePresets || showDateRange) && (
        <SearchFilterBar
          className="mb-0"
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          showTimePresets={showTimePresets}
          showDateRange={showDateRange}
          presets={["today", "month", "all"] satisfies TimePreset[]}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-6 gap-4 mt-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            hoverContent={stat.hoverContent}
          />
        ))}
      </div>
    </div>
  );
};
