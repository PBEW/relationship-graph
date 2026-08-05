import type { Gender } from "@/types";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "ชาย",
  female: "หญิง",
  non_binary: "นอนไบนารี",
  other: "อื่นๆ",
  unspecified: "ไม่ระบุ",
};

export const GENDER_OPTIONS: { value: Gender; label: string }[] = (
  Object.entries(GENDER_LABELS) as [Gender, string][]
).map(([value, label]) => ({ value, label }));
