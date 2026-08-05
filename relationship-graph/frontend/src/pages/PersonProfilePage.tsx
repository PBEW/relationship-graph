import { ArrowLeft, Cake, Globe, MessageCircleHeart, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { RelationshipFormDialog } from "@/components/admin/RelationshipFormDialog";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePersonProfile } from "@/hooks/usePersonProfile";
import { GENDER_LABELS } from "@/lib/genderLabels";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = usePersonProfile(id);
  const { isAuthenticated } = useAuth();
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center text-muted-foreground">
        ไม่พบข้อมูลคนนี้
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/people">กลับไปหน้ารายชื่อคน</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { person, relationships, timeline, stats } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/people">
          <ArrowLeft className="size-4" />
          กลับไปหน้ารายชื่อคน
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-20" />
          <div className="flex-1 space-y-2">
            <div>
              <h1 className="text-2xl font-semibold">{person.display_name}</h1>
              {person.nickname && (
                <p className="text-muted-foreground">"{person.nickname}"</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {person.vrchat_name && <Badge variant="secondary">VRChat: {person.vrchat_name}</Badge>}
              {person.discord && <Badge variant="secondary">Discord: {person.discord}</Badge>}
              {person.steam && <Badge variant="secondary">Steam: {person.steam}</Badge>}
              {person.twitter && <Badge variant="secondary">Twitter: {person.twitter}</Badge>}
              {person.gender && <Badge variant="outline">{GENDER_LABELS[person.gender]}</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {person.country && (
                <span className="flex items-center gap-1">
                  <Globe className="size-3.5" /> {person.country}
                </span>
              )}
              {person.birthday && (
                <span className="flex items-center gap-1">
                  <Cake className="size-3.5" /> {formatDate(person.birthday)}
                </span>
              )}
            </div>
            {person.bio && <p className="text-sm">{person.bio}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold">{stats.total_relationships}</div>
            <div className="text-xs text-muted-foreground">ทั้งหมด</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold">{stats.active_relationships}</div>
            <div className="text-xs text-muted-foreground">คบกันอยู่</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-semibold">{stats.ended_relationships}</div>
            <div className="text-xs text-muted-foreground">เลิกกันแล้ว</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircleHeart className="size-4" />
            ความสัมพันธ์
          </CardTitle>
          {isAuthenticated && (
            <Button size="sm" variant="outline" onClick={() => setAddRelationshipOpen(true)}>
              <Plus className="size-4" />
              เพิ่มความสัมพันธ์
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีความสัมพันธ์</p>
          ) : (
            relationships.map((rel) => {
              const other = rel.person_a_id === person.id ? rel.person_b : rel.person_a;
              return (
                <Link
                  key={rel.id}
                  to={`/people/${other.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <PersonAvatar avatar={other.avatar} displayName={other.display_name} className="size-8" />
                    <span className="font-medium">{other.display_name}</span>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${rel.relationship_type.color}20`,
                      color: rel.relationship_type.color,
                      borderColor: `${rel.relationship_type.color}40`,
                    }}
                    variant="outline"
                  >
                    {rel.relationship_type.name}
                    {rel.status === "ended" && " (เลิกแล้ว)"}
                  </Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ไทม์ไลน์</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีเหตุการณ์ในไทม์ไลน์</p>
          ) : (
            <ol className="space-y-4 border-l border-border pl-4">
              {timeline.map((event, i) => (
                <li key={`${event.relationship_id}-${event.event}-${i}`} className="relative">
                  <span
                    className="absolute -left-[21px] top-1 size-2.5 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="text-xs text-muted-foreground">{formatDate(event.date)}</div>
                  <div className="text-sm">
                    <span className="font-medium">
                      {event.event === "started"
                        ? event.relationship_type
                        : `เลิก${event.relationship_type}กัน`}
                    </span>{" "}
                    กับ{" "}
                    <Link to={`/people/${event.with_person_id}`} className="underline underline-offset-2">
                      {event.with_person_name}
                    </Link>
                  </div>
                  {event.note && <div className="text-xs text-muted-foreground">{event.note}</div>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <RelationshipFormDialog
        open={addRelationshipOpen}
        onOpenChange={setAddRelationshipOpen}
        relationship={null}
        defaultPersonId={person.id}
      />
    </div>
  );
}
