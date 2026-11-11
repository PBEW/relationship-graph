import type { ActivityAction, ActivityEntityType } from "@/types";

export const ACTION_LABELS: Record<ActivityAction, string> = {
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  create: "เพิ่ม",
  update: "แก้ไข",
  delete: "ลบ",
};

export const ENTITY_LABELS: Record<ActivityEntityType, string> = {
  session: "",
  person: "คน",
  relationship: "ความสัมพันธ์",
  relationship_type: "ประเภทความสัมพันธ์",
  user: "บัญชีผู้ใช้",
};

export const ACTION_FILTER_OPTIONS: { value: ActivityAction; label: string }[] = (
  Object.entries(ACTION_LABELS) as [ActivityAction, string][]
).map(([value, label]) => ({ value, label }));

/** "เพิ่มคน", "ลบความสัมพันธ์", or just "เข้าสู่ระบบ" for sign-ins. */
export function describeActivity(action: ActivityAction, entityType: ActivityEntityType): string {
  const entity = ENTITY_LABELS[entityType];
  return entity ? `${ACTION_LABELS[action]}${entity}` : ACTION_LABELS[action];
}

/** Only deletions get colour, so they stand out when scanning the list. */
export function activityBadgeVariant(
  action: ActivityAction,
): "default" | "secondary" | "destructive" | "outline" {
  if (action === "delete") return "destructive";
  if (action === "create" || action === "update") return "secondary";
  return "outline";
}
