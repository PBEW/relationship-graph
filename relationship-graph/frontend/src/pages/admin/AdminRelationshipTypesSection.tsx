import { Plus, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RelationshipTypeFormDialog } from "@/components/admin/RelationshipTypeFormDialog";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryError } from "@/components/common/QueryError";
import { TableCard } from "@/components/common/TableCard";
import { TypeBadge } from "@/components/relationships/TypeBadge";
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
import { useAuth } from "@/context/AuthContext";
import { useDeleteRelationshipType } from "@/hooks/useRelationshipTypeMutations";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import type { RelationshipType } from "@/types";

export function AdminRelationshipTypesSection() {
  const { isSuperAdmin } = useAuth();
  const { data: types, isLoading, isError, error, refetch } = useRelationshipTypes();
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

      {isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !types || types.length === 0 ? (
        <EmptyState icon={Tag} title="ยังไม่มีประเภทความสัมพันธ์" />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อและสี</TableHead>
                <TableHead className="hidden sm:table-cell">ไอคอน</TableHead>
                <TableHead className="hidden md:table-cell">คำอธิบาย</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell className="whitespace-normal">
                    <TypeBadge name={rt.name} color={rt.color} />
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{rt.icon}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground md:table-cell">
                    {rt.description ?? "-"}
                  </TableCell>
                  <TableCell>
                    {/* Shared vocabulary for everyone's data - super admin only. */}
                    <RowActions
                      className="justify-end"
                      onEdit={() => openEdit(rt)}
                      onDelete={isSuperAdmin ? () => setDeletingType(rt) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <RelationshipTypeFormDialog open={formOpen} onOpenChange={setFormOpen} relationshipType={editingType} />

      <ConfirmDialog
        open={!!deletingType}
        onOpenChange={(open) => !open && setDeletingType(null)}
        title="ลบประเภทความสัมพันธ์นี้หรือไม่?"
        description={`การลบ "${deletingType?.name}" จะกู้คืนไม่ได้ และลบประเภทที่ยังมีการใช้งานอยู่ไม่ได้`}
        confirmLabel="ลบประเภทนี้"
        destructive
        isLoading={deleteType.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
