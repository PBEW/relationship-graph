import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PagerProps {
  page: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

export function Pager({ page, pages, hasPrev, hasNext, onPageChange }: PagerProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
        ก่อนหน้า
      </Button>
      <span className="text-sm text-muted-foreground">
        หน้า {page} จาก {pages}
      </span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
        ถัดไป
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
