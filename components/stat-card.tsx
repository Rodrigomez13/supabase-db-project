import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border-usina-card bg-background/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-usina-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-usina-text-primary">
          {value}
        </div>
        <div className="flex items-center justify-between mt-1">
          {description && (
            <p className="text-xs text-usina-text-secondary">{description}</p>
          )}
          {trendValue && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" && "text-usina-success",
                trend === "down" && "text-usina-danger",
                trend === "neutral" && "text-usina-text-secondary"
              )}
            >
              {trend === "up" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {trend === "down" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {icon && <span className="mr-1">{icon}</span>}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
