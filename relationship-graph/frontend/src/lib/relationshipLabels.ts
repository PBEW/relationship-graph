import type { RelationshipStatus } from "@/types";

/** Neutral on purpose: a guild or an enemy is not something you are "dating". */
export const STATUS_LABELS: Record<RelationshipStatus, string> = {
  active: "ยังเป็นอยู่",
  ended: "จบแล้ว",
};
