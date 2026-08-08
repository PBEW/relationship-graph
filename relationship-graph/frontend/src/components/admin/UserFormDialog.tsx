import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useUpdateUser } from "@/hooks/useUserMutations";
import type { UserAccount } from "@/types";

const userFormSchemaBase = z.object({
  username: z.string().min(3, "ต้องมีอย่างน้อย 3 ตัวอักษร").max(80),
  password: z.string().max(128).optional().or(z.literal("")),
  role: z.enum(["super_admin", "member"]),
});

type UserFormValues = z.infer<typeof userFormSchemaBase>;

function toFormValues(user: UserAccount | null): UserFormValues {
  return {
    username: user?.username ?? "",
    password: "",
    role: user?.role ?? "member",
  };
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAccount | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const userFormSchema = useMemo(
    () =>
      userFormSchemaBase.superRefine((data, ctx) => {
        if (!isEditing && (!data.password || data.password.length < 4)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: "ต้องมีอย่างน้อย 4 ตัวอักษร",
          });
        }
      }),
    [isEditing],
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toFormValues(user),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const isSubmitting = createUser.isPending || updateUser.isPending;

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (isEditing) {
        const payload: { username: string; role: "super_admin" | "member"; password?: string } = {
          username: values.username,
          role: values.role,
        };
        if (values.password) payload.password = values.password;
        await updateUser.mutateAsync({ id: user.id, input: payload });
      } else {
        await createUser.mutateAsync({
          username: values.username,
          password: values.password!,
          role: values.role,
        });
      }
      toast.success(isEditing ? "แก้ไขบัญชีผู้ใช้แล้ว" : "เพิ่มบัญชีผู้ใช้แล้ว");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขบัญชีผู้ใช้" : "เพิ่มบัญชีผู้ใช้"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "แก้ไขข้อมูลบัญชีนี้" : "สร้างบัญชีใหม่ให้เพื่อนเข้าใช้งานเว็บนี้"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้ใช้</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  {isEditing && <FormDescription>เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>สิทธิ์การใช้งาน</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">สมาชิก</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Super Admin จัดการบัญชีผู้ใช้คนอื่นได้ สมาชิกทั่วไปใช้งานข้อมูลได้ตามปกติ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้าง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
