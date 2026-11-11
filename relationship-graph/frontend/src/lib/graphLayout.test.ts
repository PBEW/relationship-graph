import { describe, expect, it } from 'vitest';

import {
  computeForceLayout,
  computeRadialLayout,
  computeRingLabels,
  edgeLabelT,
  ringLabelPoint,
  mostConnectedPersonId,
} from '@/lib/graphLayout';
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

describe('computeRadialLayout', () => {
  it('puts the focused person at the origin', () => {
    const positions = computeRadialLayout('center', ['a', 'b', 'c']);
    expect(positions.get('center')).toEqual({ id: 'center', x: 0, y: 0 });
  });

  it('positions every neighbour, all at the same distance from the centre', () => {
    const neighbors = ['a', 'b', 'c', 'd', 'e'];
    const positions = computeRadialLayout('center', neighbors);

    expect(positions.size).toBe(neighbors.length + 1);
    const radii = neighbors.map((id) => {
      const pos = positions.get(id)!;
      return Math.hypot(pos.x, pos.y);
    });
    for (const radius of radii) {
      expect(radius).toBeCloseTo(radii[0], 6);
    }
  });

  it('grows the ring so crowded neighbourhoods do not overlap', () => {
    const small = computeRadialLayout('center', ['a', 'b']);
    const large = computeRadialLayout('center', Array.from({ length: 40 }, (_, i) => `n${i}`));

    const radiusOf = (positions: ReturnType<typeof computeRadialLayout>, id: string) => {
      const pos = positions.get(id)!;
      return Math.hypot(pos.x, pos.y);
    };
    expect(radiusOf(large, 'n0')).toBeGreaterThan(radiusOf(small, 'a'));
  });

  it('handles a person with no connections', () => {
    const positions = computeRadialLayout('lonely', []);
    expect(positions.size).toBe(1);
    expect(positions.get('lonely')).toEqual({ id: 'lonely', x: 0, y: 0 });
  });
});

describe('edgeLabelT', () => {
  it('moves parallel links apart', () => {
    expect(edgeLabelT(1)).not.toBe(edgeLabelT(0));
    expect(edgeLabelT(2)).not.toBe(edgeLabelT(1));
  });
});

describe('computeRingLabels', () => {
  // The words are 120x32 on screen however far the view zooms out, so in graph
  // units they grow by 1/zoom; the page only shows them at wordsMinZoom or above.
  const LABEL = { width: 120, height: 32 };
  // A small laptop's canvas has about 550px of height to fit the ring into, and
  // the fit never goes below 0.5 or above 1.1 on desktop.
  const desktopFitZoom = (count: number) => {
    const radius = Math.hypot(computeRadialLayout('c', Array.from({ length: count }, (_, i) => `n${i}`)).get('n0')!.x, computeRadialLayout('c', Array.from({ length: count }, (_, i) => `n${i}`)).get('n0')!.y);
    return Math.min(1.1, Math.max(0.5, 550 / (2 * radius + 170)));
  };

  function ring(count: number, linksEach: number, compact: boolean) {
    const ids = Array.from({ length: count }, (_, i) => `n${i}`);
    const links = new Map(ids.map((id) => [id, linksEach]));
    return { ids, links, labels: computeRingLabels('center', ids, links, compact) };
  }

  function expectNoOverlap(count: number, linksEach: number, compact: boolean) {
    const { ids, labels } = ring(count, linksEach, compact);
    const scale = 1 / labels.wordsMinZoom;
    const boxes = ids.flatMap((id, index) =>
      labels.ts.get(id)!.map((t, parallel) =>
        ringLabelPoint('center', id, index, count, parallel, t, compact),
      ),
    );
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const apart =
          Math.abs(boxes[a].x - boxes[b].x) >= LABEL.width * scale ||
          Math.abs(boxes[a].y - boxes[b].y) >= LABEL.height * scale;
        expect(apart).toBe(true);
      }
    }
  }

  it.each(Array.from({ length: 40 }, (_, i) => i + 1))(
    'shows the words of a %i-person desktop ring at its fit zoom without overlap',
    (count) => {
      expect(ring(count, 1, false).labels.wordsMinZoom).toBeLessThanOrEqual(desktopFitZoom(count));
      expectNoOverlap(count, 1, false);
    },
  );

  it.each([1, 3, 6, 10, 16])('keeps two links per neighbour apart too (%i neighbours)', (count) => {
    expectNoOverlap(count, 2, false);
  });

  it('hides the words of a crowded ring on a phone, where the fit zooms far out', () => {
    // A phone canvas is about 330px wide inside its padding.
    const { labels } = ring(13, 1, true);
    const radius = Math.max(200, 13 * 20);
    const phoneFitZoom = 330 / (2 * radius + 112);
    expect(labels.wordsMinZoom).toBeGreaterThan(phoneFitZoom);
    expectNoOverlap(13, 1, true);
  });

  it('keeps the words of a small ring on a phone', () => {
    const { labels } = ring(2, 1, true);
    const phoneFitZoom = 330 / (2 * 200 + 112);
    expect(labels.wordsMinZoom).toBeLessThanOrEqual(phoneFitZoom);
  });

  it('hides crowded neighbours’ names sooner than sparse ones', () => {
    expect(ring(13, 1, true).labels.namesMinZoom).toBeGreaterThan(ring(4, 1, true).labels.namesMinZoom);
  });
});

describe('mostConnectedPersonId', () => {
  it('picks whoever has the most relationships', () => {
    const data = makeGraph(4, [[0, 1], [1, 2], [1, 3]]);
    expect(mostConnectedPersonId(data)).toBe('person-1');
  });

  it('copes with nobody and with no relationships', () => {
    expect(mostConnectedPersonId(makeGraph(0, []))).toBeNull();
    expect(mostConnectedPersonId(makeGraph(2, []))).toBe('person-0');
  });
});
