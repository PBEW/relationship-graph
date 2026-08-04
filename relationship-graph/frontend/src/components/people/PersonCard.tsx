import { Link } from "react-router-dom";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Person } from "@/types";

export function PersonCard({ person }: { person: Person }) {
  return (
    <Link to={`/people/${person.id}`}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
        <CardContent className="flex items-center gap-3 p-4">
          <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{person.display_name}</div>
            {person.nickname && (
              <div className="truncate text-sm text-muted-foreground">"{person.nickname}"</div>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {person.vrchat_name && <Badge variant="secondary">VRChat: {person.vrchat_name}</Badge>}
              {person.discord && <Badge variant="secondary">Discord: {person.discord}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
