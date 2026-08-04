import { describe, expect, it } from 'vitest';

import { computeForceLayout } from '@/lib/graphLayout';
import type { GraphData } from '@/types';

function makeGraph(nodeCount: number, edges: [number, number][]): GraphData {
  return {
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      id: `person-${i}`,
      display_name: `Person ${i}`,
      nickname: null,
      avatar: null,
    })),
    edges: edges.map(([a, b], i) => ({
      id: `edge-${i}`,
      source: `person-${a}`,
      target: `person-${b}`,
      status: 'active' as const,
      start_date: null,
      end_date: null,
      note: null,
      relationship_type: {
        id: 'type-1',
        name: 'Friend',
        color: '#06B6D4',
        icon: 'users',
        description: null,
      },
    })),
  };
}

describe('computeForceLayout', () => {
  it('returns a position for every node', () => {
    const data = makeGraph(5, [[0, 1], [1, 2]]);
    const positions = computeForceLayout(data);

    expect(positions.size).toBe(5);
    for (const node of data.nodes) {
      expect(positions.has(node.id)).toBe(true);
    }
  });

  it('produces finite, non-NaN coordinates', () => {
    const data = makeGraph(10, [[0, 1], [2, 3], [4, 5], [1, 6]]);
    const positions = computeForceLayout(data);

    for (const pos of positions.values()) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    }
  });

  it('handles a graph with no edges', () => {
    const data = makeGraph(3, []);
    const positions = computeForceLayout(data);
    expect(positions.size).toBe(3);
  });

  it('handles an empty graph', () => {
    const data = makeGraph(0, []);
    const positions = computeForceLayout(data);
    expect(positions.size).toBe(0);
  });
});
