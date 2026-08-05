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
      toast.success(`ลบ ${deletingType.name} แล้ว`);
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
          เพิ่มประเภทความสัมพันธ์
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !types || types.length === 0 ? (
        <EmptyState icon={Tag} title="ยังไม่มีประเภทความสัมพันธ์" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ไอคอน</TableHead>
                <TableHead className="hidden md:table-cell">คำอธิบาย</TableHead>
                <TableHead className="w-24 text-right">การจัดการ</TableHead>
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
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rt)} aria-label="แก้ไข">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingType(rt)}
                      aria-label="ลบ"
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
        title="ลบประเภทความสัมพันธ์นี้หรือไม่?"
        description={`การลบ "${deletingType?.name}" จะไม่สามารถกู้คืนได้ และไม่สามารถลบประเภทที่ยังมีการใช้งานอยู่ได้`}
        confirmLabel="ลบ"
        destructive
        isLoading={deleteType.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
