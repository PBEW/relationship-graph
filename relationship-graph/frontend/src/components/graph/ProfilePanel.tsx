import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { QueryError } from "@/components/common/QueryError";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { PersonDetails } from "@/components/people/PersonDetails";
import { RelationshipList } from "@/components/relationships/RelationshipList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonProfile } from "@/hooks/usePersonProfile";

interface ProfilePanelProps {
  personId: string;
  onSelectPerson: (personId: string) => void;
}

/** A person's profile beside the canvas: pressing a name walks the graph to them. */
export function ProfilePanel({ personId, onSelectPerson }: ProfilePanelProps) {
  const { data, isLoading, isError, error, refetch } = usePersonProfile(personId);

  if (isError) return <QueryError error={error} onRetry={() => void refetch()} />;

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const { person, relationships } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-16" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold wrap-break-word">{person.display_name}</h2>
          {person.nickname && <p className="truncate text-sm text-muted-foreground">"{person.nickname}"</p>}
        </div>
      </div>
      <PersonDetails person={person} />
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link to={`/people/${person.id}`}>
          <ExternalLink className="size-4" />
          ดูโปรไฟล์เต็ม
        </Link>
      </Button>
      <RelationshipList personId={person.id} relationships={relationships} onSelectPerson={onSelectPerson} />
    </div>
  );
}
