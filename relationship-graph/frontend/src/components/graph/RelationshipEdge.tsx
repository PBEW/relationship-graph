import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string;
  color: string;
  status: "active" | "ended";
  dimmed: boolean;
  /** Connected to the hovered/selected node, or matches an active search - draw it more prominently and show its label. */
  emphasized: boolean;
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, "relationship">;

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (!data) return null;
  const { label, color, status, dimmed, emphasized } = data;
  const showLabel = selected || emphasized;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : emphasized ? 2.5 : 1.5,
          opacity: dimmed ? 0.08 : emphasized ? 0.95 : status === "ended" ? 0.25 : 0.35,
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
