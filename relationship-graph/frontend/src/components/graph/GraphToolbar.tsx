import { Panel } from "@xyflow/react";
import { MousePointerClick, User, X } from "lucide-react";

import { SearchBar } from "@/components/common/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import { cn } from "@/lib/utils";

interface GraphToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  matchCount: number;
  hiddenTypeIds: Set<string>;
  onToggleType: (typeId: string) => void;
  focusedPersonName: string | null;
  onClearFocus: () => void;
  onOpenFocusedProfile: () => void;
  visiblePeopleCount: number;
  totalPeopleCount: number;
  visibleRelationshipCount: number;
}

export function GraphToolbar({
  search,
  onSearchChange,
  matchCount,
  hiddenTypeIds,
  onToggleType,
  focusedPersonName,
  onClearFocus,
  onOpenFocusedProfile,
  visiblePeopleCount,
  totalPeopleCount,
  visibleRelationshipCount,
}: GraphToolbarProps) {
  const { data: types } = useRelationshipTypes();

  return (
    <>
      <Panel position="top-left" className="!m-3">
        <Card className="w-64 gap-2 py-3">
          <CardContent className="space-y-2 px-3">
            <SearchBar value={search} onChange={onSearchChange} placeholder="ค้นหาในกราฟ..." />
            {search && <p className="text-xs text-muted-foreground">พบ {matchCount} คน</p>}

            {focusedPersonName ? (
              <div className="space-y-1.5">
                <div className="truncate rounded-md bg-primary/10 px-2 py-1 text-xs">
                  กำลังดูวงของ <span className="font-semibold">{focusedPersonName}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1" onClick={onOpenFocusedProfile}>
                    <User className="size-3.5" />
                    โปรไฟล์
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={onClearFocus}>
                    <X className="size-3.5" />
                    ดูทุกคน
                  </Button>
                </div>
              </div>
            ) : (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MousePointerClick className="mt-px size-3.5 shrink-0" />
                คลิกที่คนใดคนหนึ่ง เพื่อดูเฉพาะวงของคนนั้น
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              แสดง {visiblePeopleCount} จาก {totalPeopleCount} คน · {visibleRelationshipCount} ความสัมพันธ์
            </p>
          </CardContent>
        </Card>
      </Panel>

      <Panel position="bottom-left" className="!m-3">
        <Card className="gap-2 py-3">
          <CardContent className="flex max-w-64 flex-wrap gap-2 px-3">
            {types?.map((t) => {
              const hidden = hiddenTypeIds.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggleType(t.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border border-transparent px-1.5 py-0.5 text-xs transition-colors hover:border-border",
                    hidden && "opacity-40",
                  )}
                  title={hidden ? `แสดง "${t.name}"` : `ซ่อน "${t.name}"`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: hidden ? "var(--muted-foreground)" : t.color }}
                  />
                  <span className={cn(hidden && "line-through")}>{t.name}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </Panel>
    </>
  );
}
