import type { RelationshipStatus } from "@/types";

/** "12 มี.ค. 2567" */
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "12 มี.ค. 2567 14:30" */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A relationship's period in plain Thai, or null when no dates were recorded.
 * An open end only reads as "still going" when the relationship is active.
 */
export function formatDateRange(
  start: string | null,
  end: string | null,
  status: RelationshipStatus,
): string | null {
  if (start && end) return `${formatDate(start)} ถึง ${formatDate(end)}`;
  if (start) return status === "active" ? `ตั้งแต่ ${formatDate(start)}` : `เริ่ม ${formatDate(start)}`;
  if (end) return `จบเมื่อ ${formatDate(end)}`;
  return null;
}
