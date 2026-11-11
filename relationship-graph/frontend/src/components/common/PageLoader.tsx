import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageLoader({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="กำลังโหลด" className={cn("flex h-full items-center justify-center p-6", className)}>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
