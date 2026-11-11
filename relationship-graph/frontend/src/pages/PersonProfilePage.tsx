import { ArrowLeft, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PersonFormDialog } from "@/components/admin/PersonFormDialog";
import { QueryError } from "@/components/common/QueryError";
import { PersonDetails } from "@/components/people/PersonDetails";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { RelationshipList } from "@/components/relationships/RelationshipList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonProfile } from "@/hooks/usePersonProfile";
import { formatDate } from "@/lib/formatDate";
import { readableTypeColor } from "@/lib/typeColor";

const SECTION_CLASS = "rounded-2xl bg-card p-5 shadow-soft md:p-6";

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = usePersonProfile(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <QueryError title="เปิดโปรไฟล์นี้ไม่ได้" error={error} onRetry={() => void refetch()} />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link to="/people">กลับไปดูคนทั้งหมด</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { person, relationships, timeline, stats } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/people">
          <ArrowLeft className="size-4" />
          คนทั้งหมด
        </Link>
      </Button>

      <section className={SECTION_CLASS}>
        {/* Phones put a smaller avatar beside the name, so the relationships
            start on the first screen; wider screens give it its own column. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:items-start sm:gap-x-5">
          <PersonAvatar
            avatar={person.avatar}
            displayName={person.display_name}
            className="size-14 sm:row-span-3 sm:size-24"
          />
          <div>
            <h1 className="text-2xl font-semibold wrap-break-word md:text-3xl">{person.display_name}</h1>
            {person.nickname && <p className="text-muted-foreground">"{person.nickname}"</p>}
          </div>
          <div className="col-span-2 sm:col-span-1 sm:col-start-2">
            <PersonDetails person={person} />
          </div>
          <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:col-start-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                แก้ไขข้อมูล
              </Button>
              <Button asChild>
                <Link to={`/graph?person=${person.id}`}>
                  <Share2 className="size-4" />
                  ดูในแผนผัง
                </Link>
              </Button>
          </div>
        </div>
        {stats.total_relationships > 0 && (
          <p className="mt-4 border-t pt-4 tabular-nums">
            มีความสัมพันธ์ทั้งหมด {stats.total_relationships} รายการ ยังเป็นอยู่ {stats.active_relationships} และจบแล้ว{" "}
            {stats.ended_relationships}
          </p>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <RelationshipList personId={person.id} relationships={relationships} />
      </section>

      <section className={SECTION_CLASS}>
        <h2 className="mb-3 text-lg font-semibold">เกิดอะไรขึ้นบ้าง</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">ใส่วันที่เริ่มหรือวันที่จบให้ความสัมพันธ์ แล้วเรื่องราวจะขึ้นตรงนี้</p>
        ) : (
          <ol className="space-y-4 border-l-2 pl-4">
            {timeline.map((event, i) => (
              <li key={`${event.relationship_id}-${event.event}-${i}`} className="relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[23px] size-3 rounded-full"
                  style={{ backgroundColor: readableTypeColor(event.color) }}
                />
                <div className="text-xs text-muted-foreground tabular-nums">{formatDate(event.date)}</div>
                <div>
                  {event.event === "started"
                    ? `เริ่มเป็น${event.relationship_type}กับ `
                    : `จบการเป็น${event.relationship_type}กับ `}
                  <Link
                    to={`/people/${event.with_person_id}`}
                    className="font-medium underline decoration-primary decoration-2 underline-offset-4 transition-colors duration-200 hover:text-primary"
                  >
                    {event.with_person_name}
                  </Link>
                </div>
                {event.note && <div className="text-sm text-muted-foreground">{event.note}</div>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <PersonFormDialog open={editOpen} onOpenChange={setEditOpen} person={person} />
    </div>
  );
}
