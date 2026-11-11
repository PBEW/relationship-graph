import { Link } from "react-router-dom";

import { PersonHandles } from "@/components/people/PersonDetails";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import type { Person } from "@/types";

export function PersonCard({ person }: { person: Person }) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-soft transition-[background-color,transform] duration-200 hover:bg-muted motion-safe:active:scale-[0.97]"
    >
      <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-16" />
      <div className="min-w-0 flex-1 space-y-1">
        <div>
          <div className="truncate text-lg font-semibold">{person.display_name}</div>
          {person.nickname && (
            <div className="truncate text-sm text-muted-foreground">"{person.nickname}"</div>
          )}
        </div>
        <PersonHandles person={person} />
      </div>
    </Link>
  );
}
