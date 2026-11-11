import { Link } from "react-router-dom";

import { PersonAvatar } from "@/components/people/PersonAvatar";

const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-[background-color,transform] duration-200 hover:bg-muted motion-safe:active:scale-[0.97]";

interface PersonRowProps {
  displayName: string;
  avatar: string | null;
  nickname?: string | null;
  /** Right-aligned detail, such as a count or a date. */
  trailing?: React.ReactNode;
  /** Where the row goes; without it, the row is a button calling onSelect. */
  to?: string;
  onSelect?: () => void;
}

/** One person in a list: home search results, home lists and the graph panel's search. */
export function PersonRow({ displayName, avatar, nickname, trailing, to, onSelect }: PersonRowProps) {
  const content = (
    <>
      <PersonAvatar avatar={avatar} displayName={displayName} className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{displayName}</span>
        {nickname && <span className="block truncate text-sm text-muted-foreground">"{nickname}"</span>}
      </span>
      {trailing && <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{trailing}</span>}
    </>
  );

  return to ? (
    <Link to={to} className={ROW_CLASS}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onSelect} className={ROW_CLASS}>
      {content}
    </button>
  );
}
