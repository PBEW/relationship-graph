import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
  type EdgeMouseHandler,
  type FitViewOptions,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { Share2, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { QueryError } from "@/components/common/QueryError";
import { AvatarNode, type AvatarNodeType } from "@/components/graph/AvatarNode";
import { GraphPanel } from "@/components/graph/GraphPanel";
import { RelationshipDetailDialog } from "@/components/graph/RelationshipDetailDialog";
import { RelationshipEdge, type RelationshipEdgeType } from "@/components/graph/RelationshipEdge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraph } from "@/hooks/useGraph";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  computeForceLayout,
  computeRadialLayout,
  computeRingLabels,
  edgeLabelT,
  mostConnectedPersonId,
} from "@/lib/graphLayout";
import { readableTypeColor } from "@/lib/typeColor";
import { cn } from "@/lib/utils";
import type { GraphData } from "@/types";

const nodeTypes = { avatar: AvatarNode };
const edgeTypes = { relationship: RelationshipEdge };

/** Above this many people the whole graph is a hairball, so the page opens on one person's ring. */
const START_FOCUSED_ABOVE = 30;
/** Below this zoom, names at 14px would land on top of each other, so only hovered ones show. */
const FAR_ZOOM = 0.35;
/** On desktop a ring's fit stops here and a bigger ring pans; phones fit the whole ring and drop the words instead. */
const FOCUS_MIN_ZOOM = 0.5;
/** Below md the panel floats over the canvas and the ring is drawn tighter. */
const PHONE_QUERY = "(max-width: 767.98px)";

const MINIMAP_COLOR = (node: Node) =>
  node.data.focused ? "var(--primary)" : "var(--muted-foreground)";

const ARIA_LABELS = {
  "node.a11yDescription.default": "กด Enter หรือ Space เพื่อเลือกคนนี้",
  "node.a11yDescription.keyboardDisabled": "กด Enter หรือ Space เพื่อเลือกคนนี้ แล้วใช้ปุ่มลูกศรเพื่อย้าย",
  "node.a11yDescription.ariaLiveMessage": ({ x, y }: { x: number; y: number }) =>
    `ย้ายไปตำแหน่ง ${x}, ${y} แล้ว`,
  "edge.a11yDescription.default": "กด Enter หรือ Space เพื่อเลือกเส้นนี้",
  "controls.ariaLabel": "ปุ่มควบคุมแผนผัง",
  "controls.zoomIn.ariaLabel": "ซูมเข้า",
  "controls.zoomOut.ariaLabel": "ซูมออก",
  "controls.fitView.ariaLabel": "ดูให้พอดีจอ",
  "minimap.ariaLabel": "แผนที่ย่อ",
  "handle.ariaLabel": "จุดเชื่อมเส้น",
};

/** A ring link's position from computeRingLabels (measured from the centre) as RelationshipEdge wants it: from its source. */
function ringLabelT(fromCenter: number | undefined, sourceIsCenter: boolean): number {
  const t = fromCenter ?? 0.5;
  return sourceIsCenter ? t : 1 - t;
}

/** Stable key for a pair of people, regardless of which side is a or b. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function GraphCanvas({ data }: { data: GraphData }) {
  const { fitView } = useReactFlow();
  const store = useStoreApi();
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hiddenTypeIds, setHiddenTypeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Below md the panel starts as a slim bar so the ring is what people see
  // first; pressing it or tapping someone expands it.
  const [panelExpanded, setPanelExpanded] = useState(false);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // The URL is the only record of who is focused, so back and sharing just
  // work: ?person=<id> is one person's ring, ?view=all is everyone on purpose,
  // and neither means the starting view for a graph of this size.
  const urlPersonId = searchParams.get("person");
  const everyoneRequested = searchParams.get("view") === "all";
  const tooBigToStartWhole = data.nodes.length > START_FOCUSED_ABOVE;
  const startPersonId = useMemo(
    () => (tooBigToStartWhole ? mostConnectedPersonId(data) : null),
    [data, tooBigToStartWhole],
  );
  const focusedPersonId =
    urlPersonId && data.nodes.some((n) => n.id === urlPersonId)
      ? urlPersonId
      : everyoneRequested
        ? null
        : startPersonId;

  // Write the starting person into the URL too, so a later data refetch can't
  // change who is at the centre, and clean up an id that no longer exists.
  useEffect(() => {
    if (urlPersonId === focusedPersonId || (!urlPersonId && !focusedPersonId)) return;
    setSearchParams(
      focusedPersonId ? { person: focusedPersonId } : everyoneRequested ? { view: "all" } : {},
      { replace: true },
    );
  }, [urlPersonId, focusedPersonId, everyoneRequested, setSearchParams]);

  // Nodes/edges live in React-Flow-managed state (via useNodesState) rather
  // than being passed straight from a memo, specifically so dragging a node
  // persists: a memo would hand back the same layout position on every
  // unrelated re-render (hover, ...) and silently snap drags back.
  const [nodes, setNodes, onNodesChange] = useNodesState<AvatarNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdgeType>([]);

  const forcePositions = useMemo(() => computeForceLayout(data), [data]);

  // Edges left after the panel's type filters, and the view built from them.
  const { visibleEdges, visibleNodeIds, neighborIds } = useMemo(() => {
    const typeVisible = data.edges.filter((e) => !hiddenTypeIds.has(e.relationship_type.id));

    if (focusedPersonId) {
      const neighbors: string[] = [];
      const seen = new Set<string>();
      for (const edge of typeVisible) {
        const other: string | null =
          edge.source === focusedPersonId
            ? edge.target
            : edge.target === focusedPersonId
              ? edge.source
              : null;
        if (other && other !== focusedPersonId && !seen.has(other)) {
          seen.add(other);
          neighbors.push(other);
        }
      }
      const inView = new Set([focusedPersonId, ...neighbors]);
      return {
        // Links *between* the neighbours are kept too - with ~10 people on
        // screen they still read clearly, and they're the interesting part.
        visibleEdges: typeVisible.filter((e) => inView.has(e.source) && inView.has(e.target)),
        visibleNodeIds: inView,
        neighborIds: neighbors,
      };
    }

    const connected = new Set<string>();
    for (const edge of typeVisible) {
      connected.add(edge.source);
      connected.add(edge.target);
    }
    const hasAnyRelationship = new Set<string>();
    for (const edge of data.edges) {
      hasAnyRelationship.add(edge.source);
      hasAnyRelationship.add(edge.target);
    }
    // Keep genuinely unconnected people on screen, but drop the ones left
    // stranded purely because their relationship type is filtered out.
    const inView = new Set(
      data.nodes.filter((n) => connected.has(n.id) || !hasAnyRelationship.has(n.id)).map((n) => n.id),
    );
    return { visibleEdges: typeVisible, visibleNodeIds: inView, neighborIds: [] };
  }, [data, hiddenTypeIds, focusedPersonId]);

  const positions = useMemo(
    () => (focusedPersonId ? computeRadialLayout(focusedPersonId, neighborIds, isPhone) : forcePositions),
    [focusedPersonId, neighborIds, forcePositions, isPhone],
  );

  // Hover belongs to the whole-graph view; a ring already shows its words.
  const activeHoverId = focusedPersonId ? null : hoveredNodeId;

  const hoveredNeighborhood = useMemo(() => {
    if (!activeHoverId) return null;
    const neighborhood = new Set([activeHoverId]);
    for (const edge of visibleEdges) {
      if (edge.source === activeHoverId) neighborhood.add(edge.target);
      if (edge.target === activeHoverId) neighborhood.add(edge.source);
    }
    return neighborhood;
  }, [activeHoverId, visibleEdges]);

  const computedNodes: AvatarNodeType[] = useMemo(
    () =>
      data.nodes
        .filter((n) => visibleNodeIds.has(n.id))
        .map((n) => {
          const pos = positions.get(n.id);
          const inHoverNeighborhood = hoveredNeighborhood?.has(n.id) ?? false;
          return {
            id: n.id,
            type: "avatar",
            position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
            data: {
              personId: n.id,
              displayName: n.display_name,
              avatar: n.avatar,
              dimmed: !!hoveredNeighborhood && !inHoverNeighborhood,
              emphasized: inHoverNeighborhood,
              focused: n.id === focusedPersonId,
            },
          } satisfies AvatarNodeType;
        }),
    [data.nodes, positions, visibleNodeIds, hoveredNeighborhood, focusedPersonId],
  );

  const onSelectEdge = useCallback((edgeId: string) => setSelectedEdgeId(edgeId), []);

  // Where the words go on each line of the ring, and how far the view can zoom
  // out before they (or the neighbours' names) would collide.
  const ringLabels = useMemo(() => {
    if (!focusedPersonId) return null;
    const linkCounts = new Map<string, number>();
    for (const edge of visibleEdges) {
      const other =
        edge.source === focusedPersonId ? edge.target : edge.target === focusedPersonId ? edge.source : null;
      if (other) linkCounts.set(other, (linkCounts.get(other) ?? 0) + 1);
    }
    return computeRingLabels(focusedPersonId, neighborIds, linkCounts, isPhone);
  }, [focusedPersonId, neighborIds, visibleEdges, isPhone]);

  const computedEdges: RelationshipEdgeType[] = useMemo(() => {
    const seenPerPair = new Map<string, number>();
    return visibleEdges.map((e) => {
      const key = pairKey(e.source, e.target);
      const parallelIndex = seenPerPair.get(key) ?? 0;
      seenPerPair.set(key, parallelIndex + 1);

      const fromFocused = e.source === focusedPersonId;
      const inRing = fromFocused || e.target === focusedPersonId;
      const touchesHovered = e.source === activeHoverId || e.target === activeHoverId;
      return {
        id: e.id,
        type: "relationship",
        source: e.source,
        target: e.target,
        data: {
          label: e.relationship_type.name,
          color: readableTypeColor(e.relationship_type.color),
          status: e.status,
          dimmed: !!activeHoverId && !touchesHovered,
          emphasized: inRing || touchesHovered,
          faint: !!focusedPersonId && !inRing,
          parallelIndex,
          labelT: inRing
            ? ringLabelT(ringLabels?.ts.get(fromFocused ? e.target : e.source)?.[parallelIndex], fromFocused)
            : edgeLabelT(parallelIndex),
          onSelect: onSelectEdge,
        },
      } satisfies RelationshipEdgeType;
    });
  }, [visibleEdges, ringLabels, focusedPersonId, activeHoverId, onSelectEdge]);

  // A new layout means a new person at the centre or a different set of people
  // around them (a filter, or a relationship added from the panel): positions
  // must be replaced then, because a ring only spaces itself correctly as a
  // whole. Otherwise merge, to keep whatever the user has dragged.
  const layoutKey = focusedPersonId
    ? `${isPhone ? "compact" : "wide"}:${focusedPersonId}:${[...neighborIds].sort().join(",")}`
    : "__all__";
  const layoutKeyRef = useRef(layoutKey);

  useEffect(() => {
    const layoutChanged = layoutKeyRef.current !== layoutKey;
    layoutKeyRef.current = layoutKey;
    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const existing = currentById.get(n.id);
        if (!existing) return n;
        // Carrying `measured` over spares React Flow re-measuring every node
        // (and blanking its edges) each time a hover changes `data`.
        return layoutChanged ? { ...n, measured: existing.measured } : { ...existing, data: n.data };
      });
    });
  }, [computedNodes, layoutKey, setNodes]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  // Words on the canvas counter-scale through this variable so that they never
  // render under 14px when zoomed out, and step aside (data-zoom, data-words)
  // once that would make them collide. Written straight to the DOM because the
  // zoom changes every frame and no React state depends on it.
  const wordsMinZoom = ringLabels?.wordsMinZoom ?? 0;
  const namesMinZoom = Math.max(FAR_ZOOM, ringLabels?.namesMinZoom ?? 0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const apply = (zoom: number) => {
      canvas.style.setProperty("--graph-label-scale", String(Math.max(1, 1 / zoom)));
      canvas.dataset.zoom = zoom < namesMinZoom ? "far" : "near";
      canvas.dataset.words = zoom < wordsMinZoom ? "hidden" : "shown";
    };
    let lastZoom = store.getState().transform[2];
    apply(lastZoom);
    return store.subscribe((state) => {
      const zoom = state.transform[2];
      if (zoom !== lastZoom) {
        lastZoom = zoom;
        apply(zoom);
      }
    });
  }, [store, wordsMinZoom, namesMinZoom]);

  const fitOptions = useCallback((): FitViewOptions => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    if (!isPhone) {
      return {
        maxZoom: 1.1,
        minZoom: focusedPersonId ? FOCUS_MIN_ZOOM : 0.1,
        padding: { top: "8%", left: "6%", right: "6%", bottom: "8%" },
        duration,
      };
    }
    // The whole ring must show on a phone, so there's no floor beyond React
    // Flow's own; leave the floating buttons above and the panel below clear.
    const covered = panelRef.current?.offsetHeight ?? 0;
    return {
      maxZoom: 1.1,
      minZoom: 0.1,
      padding: { top: panelExpanded ? "60px" : "112px", left: "4%", right: "4%", bottom: `${covered + 16}px` },
      duration,
    };
  }, [focusedPersonId, isPhone, panelExpanded]);

  const fitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scheduleFit = useCallback(() => {
    clearTimeout(fitTimer.current);
    // Gather a layout change and the panel resize it causes into one fit.
    fitTimer.current = setTimeout(() => void fitView(fitOptions()), 80);
  }, [fitView, fitOptions]);

  // Re-frame whenever the layout changes, including first mount. React Flow
  // holds a queued fitView until any newly added nodes have been measured.
  useEffect(() => {
    scheduleFit();
    return () => clearTimeout(fitTimer.current);
  }, [layoutKey, scheduleFit]);

  // ...and whenever the space for it changes: a window resize, or the panel
  // opening, closing or changing height.
  useEffect(() => {
    const observer = new ResizeObserver(scheduleFit);
    if (canvasRef.current) observer.observe(canvasRef.current);
    if (panelRef.current) observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [scheduleFit]);

  const selectPerson = useCallback(
    (personId: string) => {
      setSearchParams({ person: personId }, { replace: true });
      setPanelExpanded(true);
    },
    [setSearchParams],
  );

  const clearFocus = useCallback(() => {
    setSearchParams(tooBigToStartWhole ? { view: "all" } : {}, { replace: true });
    setPanelExpanded(false);
  }, [setSearchParams, tooBigToStartWhole]);

  // Clicking anyone both centres the ring on them and opens their profile.
  const onNodeClick: NodeMouseHandler<AvatarNodeType> = useCallback(
    (_event, node) => selectPerson(node.id),
    [selectPerson],
  );

  const onEdgeClick: EdgeMouseHandler<RelationshipEdgeType> = useCallback(
    (_event, edge) => setSelectedEdgeId(edge.id),
    [],
  );

  const onNodeMouseEnter: NodeMouseHandler<AvatarNodeType> = useCallback((_event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const toggleType = useCallback((typeId: string) => {
    setHiddenTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }, []);

  const focusedPerson = focusedPersonId ? data.nodes.find((n) => n.id === focusedPersonId) : undefined;
  const focusedRelationshipCount = focusedPersonId
    ? data.edges.filter((e) => e.source === focusedPersonId || e.target === focusedPersonId).length
    : 0;

  const selectedEdge = selectedEdgeId ? (data.edges.find((e) => e.id === selectedEdgeId) ?? null) : null;
  const sourceNode = selectedEdge ? (data.nodes.find((n) => n.id === selectedEdge.source) ?? null) : null;
  const targetNode = selectedEdge ? (data.nodes.find((n) => n.id === selectedEdge.target) ?? null) : null;

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div ref={canvasRef} className="group/graph relative h-full min-w-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          ariaLabelConfig={ARIA_LABELS}
          // This is a view of the data: nothing on the canvas may edit it.
          nodesConnectable={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="var(--border)" />
          {/* Its built-in fit can't see the mobile panel, so ours follows and corrects it. */}
          <Controls position="top-right" showInteractive={false} onFitView={scheduleFit} />
          <MiniMap pannable zoomable nodeColor={MINIMAP_COLOR} nodeStrokeWidth={0} className="max-md:hidden!" />
          <Panel position="top-left" className="m-3! flex max-w-[70%] flex-col items-start gap-2">
            {focusedPersonId && (
              <Button size="sm" className="rounded-full shadow-soft" onClick={clearFocus}>
                <Users className="size-4" />
                ดูทุกคน
              </Button>
            )}
            <p
              className={cn(
                "rounded-full bg-card px-3 py-0.5 text-xs shadow-soft tabular-nums",
                panelExpanded && "max-md:hidden",
              )}
            >
              แสดง {visibleNodeIds.size} จาก {data.nodes.length} คน · {visibleEdges.length} ความสัมพันธ์
            </p>
          </Panel>
        </ReactFlow>
      </div>

      <GraphPanel
        ref={panelRef}
        people={data.nodes}
        focusedPersonId={focusedPersonId}
        focusedName={focusedPerson?.display_name ?? null}
        relationshipCount={focusedRelationshipCount}
        hiddenTypeIds={hiddenTypeIds}
        onToggleType={toggleType}
        onSelectPerson={selectPerson}
        expanded={panelExpanded}
        onExpandedChange={setPanelExpanded}
      />

      <RelationshipDetailDialog
        edge={selectedEdge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        onClose={() => setSelectedEdgeId(null)}
      />
    </div>
  );
}

export function GraphPage() {
  const { data, isLoading, isError, error, refetch } = useGraph();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Skeleton className="h-[80%] w-[90%] rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <QueryError title="โหลดแผนผังไม่สำเร็จ" error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={Share2}
          title="แผนผังยังว่างอยู่"
          description="เพิ่มคนและความสัมพันธ์ก่อน แล้วแผนผังจะขึ้นตรงนี้เอง"
          action={
            <Button asChild>
              <Link to="/people">ไปเพิ่มคน</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphCanvas data={data} />
    </ReactFlowProvider>
  );
}
