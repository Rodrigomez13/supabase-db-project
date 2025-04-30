import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  trend = "neutral",
  prefix = "",
  suffix = "",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-usina-text-secondary">
            {title}
          </h3>
          {trend === "up" && (
            <ArrowUpIcon className="h-4 w-4 text-usina-success" />
          )}
          {trend === "down" && (
            <ArrowDownIcon className="h-4 w-4 text-usina-danger" />
          )}
          {trend === "neutral" && (
            <MinusIcon className="h-4 w-4 text-usina-text-muted" />
          )}
        </div>
        <p className="text-2xl font-bold mt-2 text-usina-text-primary">
          {prefix}
          {value}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}
