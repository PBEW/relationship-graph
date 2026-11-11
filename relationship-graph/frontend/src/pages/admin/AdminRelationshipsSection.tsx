import { ArrowLeftRight, HeartHandshake, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RelationshipFormDialog } from "@/components/admin/RelationshipFormDialog";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { QueryError } from "@/components/common/QueryError";
import { TableCard } from "@/components/common/TableCard";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { TypeBadge } from "@/components/relationships/TypeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteRelationship } from "@/hooks/useRelationshipMutations";
import { useRelationships } from "@/hooks/useRelationships";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import { formatDateRange } from "@/lib/formatDate";
import { STATUS_LABELS } from "@/lib/relationshipLabels";
import type { Relationship, RelationshipStatus } from "@/types";

export function AdminRelationshipsSection() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<RelationshipStatus | "all">("all");

  const { data: types } = useRelationshipTypes();
  const { data, isLoading, isError, error, refetch } = useRelationships({
    page,
    per_page: 10,
    relationship_type_id: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const deleteRelationship = useDeleteRelationship();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [deletingRelationship, setDeletingRelationship] = useState<Relationship | null>(null);

  const openCreate = () => {
    setEditingRelationship(null);
    setFormOpen(true);
  };
  const openEdit = (rel: Relationship) => {
    setEditingRelationship(rel);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRelationship) return;
    try {
      await deleteRelationship.mutateAsync(deletingRelationship.id);
      toast.success("ลบความสัมพันธ์แล้ว");
      setDeletingRelationship(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="กรองตามประเภท" className="w-full sm:w-44">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภท</SelectItem>
              {types?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as RelationshipStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="กรองตามสถานะ" className="w-full sm:w-40">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
              <SelectItem value="ended">{STATUS_LABELS.ended}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มความสัมพันธ์
        </Button>
      </div>

      {isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={HeartHandshake} title="ไม่พบความสัมพันธ์" />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ใครกับใคร</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="hidden lg:table-cell">สถานะ</TableHead>
                <TableHead className="hidden xl:table-cell">ช่วงเวลา</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        <PersonAvatar
                          avatar={rel.person_a.avatar}
                          displayName={rel.person_a.display_name}
                          className="hidden size-8 md:flex"
                        />
                        {rel.person_a.display_name}
                      </span>
                      <ArrowLeftRight aria-label="กับ" className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex items-center gap-2 font-medium">
                        <PersonAvatar
                          avatar={rel.person_b.avatar}
                          displayName={rel.person_b.display_name}
                          className="hidden size-8 md:flex"
                        />
                        {rel.person_b.display_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <TypeBadge name={rel.relationship_type.name} color={rel.relationship_type.color} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={rel.status === "active" ? "secondary" : "outline"}>
                      {STATUS_LABELS[rel.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground tabular-nums xl:table-cell">
                    {formatDateRange(rel.start_date, rel.end_date, rel.status) ?? "-"}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      className="justify-end"
                      onEdit={() => openEdit(rel)}
                      onDelete={() => setDeletingRelationship(rel)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      {data && (
        <Pager page={data.page} pages={data.pages} hasPrev={data.has_prev} hasNext={data.has_next} onPageChange={setPage} />
      )}

      <RelationshipFormDialog open={formOpen} onOpenChange={setFormOpen} relationship={editingRelationship} />

      <ConfirmDialog
        open={!!deletingRelationship}
        onOpenChange={(open) => !open && setDeletingRelationship(null)}
        title="ลบความสัมพันธ์นี้หรือไม่?"
        description="ลบแล้วจะกู้คืนไม่ได้"
        confirmLabel="ลบความสัมพันธ์"
        destructive
        isLoading={deleteRelationship.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
