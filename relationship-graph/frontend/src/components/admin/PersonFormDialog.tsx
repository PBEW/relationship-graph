import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "@/api/client";
import { PersonAvatar } from "@/components/people/PersonAvatar";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePerson, useUpdatePerson, useUploadAvatar } from "@/hooks/usePersonMutations";
import { GENDER_OPTIONS } from "@/lib/genderLabels";
import type { Person } from "@/types";

const GENDER_VALUES = ["male", "female", "non_binary", "other", "unspecified"] as const;

const VRCHAT_ID_PATTERN = /usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractVrchatId(value: string): string {
  const match = value.match(VRCHAT_ID_PATTERN);
  return match ? match[0] : value.trim();
}

const personFormSchema = z.object({
  display_name: z.string().min(1, "กรุณากรอกชื่อที่แสดง").max(120),
  nickname: z.string().max(120).optional(),
  vrchat_name: z.string().max(120).optional(),
  discord: z.string().max(120).optional(),
  steam: z.string().max(120).optional(),
  twitter: z.string().max(120).optional(),
  country: z.string().max(100).optional(),
  gender: z.enum(GENDER_VALUES).optional(),
  birthday: z.string().optional(),
  bio: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

function toApiPayload(values: PersonFormValues) {
  return {
    display_name: values.display_name,
    nickname: values.nickname || null,
    vrchat_name: values.vrchat_name || null,
    discord: values.discord || null,
    steam: values.steam || null,
    twitter: values.twitter || null,
    country: values.country || null,
    gender: values.gender || null,
    birthday: values.birthday || null,
    bio: values.bio || null,
  };
}

function personToFormValues(person: Person | null): PersonFormValues {
  return {
    display_name: person?.display_name ?? "",
    nickname: person?.nickname ?? "",
    vrchat_name: person?.vrchat_name ?? "",
    discord: person?.discord ?? "",
    steam: person?.steam ?? "",
    twitter: person?.twitter ?? "",
    country: person?.country ?? "",
    gender: (person?.gender as PersonFormValues["gender"]) ?? undefined,
    birthday: person?.birthday ?? "",
    bio: person?.bio ?? "",
  };
}

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  /** Prefills the name when adding someone, e.g. what was just searched for. */
  defaultName?: string;
}

export function PersonFormDialog({ open, onOpenChange, person, defaultName }: PersonFormDialogProps) {
  const isEditing = !!person;
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const uploadAvatar = useUploadAvatar();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: personToFormValues(person),
  });

  useEffect(() => {
    if (open) {
      form.reset({ ...personToFormValues(person), display_name: person?.display_name ?? defaultName ?? "" });
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person, defaultName]);

  const isSubmitting = createPerson.isPending || updatePerson.isPending || uploadAvatar.isPending;

  const onSubmit = async (values: PersonFormValues) => {
    try {
      const payload = toApiPayload(values);
      let personId = person?.id;

      if (isEditing && personId) {
        await updatePerson.mutateAsync({ id: personId, input: payload });
      } else {
        const created = await createPerson.mutateAsync(payload);
        personId = created.id;
      }

      if (avatarFile && personId) {
        await uploadAvatar.mutateAsync({ id: personId, file: avatarFile });
      }

      toast.success(isEditing ? "แก้ไขข้อมูลคนแล้ว" : "เพิ่มคนแล้ว");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขข้อมูลคน" : "เพิ่มคน"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "แก้ไขรายละเอียดของคนนี้" : "เพิ่มเพื่อนคนใหม่เข้ามาในกลุ่ม"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <PersonAvatar
                avatar={avatarPreview ?? person?.avatar ?? null}
                displayName={form.watch("display_name") || "?"}
                className="size-16"
              />
              <div className="min-w-0 flex-1">
                <Input
                  type="file"
                  aria-label="เลือกรูปโปรไฟล์"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    setAvatarPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF หรือ WebP ไม่เกิน 5MB</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อที่แสดง</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อเล่น</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เพศ</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vrchat_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ VRChat</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ชื่อ หรือวางลิงก์โปรไฟล์ VRChat"
                        onBlur={(e) => {
                          field.onChange(extractVrchatId(e.target.value));
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="steam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steam</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเทศ</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันเกิด</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประวัติย่อ</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "เพิ่มคนนี้"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
