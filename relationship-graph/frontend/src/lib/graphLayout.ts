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
  width = 1000,
  height = 700,
): Map<string, PositionedNode> {
  interface SimNode {
    id: string;
    x?: number;
    y?: number;
  }

  const simNodes: SimNode[] = data.nodes.map((n) => ({ id: n.id }));
  const simLinks = data.edges.map((e) => ({ source: e.source, target: e.target }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d) => (d as SimNode).id)
        .distance(160),
    )
    .force("charge", forceManyBody().strength(-320))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(70))
    .stop();

  simulation.tick(300);

  const positions = new Map<string, PositionedNode>();
  for (const node of simNodes) {
    positions.set(node.id, { id: node.id, x: node.x ?? 0, y: node.y ?? 0 });
  }
  return positions;
}
