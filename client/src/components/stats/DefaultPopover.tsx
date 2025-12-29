import { cn } from "../../lib/utils";

interface DefaultPopoverProps {
  text: string;
  className?: string;
}

export const DefaultPopover = ({ text, className }: DefaultPopoverProps) => {
  return (
    <div
      className={cn(
        "w-80 rounded-xl overflow-hidden",
        "bg-popover text-popover-foreground",
        "shadow-2xl shadow-black/20",
        "border border-border/40",
        "animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      <div className="px-5 py-4 text-sm text-muted-foreground leading-relaxed">
        {text}
      </div>
    </div>
  );
};
