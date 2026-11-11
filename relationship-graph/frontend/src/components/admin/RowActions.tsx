import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  onEdit: () => void;
  /** Leave out when this user may not delete the row. */
  onDelete?: () => void;
  /** Spell the words out on phones too, instead of icons alone below `sm`. */
  alwaysLabelled?: boolean;
  className?: string;
}

/** "แก้ไข" and "ลบ", the same way everywhere a row can be changed. */
export function RowActions({ onEdit, onDelete, alwaysLabelled, className }: RowActionsProps) {
  const labelClass = alwaysLabelled ? undefined : "hidden sm:inline";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label="แก้ไข">
        <Pencil className="size-4" />
        <span className={labelClass}>แก้ไข</span>
      </Button>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="ลบ"
        >
          <Trash2 className="size-4" />
          <span className={labelClass}>ลบ</span>
        </Button>
      )}
    </div>
  );
}
