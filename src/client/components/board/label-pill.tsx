import type { LabelDTO } from "@shared/types";
import { cn } from "@/lib/utils";

export function LabelPill({
  label,
  className,
  onClick,
}: {
  label: LabelDTO;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm",
        onClick && "cursor-pointer",
        className,
      )}
      style={{ backgroundColor: label.color }}
    >
      {label.name}
    </span>
  );
}

export function ColorSwatches({
  colors,
  value,
  onChange,
}: {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Select ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "size-7 rounded-full ring-offset-2 ring-offset-background transition",
            value === color ? "ring-foreground ring-2" : "hover:scale-110",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
