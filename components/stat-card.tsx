import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  trend = "neutral",
  trendValue,
  icon,
}: StatCardProps) {
  return (
    <Card className="border bg-background/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend !== "neutral" && trendValue && (
            <div
              className={`flex items-center text-xs ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
