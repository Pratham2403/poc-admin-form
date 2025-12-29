import React from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/Input";

export interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
}) => {
  return (
    <div className="relative flex-1 group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-10 transition-all border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
      />
    </div>
  );
};
