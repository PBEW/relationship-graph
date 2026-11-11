import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { cn } from "@/lib/utils";

export interface AvatarNodeData extends Record<string, unknown> {
  personId: string;
  displayName: string;
  avatar: string | null;
  dimmed: boolean;
  /** The hovered person or one of their neighbours in the whole-graph view. */
  emphasized: boolean;
  /** The person the graph is currently focused on (see GraphPage). */
  focused: boolean;
}

export type AvatarNodeType = Node<AvatarNodeData, "avatar">;

// Both handles sit at the node's centre and are invisible, so edges are drawn
// straight from centre to centre. Fixed Top/Bottom handles turned every link
// into an S-curve, which is what made a dense graph unreadable.
const CENTER_HANDLE =
  "!pointer-events-none !left-1/2 !top-[28px] !size-0 !min-h-0 !min-w-0 !-translate-x-1/2 !-translate-y-1/2 !border-0 !bg-transparent";

/**
 * One person on the canvas. The name counter-scales with --graph-label-scale so
 * it never renders under 14px, and is hidden while zoomed far out, where every
 * name at that size would land on top of its neighbours (GraphPage sets both).
 */
export function AvatarNode({ data }: NodeProps<AvatarNodeType>) {
  const { displayName, avatar, dimmed, emphasized, focused } = data;

  return (
    <div
      className={cn(
        "flex w-28 cursor-pointer flex-col items-center gap-1 transition-opacity duration-200",
        dimmed && "opacity-15",
      )}
    >
      <Handle type="target" position={Position.Top} className={CENTER_HANDLE} />
      <PersonAvatar
        avatar={avatar}
        displayName={displayName}
        className={cn(
          "size-14 border-2 bg-card shadow-soft transition-colors duration-200",
          focused ? "border-primary ring-4 ring-primary/30" : emphasized ? "border-foreground/40" : "border-card",
        )}
      />
      <div
        className={cn(
          "max-w-full origin-top truncate rounded-full bg-card px-2 text-center text-xs shadow-soft [scale:var(--graph-label-scale,1)]",
          focused ? "font-semibold" : "font-medium",
          !focused && !emphasized && "group-data-[zoom=far]/graph:invisible",
        )}
      >
        {displayName}
      </div>
      <Handle type="source" position={Position.Bottom} className={CENTER_HANDLE} />
    </div>
  );
}
