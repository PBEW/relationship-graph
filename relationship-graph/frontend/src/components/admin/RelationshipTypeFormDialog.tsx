import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRelationshipType,
  useUpdateRelationshipType,
} from "@/hooks/useRelationshipTypeMutations";
import type { RelationshipType } from "@/types";

const COMMON_ICONS = [
  "users", "users-round", "heart", "heart-crack", "handshake", "gem",
  "swords", "ban", "mic-off", "shield", "home", "star",
];

const relationshipTypeFormSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "ต้องเป็นรหัสสีแบบ hex เช่น #06B6D4"),
  icon: z.string().min(1, "กรุณากรอกชื่อไอคอน").max(50),
  description: z.string().optional(),
});

type RelationshipTypeFormValues = z.infer<typeof relationshipTypeFormSchema>;

function toFormValues(rt: RelationshipType | null): RelationshipTypeFormValues {
  return {
    name: rt?.name ?? "",
    color: rt?.color ?? "#6366F1",
    icon: rt?.icon ?? "",
    description: rt?.description ?? "",
  };
}

interface RelationshipTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationshipType: RelationshipType | null;
}

export function RelationshipTypeFormDialog({
  open,
  onOpenChange,
  relationshipType,
}: RelationshipTypeFormDialogProps) {
  const isEditing = !!relationshipType;
  const createType = useCreateRelationshipType();
  const updateType = useUpdateRelationshipType();

  const form = useForm<RelationshipTypeFormValues>({
    resolver: zodResolver(relationshipTypeFormSchema),
    defaultValues: toFormValues(relationshipType),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(relationshipType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, relationshipType]);

  const isSubmitting = createType.isPending || updateType.isPending;
  const colorValue = form.watch("color");

  const onSubmit = async (values: RelationshipTypeFormValues) => {
    try {
      const payload = { ...values, description: values.description || null };
      if (isEditing) {
        await updateType.mutateAsync({ id: relationshipType.id, input: payload });
      } else {
        await createType.mutateAsync(payload);
      }
      toast.success(isEditing ? "แก้ไขประเภทความสัมพันธ์แล้ว" : "เพิ่มประเภทความสัมพันธ์แล้ว");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขประเภทความสัมพันธ์" : "เพิ่มประเภทความสัมพันธ์"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "แก้ไขประเภทความสัมพันธ์นี้" : "กำหนดประเภทความสัมพันธ์แบบใหม่"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>สี</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(colorValue) ? colorValue : "#6366F1"}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="size-9 shrink-0 cursor-pointer rounded-md border border-input"
                      />
                    </FormControl>
                    <Input {...field} placeholder="#RRGGBB" className="font-mono" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ไอคอน</FormLabel>
                  <FormControl>
                    <Input {...field} list="icon-suggestions" placeholder="เช่น heart" />
                  </FormControl>
                  <datalist id="icon-suggestions">
                    {COMMON_ICONS.map((icon) => (
                      <option key={icon} value={icon} />
                    ))}
                  </datalist>
                  <FormDescription>ชื่อไอคอนจาก lucide-react</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                {isSubmitting ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้าง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
