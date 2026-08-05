import { Cake, ExternalLink, Globe, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { RelationshipFormDialog } from "@/components/admin/RelationshipFormDialog";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePersonProfile } from "@/hooks/usePersonProfile";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ProfileSheetProps {
  personId: string | null;
  onClose: () => void;
  onSelectPerson: (personId: string) => void;
}

export function ProfileSheet({ personId, onClose, onSelectPerson }: ProfileSheetProps) {
  const { data, isLoading } = usePersonProfile(personId ?? undefined);
  const { isAuthenticated } = useAuth();
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);

  return (
    <Sheet open={!!personId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>โปรไฟล์</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {data && (
          <div className="space-y-5 p-4">
            <div className="flex items-start gap-3">
              <PersonAvatar
                avatar={data.person.avatar}
                displayName={data.person.display_name}
                className="size-16"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{data.person.display_name}</div>
                {data.person.nickname && (
                  <div className="text-sm text-muted-foreground">"{data.person.nickname}"</div>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {data.person.country && (
                    <span className="flex items-center gap-1">
                      <Globe className="size-3" /> {data.person.country}
                    </span>
                  )}
                  {data.person.birthday && (
                    <span className="flex items-center gap-1">
                      <Cake className="size-3" /> {formatDate(data.person.birthday)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {data.person.bio && <p className="text-sm">{data.person.bio}</p>}

            <div className="flex flex-wrap gap-1.5">
              {data.person.vrchat_name && <Badge variant="secondary">VRChat: {data.person.vrchat_name}</Badge>}
              {data.person.discord && <Badge variant="secondary">Discord: {data.person.discord}</Badge>}
              {data.person.steam && <Badge variant="secondary">Steam: {data.person.steam}</Badge>}
              {data.person.twitter && <Badge variant="secondary">Twitter: {data.person.twitter}</Badge>}
            </div>

            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={`/people/${data.person.id}`}>
                <ExternalLink className="size-3.5" />
                ดูโปรไฟล์แบบเต็ม
              </Link>
            </Button>

            <Separator />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  ความสัมพันธ์ ({data.relationships.length})
                </h3>
                {isAuthenticated && (
                  <Button size="sm" variant="ghost" onClick={() => setAddRelationshipOpen(true)}>
                    <Plus className="size-3.5" />
                    เพิ่ม
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                {data.relationships.map((rel) => {
                  const other = rel.person_a_id === data.person.id ? rel.person_b : rel.person_a;
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectPerson(other.id)}
                      className="flex w-full items-center justify-between rounded-md border border-border p-2 text-left text-sm hover:bg-accent/50"
                    >
                      <span className="flex items-center gap-2">
                        <PersonAvatar avatar={other.avatar} displayName={other.display_name} className="size-7" />
                        {other.display_name}
                      </span>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${rel.relationship_type.color}20`,
                          color: rel.relationship_type.color,
                          borderColor: `${rel.relationship_type.color}40`,
                        }}
                      >
                        {rel.relationship_type.name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {data && (
          <RelationshipFormDialog
            open={addRelationshipOpen}
            onOpenChange={setAddRelationshipOpen}
            relationship={null}
            defaultPersonId={data.person.id}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
