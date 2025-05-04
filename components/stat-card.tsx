import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  trend = "neutral",
  subtitle,
}: StatCardProps) {
  return (
    <Card className="border-usina-card bg-background/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-usina-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-usina-text-primary">
          {value}
        </div>
        <div className="flex items-center mt-1">
          {trend === "up" && (
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
          )}
          {trend === "down" && (
            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          {trend === "neutral" && (
            <Minus className="h-4 w-4 text-gray-500 mr-1" />
          )}
          <p className="text-xs text-usina-text-secondary">
            {subtitle || "Sin cambios"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
