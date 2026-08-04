import { Share2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

export function GraphPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={Share2}
        title="Interactive graph coming in Phase 6"
        description="React Flow (avatar nodes, colored/animated edges, zoom/pan/minimap) will render here."
      />
    </div>
  );
}
