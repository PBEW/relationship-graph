import { CloudOff } from "lucide-react";

import { getApiErrorMessage } from "@/api/client";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

interface QueryErrorProps {
  error: unknown;
  title?: string;
  onRetry: () => void;
}

/** What a page shows when its data could not be loaded, with a way to retry. */
export function QueryError({ error, title = "โหลดข้อมูลไม่สำเร็จ", onRetry }: QueryErrorProps) {
  return (
    <EmptyState
      icon={CloudOff}
      title={title}
      description={getApiErrorMessage(error)}
      action={
        <Button variant="outline" onClick={onRetry}>
          ลองใหม่
        </Button>
      }
    />
  );
}
