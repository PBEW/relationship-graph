import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { SearchBar } from "@/components/common/SearchBar";
import { ProfilePanel } from "@/components/graph/ProfilePanel";
import { PersonRow } from "@/components/people/PersonRow";
import { TypeBadge } from "@/components/relationships/TypeBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import { cn } from "@/lib/utils";
import type { GraphNode } from "@/types";

const SEARCH_RESULT_LIMIT = 8;

interface ExploreControlsProps {
  people: GraphNode[];
  hiddenTypeIds: Set<string>;
  onToggleType: (typeId: string) => void;
  onSelectPerson: (personId: string) => void;
}

/** Find someone by name, choose which kinds of line show, and read the line key. */
function ExploreControls({ people, hiddenTypeIds, onToggleType, onSelectPerson }: ExploreControlsProps) {
  const { data: types } = useRelationshipTypes();
  const [search, setSearch] = useState("");

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return people
      .filter(
        (p) => p.display_name.toLowerCase().includes(query) || p.nickname?.toLowerCase().includes(query),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [people, search]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาชื่อคน..." />
        {search.trim() &&
          (matches.length > 0 ? (
            <ul aria-label="ผลการค้นหา">
              {matches.map((person) => (
                <li key={person.id}>
                  <PersonRow
                    displayName={person.display_name}
                    avatar={person.avatar}
                    nickname={person.nickname}
                    onSelect={() => {
                      onSelectPerson(person.id);
                      setSearch("");
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 text-sm text-muted-foreground">ไม่พบคนชื่อนี้</p>
          ))}
      </div>

      <section className="space-y-1">
        <h2 className="font-semibold">ประเภทเส้น</h2>
        <p className="text-sm text-muted-foreground">กดเพื่อซ่อนหรือแสดง</p>
        <ul className="pt-1">
          {types?.map((type) => (
            <li key={type.id}>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-1 transition-colors duration-200 hover:bg-muted">
                <TypeBadge name={type.name} color={type.color} />
                <Switch checked={!hiddenTypeIds.has(type.id)} onCheckedChange={() => onToggleType(type.id)} />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">เส้นประ = จบไปแล้ว</p>
    </div>
  );
}

interface GraphPanelProps extends ExploreControlsProps {
  ref: React.Ref<HTMLElement>;
  focusedPersonId: string | null;
  focusedName: string | null;
  /** All of the focused person's relationships, whatever the line filters show. */
  relationshipCount: number;
  /** Below md: a slim bar when false, up to 55% of the canvas when true. From md up the panel is always open. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

/**
 * The one panel beside the canvas: a right column from md up, a bottom sheet
 * inside the canvas below that. It never covers the graph from a modal layer,
 * so the ring stays visible while reading about the person at its centre.
 */
export function GraphPanel({
  ref,
  focusedPersonId,
  focusedName,
  relationshipCount,
  expanded,
  onExpandedChange,
  ...controls
}: GraphPanelProps) {
  return (
    <aside
      ref={ref}
      aria-label="ข้อมูลในแผนผัง"
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 overflow-y-auto rounded-t-3xl border-t bg-card p-4 shadow-soft md:static md:h-full md:max-h-none md:w-96 md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:p-5",
        expanded && "max-h-[55%]",
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="mr-auto min-w-0 truncate text-xl font-semibold">
          {focusedName && !expanded ? (
            <>
              <span className="md:hidden">{focusedName}</span>
              <span className="max-md:hidden">แผนผัง</span>
            </>
          ) : (
            "แผนผัง"
          )}
        </h1>
        {expanded ? (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => onExpandedChange(false)}
            aria-expanded
            aria-label="ย่อแผงนี้"
          >
            <ChevronDown className="size-5" />
          </Button>
        ) : (
          <Button size="sm" className="shrink-0 md:hidden" onClick={() => onExpandedChange(true)} aria-expanded={false}>
            {focusedPersonId ? `ดูความสัมพันธ์ ${relationshipCount}` : "ค้นหาและกรองเส้น"}
          </Button>
        )}
      </div>

      <div className={cn("mt-4 space-y-4", !expanded && "max-md:hidden")}>
      {focusedPersonId ? (
        <>
          <details className="group rounded-xl bg-muted px-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
              ค้นหาคนอื่นและกรองเส้น
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pt-1 pb-3">
              <ExploreControls {...controls} />
            </div>
          </details>
          <ProfilePanel personId={focusedPersonId} onSelectPerson={controls.onSelectPerson} />
        </>
      ) : (
        <>
          <p className="text-muted-foreground">กดที่คนเพื่อดูว่าเขาเกี่ยวข้องกับใคร</p>
          <ExploreControls {...controls} />
        </>
      )}
      </div>
    </aside>
  );
}
