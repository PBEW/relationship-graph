import { Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PersonFormDialog } from "@/components/admin/PersonFormDialog";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { QueryError } from "@/components/common/QueryError";
import { SearchBar } from "@/components/common/SearchBar";
import { TableCard } from "@/components/common/TableCard";
import { PersonAvatar } from "@/components/people/PersonAvatar";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useDeletePerson } from "@/hooks/usePersonMutations";
import { usePeople } from "@/hooks/usePeople";
import type { Person } from "@/types";

export function AdminPeopleSection() {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = usePeople({
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });
  const deletePerson = useDeletePerson();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  const openCreate = () => {
    setEditingPerson(null);
    setFormOpen(true);
  };
  const openEdit = (person: Person) => {
    setEditingPerson(person);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPerson) return;
    try {
      await deletePerson.mutateAsync(deletingPerson.id);
      toast.success(`ลบ ${deletingPerson.display_name} แล้ว`);
      setDeletingPerson(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="sm:max-w-xs sm:flex-1"
        />
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มคน
        </Button>
      </div>

      {isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={UsersRound} title="ไม่พบข้อมูลคน" />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>คน</TableHead>
                <TableHead className="hidden md:table-cell">VRChat</TableHead>
                <TableHead className="hidden md:table-cell">Discord</TableHead>
                <TableHead className="hidden lg:table-cell">ประเทศ</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-3">
                      <PersonAvatar avatar={person.avatar} displayName={person.display_name} />
                      <div className="min-w-0">
                        <Link
                          to={`/people/${person.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {person.display_name}
                        </Link>
                        {person.nickname && (
                          <div className="text-xs text-muted-foreground">"{person.nickname}"</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-40 truncate md:table-cell">
                    {person.vrchat_name ?? "-"}
                  </TableCell>
                  <TableCell className="hidden max-w-40 truncate md:table-cell">{person.discord ?? "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{person.country ?? "-"}</TableCell>
                  <TableCell>
                    {/* Deleting a person takes their relationships with them,
                        so it's restricted to super admins server-side too. */}
                    <RowActions
                      className="justify-end"
                      onEdit={() => openEdit(person)}
                      onDelete={isSuperAdmin ? () => setDeletingPerson(person) : undefined}
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

      <PersonFormDialog open={formOpen} onOpenChange={setFormOpen} person={editingPerson} />

      <ConfirmDialog
        open={!!deletingPerson}
        onOpenChange={(open) => !open && setDeletingPerson(null)}
        title="ลบคนนี้หรือไม่?"
        description={`การลบ ${deletingPerson?.display_name ?? "คนนี้"} จะลบความสัมพันธ์ทั้งหมดของเขาไปด้วย และกู้คืนไม่ได้`}
        confirmLabel="ลบคนนี้"
        destructive
        isLoading={deletePerson.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
