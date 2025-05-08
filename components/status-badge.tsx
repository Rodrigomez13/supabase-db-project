import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types/lead-tracking";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (
    status: string
  ): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case "Activo":
        return {
          label: "Activo",
          variant: "success",
        };
      case "Pausada":
        return {
          label: "Pausada",
          variant: "warning",
        };
      case "scheduled":
        return {
          label: "Programada",
          variant: "default",
        };
      case "completed":
        return {
          label: "Completada",
          variant: "success",
        };
      case "error":
        return {
          label: "Error",
          variant: "destructive",
        };
      case "converted":
        return {
          label: "Convertido",
          variant: "success",
        };
      case "lost":
        return {
          label: "Perdido",
          variant: "destructive",
        };
      case "contacted":
        return {
          label: "Contactado",
          variant: "warning",
        };
      case "pending":
        return {
          label: "Pendiente",
          variant: "default",
        };
      default:
        return {
          label: status,
          variant: "secondary",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {config.label}
    </span>
  );
}
