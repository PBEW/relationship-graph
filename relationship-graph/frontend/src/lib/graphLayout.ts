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

const MIN_RING_RADIUS = 300;
/** Enough that a ring's words show at its desktop fit zoom, even on a small laptop (see the tests). */
const RING_RADIUS_PER_NEIGHBOR = 56;
// Phones fit the ring to a narrow width, so it is drawn tighter there to keep
// avatars big enough to tap; the words give way instead (see computeRingLabels).
const COMPACT_MIN_RING_RADIUS = 200;
const COMPACT_RING_RADIUS_PER_NEIGHBOR = 20;

function ringRadius(count: number, compact: boolean): number {
  return compact
    ? Math.max(COMPACT_MIN_RING_RADIUS, count * COMPACT_RING_RADIUS_PER_NEIGHBOR)
    : Math.max(MIN_RING_RADIUS, count * RING_RADIUS_PER_NEIGHBOR);
}

// Start at the top so the first neighbour isn't hidden behind the focused
// person's name label.
function ringAngle(index: number, count: number): number {
  return (index / count) * 2 * Math.PI - Math.PI / 2;
}

/**
 * Lays one person out at the centre with their direct connections evenly
 * spaced on a ring around them - used by the graph's focus mode.
 *
 * Reusing the whole-graph force positions there would leave the neighbours
 * scattered across the canvas (they're placed relative to *everyone*), which
 * defeats the point of focusing. A ring is deterministic and stays readable.
 *
 * @param compact the tighter ring for phone-width canvases
 */
export function computeRadialLayout(
  centerId: string,
  neighborIds: string[],
  compact = false,
): Map<string, PositionedNode> {
  const positions = new Map<string, PositionedNode>();
  positions.set(centerId, { id: centerId, x: 0, y: 0 });

  const count = neighborIds.length;
  if (count === 0) return positions;

  const radius = ringRadius(count, compact);

  neighborIds.forEach((id, index) => {
    const angle = ringAngle(index, count);
    positions.set(id, {
      id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  });

  return positions;
}

/** Lines stop this far from a node's centre: just outside the avatar, instead of running under the face. */
export const EDGE_TRIM = 34;
/** Perpendicular offset per extra link between the same two people. */
export const PARALLEL_SPREAD = 80;

/** Side and size of the bend for the nth link between a pair: 0, +1, -1, +2, -2 … */
export function parallelBendStep(parallelIndex: number): number {
  return Math.ceil(parallelIndex / 2) * (parallelIndex % 2 === 0 ? -1 : 1);
}

/** The words printed on a line, in px on screen (a long type name such as "เคยเป็นแฟนกัน"). */
const LABEL_SIZE = { width: 120, height: 32 };
/** A node's name: its top edge below the avatar's centre, and its largest size, in px on screen. */
const NAME_BOX = { top: 32, width: 112, height: 24 };
/** How far the words may be counter-scaled while still fitting, tried largest first. */
const LABEL_SCALES = [5, 4, 3, 2.5, 2, 1.75, 1.5, 1.25, 1];
/** Preferred first; well clear of both avatars' names at each end. */
const LABEL_T_CANDIDATES = [0.46, 0.66, 0.34, 0.56, 0.76, 0.26, 0.82, 0.4, 0.6, 0.7, 0.3, 0.5, 0.72, 0.22];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

/**
 * Where the words of one link in a ring sit, relative to the centre: `t` along
 * the line from the centre, following the same bend RelationshipEdge draws.
 */
export function ringLabelPoint(
  centerId: string,
  neighborId: string,
  index: number,
  count: number,
  parallelIndex: number,
  t: number,
  compact: boolean,
): { x: number; y: number } {
  const radius = ringRadius(count, compact);
  const angle = ringAngle(index, count);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const along = EDGE_TRIM + t * (radius - 2 * EDGE_TRIM);
  // RelationshipEdge bends towards the side given by the lower id's direction.
  const side = centerId < neighborId ? 1 : -1;
  const across = 2 * t * (1 - t) * parallelBendStep(parallelIndex) * PARALLEL_SPREAD * side;
  return { x: ux * along - uy * across, y: uy * along + ux * across };
}

export interface RingLabels {
  /** Per neighbour, per link with the centre: where along it (0 to 1, from the centre) its words sit. */
  ts: Map<string, number[]>;
  /** Below this zoom the words would overlap, so the page hides them and the lines speak by colour. */
  wordsMinZoom: number;
  /** Below this zoom the neighbours' names would run into each other. */
  namesMinZoom: number;
}

/**
 * Places the words on every line of a ring so that none overlap each other or
 * anyone's name, at the largest counter-scale for which that is possible. The
 * words stay 14px on screen, so the scale they survive sets the lowest zoom at
 * which they can show. Placing them one at a time also copes with odd rings and
 * with several links to the same neighbour.
 *
 * @param linkCounts how many links each neighbour has with the centre
 */
export function computeRingLabels(
  centerId: string,
  neighborIds: string[],
  linkCounts: Map<string, number>,
  compact: boolean,
): RingLabels {
  const count = neighborIds.length;
  const radius = ringRadius(count, compact);
  const chord = count > 1 ? 2 * radius * Math.sin(Math.PI / count) : Infinity;
  const namesMinZoom = NAME_BOX.width / chord;

  const attempt = (scale: number): Map<string, number[]> | null => {
    const nameAt = (x: number, y: number): Box => ({
      x,
      y: y + NAME_BOX.top + (NAME_BOX.height * scale) / 2,
      width: NAME_BOX.width * scale,
      height: NAME_BOX.height * scale,
    });
    const placed: Box[] = [
      nameAt(0, 0),
      ...neighborIds.map((_, i) => {
        const angle = ringAngle(i, count);
        return nameAt(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }),
    ];
    const ts = new Map<string, number[]>();

    for (const [index, neighborId] of neighborIds.entries()) {
      const neighborTs: number[] = [];
      for (let parallelIndex = 0; parallelIndex < (linkCounts.get(neighborId) ?? 1); parallelIndex++) {
        const box = LABEL_T_CANDIDATES.map((t) => ({
          t,
          box: {
            ...ringLabelPoint(centerId, neighborId, index, count, parallelIndex, t, compact),
            width: LABEL_SIZE.width * scale,
            height: LABEL_SIZE.height * scale,
          },
        })).find(({ box }) => !placed.some((other) => overlaps(other, box)));
        if (!box) return null;
        placed.push(box.box);
        neighborTs.push(box.t);
      }
      ts.set(neighborId, neighborTs);
    }
    return ts;
  };

  for (const scale of LABEL_SCALES) {
    const ts = attempt(scale);
    if (ts) return { ts, wordsMinZoom: 1 / scale, namesMinZoom };
  }
  // Too crowded even at full size: keep sensible positions but never show the words.
  const fallback = new Map(neighborIds.map((id) => [id, Array<number>(linkCounts.get(id) ?? 1).fill(0.5)]));
  return { ts: fallback, wordsMinZoom: Infinity, namesMinZoom };
}

/**
 * Where along a line (0 to 1 from source to target) its words sit outside a
 * ring. Extra links between the same pair shift along the line so theirs don't stack.
 */
export function edgeLabelT(parallelIndex: number): number {
  return Math.min(0.85, Math.max(0.15, 0.5 + parallelBendStep(parallelIndex) * 0.12));
}

/** The person with the most relationships; the first of them on a tie, or null with nobody. */
export function mostConnectedPersonId(data: GraphData): string | null {
  const counts = new Map<string, number>();
  for (const edge of data.edges) {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = -1;
  for (const node of data.nodes) {
    const count = counts.get(node.id) ?? 0;
    if (count > bestCount) {
      best = node.id;
      bestCount = count;
    }
  }
  return best;
}
