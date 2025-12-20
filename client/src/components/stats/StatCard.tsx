import * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/Card";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  className,
}) => {
  return (
    <Card
      className={cn(
        "border-border/60 hover:border-primary/50 transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

