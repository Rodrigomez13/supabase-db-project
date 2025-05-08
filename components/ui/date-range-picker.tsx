import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onChange({ from: newRange?.from, to: newRange?.to });
  };

  return (
    <div>
      <p className="text-sm mb-2">
        Selecciona un rango de fechas:
      </p>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        className="rounded border p-2"
      />
    </div>
  );
}