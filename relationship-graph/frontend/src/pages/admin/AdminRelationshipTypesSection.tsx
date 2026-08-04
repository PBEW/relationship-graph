import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RelationshipTypeFormDialog } from "@/components/admin/RelationshipTypeFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteRelationshipType } from "@/hooks/useRelationshipTypeMutations";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import type { RelationshipType } from "@/types";

export function AdminRelationshipTypesSection() {
  const { data: types, isLoading } = useRelationshipTypes();
  const deleteType = useDeleteRelationshipType();

  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<RelationshipType | null>(null);
  const [deletingType, setDeletingType] = useState<RelationshipType | null>(null);

  const openCreate = () => {
    setEditingType(null);
    setFormOpen(true);
  };
  const openEdit = (rt: RelationshipType) => {
    setEditingType(rt);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    try {
      await deleteType.mutateAsync(deletingType.id);
      toast.success(`${deletingType.name} deleted`);
      setDeletingType(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Relationship Type
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !types || types.length === 0 ? (
        <EmptyState icon={Tag} title="No relationship types yet" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="size-3 rounded-full" style={{ backgroundColor: rt.color }} />
                      {rt.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{rt.icon}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground md:table-cell">
                    {rt.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rt)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingType(rt)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RelationshipTypeFormDialog open={formOpen} onOpenChange={setFormOpen} relationshipType={editingType} />

      <ConfirmDialog
        open={!!deletingType}
        onOpenChange={(open) => !open && setDeletingType(null)}
        title="Delete relationship type?"
        description={`This will permanently delete "${deletingType?.name}". You can't delete a type that's still in use by any relationship.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteType.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
