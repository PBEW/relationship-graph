import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";

import type { GraphData } from "@/types";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

/**
 * Runs a force-directed simulation synchronously (fixed tick count, no live
 * animation) to produce initial node positions - mimics a social-network
 * graph layout. Nodes stay draggable afterward; this only seeds positions.
 */
export function computeForceLayout(
  data: GraphData,
  width = 1400,
  height = 1000,
): Map<string, PositionedNode> {
  interface SimNode {
    id: string;
    x?: number;
    y?: number;
  }

  const simNodes: SimNode[] = data.nodes.map((n) => ({ id: n.id }));
  const simLinks = data.edges.map((e) => ({ source: e.source, target: e.target }));

  // More link distance / repulsion / collision radius than a naive default -
  // dense graphs (100+ nodes) need real breathing room or every edge overlaps.
  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d) => (d as SimNode).id)
        .distance(220),
    )
    .force("charge", forceManyBody().strength(-450))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(95))
    .stop();

  simulation.tick(400);

  const positions = new Map<string, PositionedNode>();
  for (const node of simNodes) {
    positions.set(node.id, { id: node.id, x: node.x ?? 0, y: node.y ?? 0 });
  }
  return positions;
}

/**
 * Lays one person out at the centre with their direct connections evenly
 * spaced on a ring around them - used by the graph's focus mode.
 *
 * Reusing the whole-graph force positions there would leave the neighbours
 * scattered across the canvas (they're placed relative to *everyone*), which
 * defeats the point of focusing. A ring is deterministic and stays readable.
 */
export function computeRadialLayout(
  centerId: string,
  neighborIds: string[],
): Map<string, PositionedNode> {
  const positions = new Map<string, PositionedNode>();
  positions.set(centerId, { id: centerId, x: 0, y: 0 });

  const count = neighborIds.length;
  if (count === 0) return positions;

  // Grow the ring with the neighbour count so cards never overlap: each one
  // needs ~150px of arc, and circumference = 2πr.
  const radius = Math.max(260, (count * 150) / (2 * Math.PI));

  neighborIds.forEach((id, index) => {
    // Start at the top (-90°) so the first neighbour isn't hidden behind the
    // focused person's name label.
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    positions.set(id, {
      id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  });

  return positions;
}
