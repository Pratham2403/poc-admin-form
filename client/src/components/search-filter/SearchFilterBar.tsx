import React from "react";
import {
  istDateTimeLocalToUtcIso,
  presetToDateRangeIST,
  type DateRange,
  type TimePreset,
} from "../../utils/dateRange.utils";
import { cn } from "../../lib/utils";
import { SearchInput } from "./SearchInput";
import { OptionSelectFilter, type FilterOption } from "./OptionSelectFilter";
import { TimePresets } from "./TimePresets";
import { DateTimeRangeFilter } from "./DateTimeRangeFilter";
import {
  SearchableCheckboxMultiSelectFilter,
  type CheckboxSelectOption,
} from "./SearchableCheckboxMultiSelectFilter";

interface SearchFilterBarProps {
  className?: string;

  // Search
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  // Select filter
  filterValue?: string;
  filterOptions?: FilterOption[];
  onFilterChange?: (value: string) => void;
  showFilter?: boolean;

  // Date range (backend filtering)
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDateRange?: boolean;

  // Optional presets (frontend only; emits ranges)
  showTimePresets?: boolean;
  presets?: TimePreset[];

  // Optional checkbox multi-select (lazy loaded options)
  showCheckboxMultiSelect?: boolean;
  checkboxMultiSelect?: {
    selectedIds: string[];
    onSelectedIdsChange: (ids: string[]) => void;
    loadOptions: () => Promise<CheckboxSelectOption[]>;
    triggerPlaceholder?: string;
    triggerAriaLabel?: string;
    searchPlaceholder?: string;
  };
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  className,
  searchPlaceholder = "Search...",
  onSearchChange,
  onFilterChange,
  searchValue,
  filterValue,
  filterOptions = [],
  showFilter = false,
  dateRange,
  onDateRangeChange,
  showDateRange,
  showTimePresets = false,
  presets = ["today", "month", "all"],
  showCheckboxMultiSelect = false,
  checkboxMultiSelect,
}) => {
  const [activePreset, setActivePreset] = React.useState<TimePreset>("all");
  const startPickerRef = React.useRef<HTMLInputElement>(null);
  const endPickerRef = React.useRef<HTMLInputElement>(null);

  const shouldShowSearch = typeof onSearchChange === "function";
  const shouldShowFilter =
    showFilter &&
    typeof onFilterChange === "function" &&
    Array.isArray(filterOptions) &&
    filterOptions.length > 0;
  const canDateFilter = typeof onDateRangeChange === "function";
  const shouldShowDateRange = (showDateRange ?? true) && canDateFilter;
  const shouldShowPresets =
    showTimePresets && canDateFilter && presets.length > 0;

  const shouldShowCheckboxMultiSelect =
    showCheckboxMultiSelect &&
    typeof checkboxMultiSelect?.onSelectedIdsChange === "function" &&
    typeof checkboxMultiSelect?.loadOptions === "function";

  const headerLayoutClass = cn(
    "grid grid-cols-1 gap-3 sm:gap-4 w-full items-center",
    shouldShowSearch && shouldShowFilter && shouldShowCheckboxMultiSelect
      ? "sm:grid-cols-[1fr_minmax(180px,220px)_minmax(220px,320px)]"
      : shouldShowSearch && shouldShowFilter
      ? "sm:grid-cols-[1fr_minmax(180px,220px)]"
      : shouldShowSearch && shouldShowCheckboxMultiSelect
      ? "sm:grid-cols-[1fr_minmax(220px,320px)]"
      : shouldShowFilter && shouldShowCheckboxMultiSelect
      ? "sm:grid-cols-[minmax(180px,220px)_minmax(220px,320px)]"
      : ""
  );

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    // Chromium supports showPicker(); fallback to focus/click.
    (el as any).showPicker?.();
    el.focus();
    el.click();
  };

  const handlePresetClick = (preset: TimePreset) => {
    setActivePreset(preset);
    onDateRangeChange?.(presetToDateRangeIST(preset));
  };

  const handleStartChange = (value: string) => {
    setActivePreset("all");
    const startDate = istDateTimeLocalToUtcIso(value);
    onDateRangeChange?.({ ...dateRange, startDate });
  };

  const handleEndChange = (value: string) => {
    setActivePreset("all");
    const endDate = istDateTimeLocalToUtcIso(value);
    onDateRangeChange?.({ ...dateRange, endDate });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4 w-full mb-6 animate-in fade-in slide-in-from-top-4 duration-500",
        className
      )}
    >
      {(shouldShowSearch ||
        shouldShowFilter ||
        shouldShowCheckboxMultiSelect) && (
        <div className={headerLayoutClass}>
          {shouldShowSearch && (
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue ?? ""}
              onChange={(value) => onSearchChange?.(value)}
            />
          )}

          {shouldShowFilter && (
            <OptionSelectFilter
              value={filterValue ?? ""}
              options={filterOptions}
              onChange={(value) => onFilterChange?.(value)}
            />
          )}

          {shouldShowCheckboxMultiSelect && checkboxMultiSelect && (
            <SearchableCheckboxMultiSelectFilter
              selectedIds={checkboxMultiSelect.selectedIds}
              onSelectedIdsChange={checkboxMultiSelect.onSelectedIdsChange}
              loadOptions={checkboxMultiSelect.loadOptions}
              triggerPlaceholder={checkboxMultiSelect.triggerPlaceholder}
              triggerAriaLabel={checkboxMultiSelect.triggerAriaLabel}
              searchPlaceholder={checkboxMultiSelect.searchPlaceholder}
            />
          )}
        </div>
      )}

      {(shouldShowPresets || shouldShowDateRange) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          {shouldShowPresets && (
            <TimePresets
              presets={presets}
              activePreset={activePreset}
              onPresetClick={handlePresetClick}
            />
          )}

          {shouldShowDateRange && (
            <DateTimeRangeFilter
              dateRange={dateRange}
              startPickerRef={startPickerRef}
              endPickerRef={endPickerRef}
              onOpenStart={() => openPicker(startPickerRef)}
              onOpenEnd={() => openPicker(endPickerRef)}
              onStartChange={handleStartChange}
              onEndChange={handleEndChange}
              className={cn(shouldShowPresets ? "sm:ml-auto sm:w-auto" : "")}
            />
          )}
        </div>
      )}
    </div>
  );
};
