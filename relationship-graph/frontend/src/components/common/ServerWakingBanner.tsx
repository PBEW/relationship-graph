import { Loader2 } from "lucide-react";

import { useServerWaking } from "@/hooks/useServerWaking";

/**
 * Explains the free-tier backend's cold start, which otherwise looks like the
 * site has hung for the better part of a minute.
 */
export function ServerWakingBanner() {
  const waking = useServerWaking();

  if (!waking) return null;

  return (
    <div
      role="status"
      // Floated clear of the top-left brand rather than spanning the full
      // width, which covered it.
      className="fixed left-1/2 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-center text-sm text-primary-foreground shadow-lg"
    >
      <Loader2 className="size-4 shrink-0 animate-spin" />
      กำลังปลุกเซิร์ฟเวอร์ ครั้งแรกอาจใช้เวลาถึง 1 นาที รอสักครู่นะ
    </div>
  );
}
