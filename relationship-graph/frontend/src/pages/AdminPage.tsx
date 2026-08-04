import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

export function AdminPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={ShieldCheck}
        title="Admin CRUD panel coming in Phase 7"
        description="Manage People, Relationships, and Relationship Types here."
      />
    </div>
  );
}
