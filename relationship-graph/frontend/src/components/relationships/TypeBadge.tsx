import { readableTypeColor } from "@/lib/typeColor";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  name: string;
  color: string;
  className?: string;
}

/**
 * A relationship type's name beside its coloured dot. The colour stays on the
 * dot because yellow and cyan fail contrast as text.
 */
export function TypeBadge({ name, color, className }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      {/* Runtime colour from the database, the one thing classes can't express. */}
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: readableTypeColor(color) }}
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
