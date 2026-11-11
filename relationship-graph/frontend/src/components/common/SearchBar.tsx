import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** "lg" is the front-door search on the home page. */
  size?: "default" | "lg";
  autoFocus?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "ค้นหาคน...",
  className,
  size = "default",
  autoFocus,
  onKeyDown,
}: SearchBarProps) {
  const large = size === "lg";

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          large ? "left-5 size-6" : "left-3.5 size-4",
        )}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className={cn(large ? "h-16 rounded-2xl border-0 pr-14 pl-14 text-xl shadow-soft" : "pr-11 pl-10")}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("absolute top-1/2 -translate-y-1/2", large ? "right-2.5" : "right-0")}
          onClick={() => onChange("")}
          aria-label="ล้างการค้นหา"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
