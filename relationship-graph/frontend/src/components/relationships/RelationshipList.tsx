import { HeartHandshake, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RelationshipFormDialog } from "@/components/admin/RelationshipFormDialog";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState } from "@/components/common/EmptyState";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { TypeBadge } from "@/components/relationships/TypeBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDeleteRelationship } from "@/hooks/useRelationshipMutations";
import { formatDateRange } from "@/lib/formatDate";
import type { Relationship } from "@/types";

const NAME_LINK_CLASS =
  "rounded-sm font-medium underline decoration-primary decoration-2 underline-offset-4 transition-colors duration-200 hover:text-primary";

interface RelationshipListProps {
  personId: string;
  relationships: Relationship[];
  /** Stay on the page when a name is pressed; without it, names link to profiles. */
  onSelectPerson?: (personId: string) => void;
}

/**
 * One person's relationships as Thai sentences, split into now and ended, with
 * adding, editing and deleting in place. This is the shared core of the profile
 * page and the graph panel.
 */
export function RelationshipList({ personId, relationships, onSelectPerson }: RelationshipListProps) {
  const { isAuthenticated } = useAuth();
  const deleteRelationship = useDeleteRelationship();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Relationship | null>(null);
  const [deleting, setDeleting] = useState<Relationship | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (relationship: Relationship) => {
    setEditing(relationship);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRelationship.mutateAsync(deleting.id);
      toast.success("ลบความสัมพันธ์แล้ว");
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const renderRow = (relationship: Relationship) => {
    const other = relationship.person_a_id === personId ? relationship.person_b : relationship.person_a;
    const period = formatDateRange(relationship.start_date, relationship.end_date, relationship.status);

    return (
      <li key={relationship.id} className="flex items-start gap-3 py-3">
        <PersonAvatar avatar={other.avatar} displayName={other.display_name} className="size-11" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <TypeBadge name={relationship.relationship_type.name} color={relationship.relationship_type.color} />
              <span>กับ</span>
              {onSelectPerson ? (
                <button type="button" onClick={() => onSelectPerson(other.id)} className={NAME_LINK_CLASS}>
                  {other.display_name}
                </button>
              ) : (
                <Link to={`/people/${other.id}`} className={NAME_LINK_CLASS}>
                  {other.display_name}
                </Link>
              )}
            </p>
            {period && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{period}</p>}
          </div>
          {isAuthenticated && (
            <RowActions
              alwaysLabelled
              className="-ml-3 shrink-0 @lg:ml-0"
              onEdit={() => openEdit(relationship)}
              onDelete={() => setDeleting(relationship)}
            />
          )}
        </div>
      </li>
    );
  };

  const active = relationships.filter((r) => r.status === "active");
  const ended = relationships.filter((r) => r.status === "ended");

  return (
    <div className="@container space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">ความสัมพันธ์</h2>
        {isAuthenticated && relationships.length > 0 && (
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="size-4" />
            เพิ่มความสัมพันธ์
          </Button>
        )}
      </div>

      {relationships.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="ยังไม่มีความสัมพันธ์"
          description="บอกได้เลยว่าคนนี้เกี่ยวข้องกับใคร เริ่มจากความสัมพันธ์แรกของเขา"
          action={
            isAuthenticated && (
              <Button onClick={openAdd}>
                <Plus className="size-4" />
                เพิ่มความสัมพันธ์
              </Button>
            )
          }
        />
      ) : (
        <>
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">ตอนนี้</h3>
            {active.length > 0 ? (
              <ul className="divide-y">{active.map(renderRow)}</ul>
            ) : (
              <p className="py-3 text-sm text-muted-foreground">ตอนนี้ไม่มีความสัมพันธ์ที่ยังเป็นอยู่</p>
            )}
          </section>
          {ended.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground">จบไปแล้ว</h3>
              <ul className="divide-y">{ended.map(renderRow)}</ul>
            </section>
          )}
        </>
      )}

      <RelationshipFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        relationship={editing}
        defaultPersonId={personId}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="ลบความสัมพันธ์นี้หรือไม่?"
        description="ลบแล้วจะกู้คืนไม่ได้ ถ้าความสัมพันธ์นี้แค่จบไปแล้ว ให้กดแก้ไขแล้วเปลี่ยนสถานะเป็นจบแล้วแทน"
        confirmLabel="ลบความสัมพันธ์"
        destructive
        isLoading={deleteRelationship.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
