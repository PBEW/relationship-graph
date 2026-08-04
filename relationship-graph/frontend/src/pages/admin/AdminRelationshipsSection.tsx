import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RelationshipFormDialog } from "@/components/admin/RelationshipFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { PersonAvatar } from "@/components/people/PersonAvatar";
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
import type { Relationship, RelationshipStatus } from "@/types";

export function AdminRelationshipsSection() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<RelationshipStatus | "all">("all");

  const { data: types } = useRelationshipTypes();
  const { data, isLoading } = useRelationships({
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
      toast.success("Relationship deleted");
      setDeletingRelationship(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as RelationshipStatus | "all"); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Relationship
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Heart} title="No relationships found" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>People</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Dates</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <PersonAvatar avatar={rel.person_a.avatar} displayName={rel.person_a.display_name} className="size-7" />
                      <span className="text-sm font-medium">{rel.person_a.display_name}</span>
                      <span className="text-muted-foreground">↔</span>
                      <PersonAvatar avatar={rel.person_b.avatar} displayName={rel.person_b.display_name} className="size-7" />
                      <span className="text-sm font-medium">{rel.person_b.display_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${rel.relationship_type.color}20`,
                        color: rel.relationship_type.color,
                        borderColor: `${rel.relationship_type.color}40`,
                      }}
                    >
                      {rel.relationship_type.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={rel.status === "active" ? "default" : "secondary"}>{rel.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {rel.start_date ?? "?"} — {rel.end_date ?? "present"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rel)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingRelationship(rel)}
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

      {data && (
        <Pager page={data.page} pages={data.pages} hasPrev={data.has_prev} hasNext={data.has_next} onPageChange={setPage} />
      )}

      <RelationshipFormDialog open={formOpen} onOpenChange={setFormOpen} relationship={editingRelationship} />

      <ConfirmDialog
        open={!!deletingRelationship}
        onOpenChange={(open) => !open && setDeletingRelationship(null)}
        title="Delete relationship?"
        description="This will permanently delete this relationship. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteRelationship.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
