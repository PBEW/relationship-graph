import { Cake, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import { GENDER_LABELS } from "@/lib/genderLabels";
import type { Person } from "@/types";

/** The accounts a person is known by, each on its own chip. */
export function PersonHandles({ person }: { person: Person }) {
  const handles = [
    ["VRChat", person.vrchat_name],
    ["Discord", person.discord],
    ["Steam", person.steam],
    ["Twitter", person.twitter],
  ].filter(([, value]) => value);

  if (handles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {handles.map(([label, value]) => (
        <Badge key={label} variant="secondary" className="block max-w-full truncate">
          {label}: {value}
        </Badge>
      ))}
    </div>
  );
}

/** Handles, gender, country, birthday and bio; shared by the profile page and graph panel. */
export function PersonDetails({ person }: { person: Person }) {
  const gender = person.gender && person.gender !== "unspecified" ? GENDER_LABELS[person.gender] : null;

  return (
    <div className="space-y-2">
      <PersonHandles person={person} />
      {(gender || person.country || person.birthday) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {gender && <span>{gender}</span>}
          {person.country && (
            <span className="flex items-center gap-1.5">
              <Globe className="size-4" /> {person.country}
            </span>
          )}
          {person.birthday && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Cake className="size-4" /> {formatDate(person.birthday)}
            </span>
          )}
        </div>
      )}
      {person.bio && <p className="max-w-prose text-sm whitespace-pre-line">{person.bio}</p>}
    </div>
  );
}
