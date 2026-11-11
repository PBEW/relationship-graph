import { SearchX, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PersonFormDialog } from "@/components/admin/PersonFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryError } from "@/components/common/QueryError";
import { SearchBar } from "@/components/common/SearchBar";
import { PersonRow } from "@/components/people/PersonRow";
import { TypeBadge } from "@/components/relationships/TypeBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDebounce } from "@/hooks/useDebounce";
import { usePeople } from "@/hooks/usePeople";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

const SEARCH_RESULT_LIMIT = 8;

function RowSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** A titled list on its own card, for the no-query view. */
function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="mb-2 px-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Totals, the most connected and newest people, and the relationship types. */
function Overview() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isError) return <QueryError error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      {isLoading || !data ? (
        <Skeleton className="h-7 w-72" />
      ) : (
        <p className="tabular-nums">
          ตอนนี้มี {data.total_people} คน และ {data.total_relationships} ความสัมพันธ์
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="เชื่อมกับคนอื่นมากที่สุด">
          {isLoading && <RowSkeletons />}
          <ul>
            {data?.most_connected.map((p) => (
              <li key={p.person_id}>
                <PersonRow
                  to={`/people/${p.person_id}`}
                  displayName={p.display_name}
                  avatar={p.avatar}
                  trailing={`${p.relationship_count} ความสัมพันธ์`}
                />
              </li>
            ))}
          </ul>
        </ListCard>

        <ListCard title="เพิ่งเพิ่มเข้ามา">
          {isLoading && <RowSkeletons />}
          <ul>
            {data?.recently_added.map((p) => (
              <li key={p.person_id}>
                <PersonRow
                  to={`/people/${p.person_id}`}
                  displayName={p.display_name}
                  avatar={p.avatar}
                  trailing={formatDate(p.created_at)}
                />
              </li>
            ))}
          </ul>
        </ListCard>
      </div>

      <ListCard title="ประเภทความสัมพันธ์">
        {isLoading && <RowSkeletons />}
        <ul className="divide-y">
          {data?.relationship_distribution.map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3 px-2 py-2.5">
              <TypeBadge name={d.name} color={d.color} />
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{d.count}</span>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

/**
 * The front door: most people arrive with one question about one person, so
 * the page is a search field with results directly under it.
 */
export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  // Enter pressed before the results for the current text have arrived.
  const [openWhenReady, setOpenWhenReady] = useState(false);
  // Autofocus would throw the on-screen keyboard over the page on phones.
  const [autoFocus] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  const query = search.trim();
  const debouncedQuery = useDebounce(query, 200);
  const hasQuery = query.length > 0;

  const { data: stats } = useDashboardStats();
  const results = usePeople(
    { search: debouncedQuery || undefined, per_page: SEARCH_RESULT_LIMIT },
    { enabled: !!debouncedQuery },
  );
  // usePeople keeps the previous page on screen while the next one loads, so
  // results only count as current once they are for exactly what is typed.
  const resultsAreCurrent = debouncedQuery === query && !results.isPlaceholderData && !!results.data;
  const people = results.data?.items ?? [];
  const showResults = hasQuery && !!debouncedQuery;

  useEffect(() => {
    if (!openWhenReady || !resultsAreCurrent) return;
    setOpenWhenReady(false);
    const top = results.data?.items[0];
    if (top) navigate(`/people/${top.id}`);
  }, [openWhenReady, resultsAreCurrent, results.data, navigate]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setOpenWhenReady(false);
  };

  const databaseIsEmpty = stats?.total_people === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pt-8 md:p-6 md:pt-12">
      <h1 className="text-3xl font-semibold text-balance md:text-4xl">วันนี้อยากรู้เรื่องใคร?</h1>

      {databaseIsEmpty ? (
        <EmptyState
          icon={UsersRound}
          title="ยังไม่มีใครในนี้เลย"
          description="เพิ่มเพื่อนคนแรกของกลุ่มเข้ามา แล้วค่อยบอกว่าเขาเกี่ยวข้องกับใคร"
          action={
            <Button size="lg" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-5" />
              เพิ่มคนแรก
            </Button>
          }
        />
      ) : (
        <>
          <SearchBar
            size="lg"
            value={search}
            onChange={onSearchChange}
            placeholder="พิมพ์ชื่อคนที่อยากรู้"
            autoFocus={autoFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hasQuery) setOpenWhenReady(true);
            }}
          />

          {showResults ? (
            results.isError ? (
              <QueryError error={results.error} onRetry={() => void results.refetch()} />
            ) : results.isLoading ? (
              <RowSkeletons count={4} />
            ) : people.length > 0 ? (
              <ul
                aria-label="ผลการค้นหา"
                className={cn(
                  "rounded-2xl bg-card p-2 shadow-soft transition-opacity duration-200",
                  !resultsAreCurrent && "opacity-60",
                )}
              >
                {people.map((person) => (
                  <li key={person.id}>
                    <PersonRow
                      to={`/people/${person.id}`}
                      displayName={person.display_name}
                      avatar={person.avatar}
                      nickname={person.nickname}
                    />
                  </li>
                ))}
              </ul>
            ) : !resultsAreCurrent ? (
              <RowSkeletons count={4} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={`ไม่พบคนชื่อ "${query}"`}
                description="ลองสะกดอีกแบบ หรือเพิ่มคนนี้เข้ามาเลยก็ได้"
                action={
                  <Button onClick={() => setAddOpen(true)}>
                    <UserPlus className="size-4" />
                    เพิ่มคนชื่อนี้
                  </Button>
                }
              />
            )
          ) : hasQuery ? (
            <RowSkeletons count={4} />
          ) : (
            <Overview />
          )}
        </>
      )}

      <PersonFormDialog open={addOpen} onOpenChange={setAddOpen} person={null} defaultName={query} />
    </div>
  );
}
