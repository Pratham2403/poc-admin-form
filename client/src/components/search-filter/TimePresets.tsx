import React from "react";
import { Button } from "../ui/Button";
import type { TimePreset } from "../../utils/dateRange.utils";

export interface TimePresetsProps {
  presets: TimePreset[];
  activePreset: TimePreset;
  onPresetClick: (preset: TimePreset) => void;
}

export const TimePresets: React.FC<TimePresetsProps> = ({
  presets,
  activePreset,
  onPresetClick,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset}
          type="button"
          variant={activePreset === preset ? "default" : "outline"}
          size="sm"
          onClick={() => onPresetClick(preset)}
        >
          {preset === "today"
            ? "Today"
            : preset === "month"
            ? "This Month"
            : "All Time"}
        </Button>
      ))}
    </div>
  );
};
