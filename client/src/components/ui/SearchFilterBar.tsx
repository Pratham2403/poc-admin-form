import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';

interface FilterOption {
    label: string;
    value: string;
}

interface SearchFilterBarProps {
    searchPlaceholder?: string;
    onSearchChange: (value: string) => void;
    onFilterChange?: (value: string) => void;
    searchValue: string;
    filterValue?: string;
    filterOptions?: FilterOption[];
    showFilter?: boolean;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
    searchPlaceholder = "Search...",
    onSearchChange,
    onFilterChange,
    searchValue,
    filterValue,
    filterOptions = [],
    showFilter = false
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-10 transition-all border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                />
            </div>

            {showFilter && onFilterChange && (
                <div className="w-full sm:w-[200px] relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="pl-10 h-10 border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30 cursor-pointer"
                    >
                        {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
            )}
        </div>
    );
};
