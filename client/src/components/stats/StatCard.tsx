import * as React from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/Card";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  className?: string;
  hoverContent?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  className,
  hoverContent,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100); // 100ms grace period
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={cn(
          "border-border/60 hover:border-primary/50 transition-all duration-300",
          hoverContent && "cursor-pointer",
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {title}
                </p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
            </div>
            {hoverContent && (
              <div className="text-xs text-muted-foreground/60">
                <span className="hidden sm:inline">Hover for details</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hover Popover */}
      {hoverContent && isHovered && (
        <div
          className={cn(
            "absolute z-50 mt-2",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            // Position popover to the right on larger screens, below on mobile
            "left-0 top-full",
            "sm:left-auto sm:right-0"
          )}
        >
          {hoverContent}
        </div>
      )}
    </div>
  );
};
