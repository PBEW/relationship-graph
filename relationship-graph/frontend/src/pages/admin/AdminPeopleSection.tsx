import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PersonFormDialog } from "@/components/admin/PersonFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { SearchBar } from "@/components/common/SearchBar";
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
import { getApiErrorMessage } from "@/api/client";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeletePerson } from "@/hooks/usePersonMutations";
import { usePeople } from "@/hooks/usePeople";
import type { Person } from "@/types";

export function AdminPeopleSection() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = usePeople({ page, per_page: 10, search: debouncedSearch || undefined });
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
      toast.success(`${deletingPerson.display_name} deleted`);
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
          className="sm:max-w-xs"
        />
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Person
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={UsersRound} title="No people found" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="hidden sm:table-cell">VRChat</TableHead>
                <TableHead className="hidden sm:table-cell">Discord</TableHead>
                <TableHead className="hidden md:table-cell">Country</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-8" />
                      <div>
                        <div className="font-medium">{person.display_name}</div>
                        {person.nickname && (
                          <div className="text-xs text-muted-foreground">"{person.nickname}"</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{person.vrchat_name ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{person.discord ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{person.country ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(person)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPerson(person)}
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

      <PersonFormDialog open={formOpen} onOpenChange={setFormOpen} person={editingPerson} />

      <ConfirmDialog
        open={!!deletingPerson}
        onOpenChange={(open) => !open && setDeletingPerson(null)}
        title="Delete person?"
        description={`This will permanently delete ${deletingPerson?.display_name ?? "this person"} and all of their relationships. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={deletePerson.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
