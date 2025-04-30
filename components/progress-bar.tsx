interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = "bg-primary",
  height = "h-2",
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div className={className}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      <div
        className={`w-full ${height} bg-secondary rounded-full overflow-hidden`}
      >
        <div
          className={`${height} ${color} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
}
