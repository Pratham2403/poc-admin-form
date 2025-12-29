import React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";

export interface CheckboxSelectOption {
  id: string;
  label: string;
}

export interface SearchableCheckboxMultiSelectFilterProps {
  className?: string;
  triggerPlaceholder?: string;
  triggerAriaLabel?: string;
  searchPlaceholder?: string;

  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;

  loadOptions: () => Promise<CheckboxSelectOption[]>;
}

export const SearchableCheckboxMultiSelectFilter: React.FC<
  SearchableCheckboxMultiSelectFilterProps
> = ({
  className,
  triggerPlaceholder = "All forms",
  triggerAriaLabel = "Filter by form",
  searchPlaceholder = "Search forms...",
  selectedIds,
  onSelectedIdsChange,
  loadOptions,
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [options, setOptions] = React.useState<CheckboxSelectOption[]>([]);

  const [query, setQuery] = React.useState("");

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) return;
    setQuery("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    // Focus after render so the trigger truly "becomes" the search bar.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const ensureLoaded = React.useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const data = await loadOptions();
      setOptions(Array.isArray(data) ? data : []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loadOptions, loaded, loading]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await ensureLoaded();
  };

  const selectedCount = selectedIds.length;

  const visibleOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggleId = (id: string) => {
    const isSelected = selectedIds.includes(id);
    const next = isSelected
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onSelectedIdsChange(next);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {!open ? (
        <button
          type="button"
          onClick={toggleOpen}
          aria-label={triggerAriaLabel}
          className={cn(
            "w-full h-10 rounded-md border border-muted bg-background px-3",
            "flex items-center gap-2",
            "hover:border-primary/30 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-sm text-foreground truncate">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : triggerPlaceholder}
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-10 transition-all border-muted focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
          </div>

          {selectedCount > 0 && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => onSelectedIdsChange([])}
              aria-label="Clear selection"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border/40 bg-popover text-popover-foreground shadow-2xl shadow-black/10 overflow-hidden">
          <div className="max-h-64 overflow-auto p-1.5">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading…</div>
            ) : visibleOptions.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No forms found
              </div>
            ) : (
              <div className="flex flex-col">
                {visibleOptions.map((opt) => {
                  const checked = selectedIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer",
                        "hover:bg-muted/30 transition-colors"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleId(opt.id)}
                      />
                      <span className="text-sm text-foreground truncate">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
