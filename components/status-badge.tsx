import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive =
    status.toLowerCase() === "active" || status.toLowerCase() === "activo";

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        isActive
          ? "bg-usina-primary/20 text-usina-primary border border-usina-primary/30"
          : "bg-usina-danger/20 text-usina-danger border border-usina-danger/30",
        className
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}
