import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string;
  color: string;
  status: "active" | "ended";
  dimmed: boolean;
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
  const { label, color, status, dimmed } = data;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          opacity: dimmed ? 0.15 : status === "ended" ? 0.5 : 0.9,
          strokeDasharray: status === "ended" ? "6 4" : undefined,
        }}
      />
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
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
