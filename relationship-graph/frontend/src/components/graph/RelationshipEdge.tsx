import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from "@xyflow/react";

import { NODE_AVATAR_SIZE } from "@/components/graph/AvatarNode";
import { cn } from "@/lib/utils";

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string;
  color: string;
  status: "active" | "ended";
  dimmed: boolean;
  /** Connected to the hovered/selected node, or matches an active search - draw it more prominently and show its label. */
  emphasized: boolean;
  /** 0 for the first link between a pair, 1+ for each extra one - bends duplicates apart so they don't sit on top of each other. */
  parallelIndex: number;
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, "relationship">;

/** Stop the line just outside the avatar instead of running under the face. */
const TRIM = NODE_AVATAR_SIZE / 2 + 6;
/** Perpendicular offset per extra link between the same two people. */
const PARALLEL_SPREAD = 34;

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps<RelationshipEdgeType>) {
  if (!data) return null;
  const { label, color, status, dimmed, emphasized, parallelIndex } = data;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy);
  // Overlapping nodes would otherwise produce a backwards (or NaN) path.
  if (length < TRIM * 2) return null;

  const ux = dx / length;
  const uy = dy / length;
  const sx = sourceX + ux * TRIM;
  const sy = sourceY + uy * TRIM;
  const tx = targetX - ux * TRIM;
  const ty = targetY - uy * TRIM;

  // Alternate the bend side (…, -2, +1, -1, 0, +1, +2 …) so a pair with three
  // relationships fans out symmetrically rather than drifting to one side.
  const bendStep = Math.ceil(parallelIndex / 2) * (parallelIndex % 2 === 0 ? -1 : 1);
  const bend = bendStep * PARALLEL_SPREAD;
  const cx = (sx + tx) / 2 - uy * bend;
  const cy = (sy + ty) / 2 + ux * bend;

  const edgePath = bend === 0 ? `M ${sx},${sy} L ${tx},${ty}` : `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
  // Midpoint of the quadratic curve, which is where the label reads best.
  const labelX = 0.25 * sx + 0.5 * cx + 0.25 * tx;
  const labelY = 0.25 * sy + 0.5 * cy + 0.25 * ty;

  const showLabel = selected || emphasized;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : emphasized ? 2.5 : 1.5,
          opacity: dimmed ? 0.06 : emphasized ? 0.95 : status === "ended" ? 0.3 : 0.45,
          strokeDasharray: status === "ended" ? "6 4" : undefined,
        }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan absolute rounded-full border px-1.5 py-0.5 text-[10px] font-medium shadow-sm",
              dimmed && "opacity-15",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: "var(--card)",
              borderColor: color,
              color,
              zIndex: 1000,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
