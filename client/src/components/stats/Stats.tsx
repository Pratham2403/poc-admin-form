import * as React from "react";
import { useState, ReactNode } from "react";
import { StatCard } from "./StatCard";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

export type TimeFilter = "today" | "month" | "all";

interface StatItem {
  icon: ReactNode;
  title: string;
  value: number | string;
}

interface StatsProps {
  stats: StatItem[];
  onTimeFilterChange?: (filter: TimeFilter) => void;
  className?: string;
}

export const Stats: React.FC<StatsProps> = ({
  stats,
  onTimeFilterChange,
  className,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    onTimeFilterChange?.(filter);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Filter Buttons */}
      {onTimeFilterChange && (
        <div className="flex items-center gap-2">
          <Button
            variant={timeFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeFilterChange("today")}
          >
            Today
          </Button>
          <Button
            variant={timeFilter === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeFilterChange("month")}
          >
            This Month
          </Button>
          <Button
            variant={timeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeFilterChange("all")}
          >
            All Time
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
          />
        ))}
      </div>
    </div>
  );
};

