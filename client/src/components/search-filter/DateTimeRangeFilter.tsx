import React from "react";
import { CalendarRange } from "lucide-react";
import { Input } from "../ui/Input";
import {
  utcIsoToIstDateTimeDisplay,
  utcIsoToIstDateTimeLocal,
  type DateRange,
} from "../../utils/dateRange.utils";
import { cn } from "../../lib/utils";

export interface DateTimeRangeFilterProps {
  dateRange?: DateRange;
  startPickerRef: React.RefObject<HTMLInputElement | null>;
  endPickerRef: React.RefObject<HTMLInputElement | null>;
  onOpenStart: () => void;
  onOpenEnd: () => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
}

export const DateTimeRangeFilter: React.FC<DateTimeRangeFilterProps> = ({
  dateRange,
  startPickerRef,
  endPickerRef,
  onOpenStart,
  onOpenEnd,
  onStartChange,
  onEndChange,
  className,
}) => {
  return (
    <div
      className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2 w-full", className)}
    >
      <div className="relative w-full sm:w-64">
        <button
          type="button"
          aria-label="Pick start date/time"
          onClick={onOpenStart}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <CalendarRange className="h-4 w-4" />
        </button>

        <Input
          type="text"
          value={utcIsoToIstDateTimeDisplay(dateRange?.startDate)}
          placeholder="dd/mm/yyyy --:--"
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="pl-10 h-9 pointer-events-none transition-all border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
        />

        <Input
          ref={startPickerRef}
          type="datetime-local"
          value={utcIsoToIstDateTimeLocal(dateRange?.startDate)}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label="Start date/time (IST)"
          className="absolute inset-0 opacity-0 cursor-pointer pl-10 h-9"
        />
      </div>

      <div className="relative w-full sm:w-64">
        <button
          type="button"
          aria-label="Pick end date/time"
          onClick={onOpenEnd}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <CalendarRange className="h-4 w-4" />
        </button>

        <Input
          type="text"
          value={utcIsoToIstDateTimeDisplay(dateRange?.endDate)}
          placeholder="dd/mm/yyyy --:--"
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="pl-10 h-9 pointer-events-none transition-all border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
        />

        <Input
          ref={endPickerRef}
          type="datetime-local"
          value={utcIsoToIstDateTimeLocal(dateRange?.endDate)}
          onChange={(e) => onEndChange(e.target.value)}
          aria-label="End date/time (IST)"
          className="absolute inset-0 opacity-0 cursor-pointer pl-10 h-9"
        />
      </div>
    </div>
  );
};
