import { Plus, ShieldUser, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RowActions } from "@/components/admin/RowActions";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryError } from "@/components/common/QueryError";
import { TableCard } from "@/components/common/TableCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUser, useUpdateUser } from "@/hooks/useUserMutations";
import { useUsers } from "@/hooks/useUsers";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import type { UserAccount } from "@/types";

export function AdminUsersSection() {
  const { username: currentUsername } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };
  const openEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const toggleActive = async (user: UserAccount, is_active: boolean) => {
    try {
      await updateUser.mutateAsync({ id: user.id, input: { is_active } });
      toast.success(is_active ? `เปิดใช้งาน ${user.username} แล้ว` : `ระงับการใช้งาน ${user.username} แล้ว`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      toast.success(`ลบบัญชี ${deletingUser.username} แล้ว`);
      setDeletingUser(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มบัญชีผู้ใช้
        </Button>
      </div>

      {isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : !users || users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="ยังไม่มีบัญชีผู้ใช้" />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ใช้</TableHead>
                {/* On phones the shield beside the name says the role, leaving
                    room for the status switch, which is what people came for. */}
                <TableHead className="hidden sm:table-cell">สิทธิ์</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="hidden md:table-cell">เข้าใช้ล่าสุด</TableHead>
                <TableHead className="hidden lg:table-cell">สร้างเมื่อ</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      {user.role === "super_admin" && (
                        <ShieldUser aria-label="ผู้ดูแลระบบ" className="size-4 shrink-0" />
                      )}
                      {user.username}
                      {user.username === currentUsername && <Badge variant="outline">คุณ</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{user.role === "super_admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={(checked) => void toggleActive(user, checked)}
                        disabled={updateUser.isPending}
                        aria-label={user.is_active ? `ระงับการใช้งาน ${user.username}` : `เปิดใช้งาน ${user.username}`}
                      />
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {user.is_active ? "ใช้งานได้" : "ถูกระงับ"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground tabular-nums md:table-cell">
                    {user.last_login_at ? formatDateTime(user.last_login_at) : "ยังไม่เคยเข้า"}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground tabular-nums lg:table-cell">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      className="justify-end"
                      onEdit={() => openEdit(user)}
                      onDelete={() => setDeletingUser(user)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="ลบบัญชีผู้ใช้นี้หรือไม่?"
        description={`การลบบัญชี "${deletingUser?.username}" จะกู้คืนไม่ได้`}
        confirmLabel="ลบบัญชีนี้"
        destructive
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
