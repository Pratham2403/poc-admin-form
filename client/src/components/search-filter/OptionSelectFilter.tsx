import React from "react";
import { Filter } from "lucide-react";
import { Select } from "../ui/Select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface OptionSelectFilterProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export const OptionSelectFilter: React.FC<OptionSelectFilterProps> = ({
  value,
  options,
  onChange,
}) => {
  return (
    <div className="w-full relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <Filter className="h-4 w-4 text-muted-foreground" />
      </div>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-10 border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
};
