import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { cn } from "@/lib/utils";

export interface AvatarNodeData extends Record<string, unknown> {
  personId: string;
  displayName: string;
  nickname: string | null;
  avatar: string | null;
  dimmed: boolean;
  highlighted: boolean;
  emphasized: boolean;
  collapsed: boolean;
  hasHiddenNeighbors: boolean;
  onToggleCollapse: (personId: string) => void;
}

export type AvatarNodeType = Node<AvatarNodeData, "avatar">;

export function AvatarNode({ data, selected }: NodeProps<AvatarNodeType>) {
  const { displayName, nickname, avatar, dimmed, highlighted, emphasized, collapsed, hasHiddenNeighbors } = data;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-2 shadow-sm transition-all",
        selected ? "border-primary ring-2 ring-primary" : "border-border",
        highlighted && "ring-2 ring-yellow-400",
        emphasized && !highlighted && "ring-2 ring-foreground/40 shadow-md",
        dimmed && "opacity-20",
      )}
      style={{ width: 96 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <PersonAvatar avatar={avatar} displayName={displayName} className="size-12" />
      <div className="w-full truncate text-center text-xs font-medium">{displayName}</div>
      {nickname && (
        <div className="w-full truncate text-center text-[10px] text-muted-foreground">
          "{nickname}"
        </div>
      )}
      {hasHiddenNeighbors && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse(data.personId);
          }}
          className="nodrag nopan absolute -bottom-2 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
          title={collapsed ? "Expand connections" : "Collapse connections"}
        >
          {collapsed ? <ChevronsUpDown className="size-3" /> : <ChevronsDownUp className="size-3" />}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}
