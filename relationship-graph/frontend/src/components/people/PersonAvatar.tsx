import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

interface PersonAvatarProps {
  avatar: string | null;
  displayName: string;
  className?: string;
}

export function PersonAvatar({ avatar, displayName, className }: PersonAvatarProps) {
  return (
    <Avatar className={cn("size-10", className)}>
      {avatar && <AvatarImage src={avatar} alt={displayName} />}
      <AvatarFallback>{initials(displayName)}</AvatarFallback>
    </Avatar>
  );
}
