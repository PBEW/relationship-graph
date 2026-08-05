import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "@/api/client";
import { PersonCombobox } from "@/components/admin/PersonCombobox";
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
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import {
  useCreateRelationship,
  useUpdateRelationship,
} from "@/hooks/useRelationshipMutations";
import type { Relationship } from "@/types";

const relationshipFormSchema = z
  .object({
    person_a_id: z.string().uuid("เลือกคนคนหนึ่ง"),
    person_b_id: z.string().uuid("เลือกคนคนหนึ่ง"),
    relationship_type_id: z.string().uuid("เลือกประเภทความสัมพันธ์"),
    status: z.enum(["active", "ended"]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((data) => data.person_a_id !== data.person_b_id, {
    message: "ต้องเป็นคนละคนกัน",
    path: ["person_b_id"],
  })
  .refine(
    (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
    { message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น", path: ["end_date"] },
  );

type RelationshipFormValues = z.infer<typeof relationshipFormSchema>;

function toFormValues(rel: Relationship | null): RelationshipFormValues {
  return {
    person_a_id: rel?.person_a_id ?? "",
    person_b_id: rel?.person_b_id ?? "",
    relationship_type_id: rel?.relationship_type_id ?? "",
    status: rel?.status ?? "active",
    start_date: rel?.start_date ?? "",
    end_date: rel?.end_date ?? "",
    note: rel?.note ?? "",
  };
}

interface RelationshipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: Relationship | null;
  defaultPersonId?: string;
}

export function RelationshipFormDialog({
  open,
  onOpenChange,
  relationship,
  defaultPersonId,
}: RelationshipFormDialogProps) {
  const isEditing = !!relationship;
  const { data: types } = useRelationshipTypes();
  const createRelationship = useCreateRelationship();
  const updateRelationship = useUpdateRelationship();

  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipFormSchema),
    defaultValues: toFormValues(relationship),
  });

  useEffect(() => {
    if (open) {
      const initial = toFormValues(relationship);
      if (!relationship && defaultPersonId) initial.person_a_id = defaultPersonId;
      form.reset(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, relationship, defaultPersonId]);

  const isSubmitting = createRelationship.isPending || updateRelationship.isPending;

  const onSubmit = async (values: RelationshipFormValues) => {
    try {
      const payload = {
        ...values,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        note: values.note || null,
      };
      if (isEditing) {
        await updateRelationship.mutateAsync({ id: relationship.id, input: payload });
      } else {
        await createRelationship.mutateAsync(payload);
      }
      toast.success(isEditing ? "แก้ไขความสัมพันธ์แล้ว" : "เพิ่มความสัมพันธ์แล้ว");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const personA = form.watch("person_a_id");
  const personB = form.watch("person_b_id");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขความสัมพันธ์" : "เพิ่มความสัมพันธ์"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "แก้ไขความสัมพันธ์นี้" : "เชื่อมความสัมพันธ์ระหว่างคนสองคน"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="person_a_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คนที่ 1</FormLabel>
                    <PersonCombobox value={field.value} onChange={field.onChange} excludeId={personB} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="person_b_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คนที่ 2</FormLabel>
                    <PersonCombobox value={field.value} onChange={field.onChange} excludeId={personA} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="relationship_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภท</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <span
                              className="mr-1 inline-block size-2.5 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">คบกันอยู่</SelectItem>
                        <SelectItem value="ended">เลิกกันแล้ว</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่เริ่ม</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่สิ้นสุด</FormLabel>
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บันทึกเพิ่มเติม</FormLabel>
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
