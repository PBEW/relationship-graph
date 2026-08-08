import { Pencil, Plus, ShieldUser, Trash2, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/api/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
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
import type { UserAccount } from "@/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUsersSection() {
  const { username: currentUsername } = useAuth();
  const { data: users, isLoading } = useUsers();
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

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !users || users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="ยังไม่มีบัญชีผู้ใช้" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>สิทธิ์</TableHead>
                <TableHead className="hidden sm:table-cell">สถานะ</TableHead>
                <TableHead className="hidden md:table-cell">สร้างเมื่อ</TableHead>
                <TableHead className="w-24 text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {user.role === "super_admin" && (
                        <ShieldUser className="size-4 text-primary" />
                      )}
                      {user.username}
                      {user.username === currentUsername && (
                        <Badge variant="outline" className="text-xs">คุณ</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                      {user.role === "super_admin" ? "Super Admin" : "สมาชิก"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={(checked) => void toggleActive(user, checked)}
                        disabled={updateUser.isPending}
                        aria-label={user.is_active ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.is_active ? "ใช้งานได้" : "ถูกระงับ"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label="แก้ไข">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingUser(user)}
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

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="ลบบัญชีผู้ใช้นี้หรือไม่?"
        description={`การลบบัญชี "${deletingUser?.username}" จะไม่สามารถกู้คืนได้`}
        confirmLabel="ลบ"
        destructive
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
