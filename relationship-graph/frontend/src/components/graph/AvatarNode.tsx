import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { cn } from "@/lib/utils";

export interface AvatarNodeData extends Record<string, unknown> {
  personId: string;
  displayName: string;
  avatar: string | null;
  dimmed: boolean;
  highlighted: boolean;
  emphasized: boolean;
  /** The person the graph is currently focused on (see GraphPage). */
  focused: boolean;
}

export type AvatarNodeType = Node<AvatarNodeData, "avatar">;

/** Avatar diameter in px - RelationshipEdge trims links back to this radius. */
export const NODE_AVATAR_SIZE = 56;

// Both handles sit at the node's centre and are invisible, so edges are drawn
// straight from centre to centre. Fixed Top/Bottom handles turned every link
// into an S-curve, which is what made a dense graph unreadable.
const CENTER_HANDLE =
  "!pointer-events-none !left-1/2 !top-[28px] !size-0 !min-h-0 !min-w-0 !-translate-x-1/2 !-translate-y-1/2 !border-0 !bg-transparent";

export function AvatarNode({ data, selected }: NodeProps<AvatarNodeType>) {
  const { displayName, avatar, dimmed, highlighted, emphasized, focused } = data;
  const active = focused || selected;

  return (
    <div
      className={cn(
        "flex w-28 cursor-pointer flex-col items-center gap-1 transition-opacity",
        dimmed && "opacity-15",
      )}
    >
      <Handle type="target" position={Position.Top} className={CENTER_HANDLE} />
      <PersonAvatar
        avatar={avatar}
        displayName={displayName}
        className={cn(
          "size-14 border-2 bg-card shadow-sm transition-all",
          active ? "border-primary ring-2 ring-primary/40" : "border-card",
          highlighted && !active && "border-yellow-400 ring-2 ring-yellow-400/40",
          emphasized && !highlighted && !active && "border-foreground/40",
        )}
      />
      <div
        className={cn(
          "max-w-full truncate rounded-sm bg-background/75 px-1 text-center text-[11px] leading-tight backdrop-blur-[1px]",
          active ? "font-semibold" : "font-medium",
        )}
      >
        {displayName}
      </div>
      <Handle type="source" position={Position.Bottom} className={CENTER_HANDLE} />
    </div>
  );
}
