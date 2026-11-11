import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from "@xyflow/react";

import { TypeBadge } from "@/components/relationships/TypeBadge";
import { EDGE_TRIM, PARALLEL_SPREAD, parallelBendStep } from "@/lib/graphLayout";
import { cn } from "@/lib/utils";

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string;
  /** Already passed through readableTypeColor. */
  color: string;
  status: "active" | "ended";
  dimmed: boolean;
  /** A line in the focused person's ring, or one of the hovered person's: draw it strongly and print its words. */
  emphasized: boolean;
  /** A line among the focused person's neighbours: context only, never labelled. */
  faint: boolean;
  /** 0 for the first link between a pair, 1+ for each extra one - bends duplicates apart so they don't sit on top of each other. */
  parallelIndex: number;
  /** Where along the line (0 to 1, source to target) the words sit. */
  labelT: number;
  onSelect: (edgeId: string) => void;
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, "relationship">;


export function RelationshipEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps<RelationshipEdgeType>) {
  if (!data) return null;
  const { label, color, status, dimmed, emphasized, faint, parallelIndex, labelT, onSelect } = data;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy);
  // Overlapping nodes would otherwise produce a backwards (or NaN) path.
  if (length < EDGE_TRIM * 2) return null;

  const ux = dx / length;
  const uy = dy / length;
  const sx = sourceX + ux * EDGE_TRIM;
  const sy = sourceY + uy * EDGE_TRIM;
  const tx = targetX - ux * EDGE_TRIM;
  const ty = targetY - uy * EDGE_TRIM;

  // Alternate the bend side (…, -2, +1, -1, 0, +1, +2 …) so a pair with three
  // relationships fans out symmetrically rather than drifting to one side. The
  // sign follows the id order because two links in a pair may run in opposite
  // directions, which would otherwise send them to the same side.
  const bend = parallelBendStep(parallelIndex) * PARALLEL_SPREAD * (source < target ? 1 : -1);
  const cx = (sx + tx) / 2 - uy * bend;
  const cy = (sy + ty) / 2 + ux * bend;

  const edgePath = bend === 0 ? `M ${sx},${sy} L ${tx},${ty}` : `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
  // A point on the quadratic curve (also correct for a straight line, whose
  // control point is its own midpoint).
  const labelX = (1 - labelT) ** 2 * sx + 2 * labelT * (1 - labelT) * cx + labelT ** 2 * tx;
  const labelY = (1 - labelT) ** 2 * sy + 2 * labelT * (1 - labelT) * cy + labelT ** 2 * ty;

  const showLabel = selected || emphasized;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        // The stroke is the type's runtime colour. React Flow's own stylesheet
        // is unlayered, so the width and dash utilities must be important.
        style={{ stroke: color }}
        className={cn(
          "transition-opacity duration-200",
          selected ? "[stroke-width:3.5]!" : emphasized ? "[stroke-width:2.5]!" : "[stroke-width:1.5]!",
          status === "ended" && "[stroke-dasharray:6_5]!",
          dimmed
            ? "opacity-5"
            : selected || emphasized
              ? "opacity-100"
              : faint
                ? "opacity-20"
                : status === "ended"
                  ? "opacity-25"
                  : "opacity-40",
        )}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          {/* The position is computed per frame from the nodes, so it can't be a class. */}
          <div
            className="nodrag nopan absolute"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "pointer-events-auto block max-w-44 cursor-pointer rounded-full [scale:var(--graph-label-scale,1)] group-data-[words=hidden]/graph:hidden",
                dimmed && "opacity-15",
              )}
            >
              <TypeBadge name={label} color={color} className="bg-card shadow-soft" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
