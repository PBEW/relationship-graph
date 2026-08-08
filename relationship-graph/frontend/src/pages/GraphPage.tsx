import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type EdgeMouseHandler,
  type NodeMouseHandler,
} from "@xyflow/react";
import { Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { AvatarNode, type AvatarNodeType } from "@/components/graph/AvatarNode";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { ProfileSheet } from "@/components/graph/ProfileSheet";
import { RelationshipDetailDialog } from "@/components/graph/RelationshipDetailDialog";
import { RelationshipEdge, type RelationshipEdgeType } from "@/components/graph/RelationshipEdge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useGraph } from "@/hooks/useGraph";
import { computeForceLayout, computeRadialLayout } from "@/lib/graphLayout";
import type { GraphData } from "@/types";

const nodeTypes = { avatar: AvatarNode };
const edgeTypes = { relationship: RelationshipEdge };

/** Stable key for a pair of people, regardless of which side is a or b. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function GraphCanvas({ data }: { data: GraphData }) {
  const { fitView } = useReactFlow();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [hiddenTypeIds, setHiddenTypeIds] = useState<Set<string>>(new Set());
  // The whole graph at once is an unreadable hairball at 100+ people, so
  // clicking someone narrows it to just them and their direct connections.
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Nodes/edges live in React-Flow-managed state (via useNodesState) rather
  // than being passed straight from a memo, specifically so dragging a node
  // persists: a memo would hand back the same layout position on every
  // unrelated re-render (search, hover, ...) and silently snap drags back.
  const [nodes, setNodes, onNodesChange] = useNodesState<AvatarNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdgeType>([]);

  const forcePositions = useMemo(() => computeForceLayout(data), [data]);

  // Edges left after the legend's type filters, and the view built from them.
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
    () => (focusedPersonId ? computeRadialLayout(focusedPersonId, neighborIds) : forcePositions),
    [focusedPersonId, neighborIds, forcePositions],
  );

  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of data.nodes) map.set(node.id, new Set());
    for (const edge of visibleEdges) {
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [data.nodes, visibleEdges]);

  const matchingNodeIds = useMemo(() => {
    if (!debouncedSearch.trim()) return null;
    const q = debouncedSearch.toLowerCase();
    return new Set(
      data.nodes
        .filter(
          (n) =>
            n.display_name.toLowerCase().includes(q) || n.nickname?.toLowerCase().includes(q),
        )
        .map((n) => n.id),
    );
  }, [data.nodes, debouncedSearch]);

  const hoveredNeighborhood = useMemo(() => {
    if (!hoveredNodeId) return null;
    return new Set([hoveredNodeId, ...(neighborMap.get(hoveredNodeId) ?? [])]);
  }, [hoveredNodeId, neighborMap]);

  const computedNodes: AvatarNodeType[] = useMemo(
    () =>
      data.nodes
        .filter((n) => visibleNodeIds.has(n.id))
        .map((n) => {
          const pos = positions.get(n.id);
          const highlighted = matchingNodeIds?.has(n.id) ?? false;
          const inHoverNeighborhood = hoveredNeighborhood?.has(n.id) ?? true;
          const dimmed = (matchingNodeIds ? !highlighted : false) || !inHoverNeighborhood;
          const emphasized = !!hoveredNeighborhood && inHoverNeighborhood && n.id !== hoveredNodeId;
          return {
            id: n.id,
            type: "avatar",
            position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
            data: {
              personId: n.id,
              displayName: n.display_name,
              avatar: n.avatar,
              dimmed,
              highlighted,
              emphasized,
              focused: n.id === focusedPersonId,
            },
          } satisfies AvatarNodeType;
        }),
    [data.nodes, positions, visibleNodeIds, matchingNodeIds, hoveredNeighborhood, hoveredNodeId, focusedPersonId],
  );

  const computedEdges: RelationshipEdgeType[] = useMemo(() => {
    const seenPerPair = new Map<string, number>();
    return visibleEdges.map((e) => {
      const key = pairKey(e.source, e.target);
      const parallelIndex = seenPerPair.get(key) ?? 0;
      seenPerPair.set(key, parallelIndex + 1);

      const matchesSearch = matchingNodeIds
        ? matchingNodeIds.has(e.source) && matchingNodeIds.has(e.target)
        : true;
      const touchesHovered = hoveredNodeId
        ? e.source === hoveredNodeId || e.target === hoveredNodeId
        : true;
      const dimmed = !matchesSearch || !touchesHovered;
      const emphasized = (!!hoveredNodeId && touchesHovered) || (!!matchingNodeIds && matchesSearch);
      return {
        id: e.id,
        type: "relationship",
        source: e.source,
        target: e.target,
        animated: e.status === "active" && !dimmed,
        data: {
          label: e.relationship_type.name,
          color: e.relationship_type.color,
          status: e.status,
          dimmed,
          emphasized,
          parallelIndex,
        },
      } satisfies RelationshipEdgeType;
    });
  }, [visibleEdges, matchingNodeIds, hoveredNodeId]);

  // Entering/leaving focus swaps the whole layout, so positions must be
  // replaced then; otherwise merge, to keep whatever the user has dragged.
  const layoutKey = focusedPersonId ?? "__all__";
  const layoutKeyRef = useRef(layoutKey);

  useEffect(() => {
    const layoutChanged = layoutKeyRef.current !== layoutKey;
    layoutKeyRef.current = layoutKey;
    setNodes((current) => {
      if (layoutChanged) return computedNodes;
      const currentById = new Map(current.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const existing = currentById.get(n.id);
        return existing ? { ...n, position: existing.position } : n;
      });
    });
  }, [computedNodes, layoutKey, setNodes]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  // Re-frame after a focus change, once the new layout has been committed.
  useEffect(() => {
    const timer = setTimeout(() => fitView({ duration: 400, padding: 0.25, maxZoom: 1.2 }), 60);
    return () => clearTimeout(timer);
  }, [focusedPersonId, fitView]);

  useEffect(() => {
    if (!matchingNodeIds || matchingNodeIds.size === 0) return;
    const ids = [...matchingNodeIds].filter((id) => visibleNodeIds.has(id));
    if (ids.length === 0) return;
    fitView({ nodes: ids.map((id) => ({ id })), duration: 400, padding: 0.3, maxZoom: 1.2 });
  }, [matchingNodeIds, visibleNodeIds, fitView]);

  const showPerson = useCallback((personId: string) => {
    setFocusedPersonId(personId);
    setSelectedPersonId(personId);
  }, []);

  // Clicking someone re-frames the graph around them but deliberately does
  // *not* open the profile panel - that would slide over the ring that was
  // just drawn. Clicking the person already at the centre opens it, as does
  // the toolbar's explicit button.
  const onNodeClick: NodeMouseHandler<AvatarNodeType> = useCallback(
    (_event, node) => {
      if (node.id === focusedPersonId) setSelectedPersonId(node.id);
      else setFocusedPersonId(node.id);
    },
    [focusedPersonId],
  );

  const onEdgeClick: EdgeMouseHandler<RelationshipEdgeType> = useCallback((_event, edge) => {
    setSelectedEdgeId(edge.id);
  }, []);

  const onNodeMouseEnter: NodeMouseHandler<AvatarNodeType> = useCallback((_event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Searching across the whole community only makes sense outside focus mode,
  // where most people are hidden - so typing drops back to the full graph.
  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (value.trim()) setFocusedPersonId(null);
  }, []);

  const toggleType = useCallback((typeId: string) => {
    setHiddenTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }, []);

  const focusedPerson = focusedPersonId
    ? (data.nodes.find((n) => n.id === focusedPersonId) ?? null)
    : null;

  const selectedEdge = selectedEdgeId ? (data.edges.find((e) => e.id === selectedEdgeId) ?? null) : null;
  const sourceNode = selectedEdge ? (data.nodes.find((n) => n.id === selectedEdge.source) ?? null) : null;
  const targetNode = selectedEdge ? (data.nodes.find((n) => n.id === selectedEdge.target) ?? null) : null;

  return (
    <div className="relative h-full w-full">
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
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap pannable zoomable nodeColor="var(--color-primary)" maskColor="rgba(0,0,0,0.15)" />
        <GraphToolbar
          search={search}
          onSearchChange={onSearchChange}
          matchCount={matchingNodeIds?.size ?? 0}
          hiddenTypeIds={hiddenTypeIds}
          onToggleType={toggleType}
          focusedPersonName={focusedPerson?.display_name ?? null}
          onClearFocus={() => setFocusedPersonId(null)}
          onOpenFocusedProfile={() => focusedPersonId && setSelectedPersonId(focusedPersonId)}
          visiblePeopleCount={visibleNodeIds.size}
          totalPeopleCount={data.nodes.length}
          visibleRelationshipCount={visibleEdges.length}
        />
      </ReactFlow>

      <ProfileSheet
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onSelectPerson={showPerson}
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
  const { data, isLoading, isError } = useGraph();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Skeleton className="h-[80%] w-[90%] rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={Share2} title="โหลดกราฟไม่สำเร็จ" description="ลองรีเฟรชหน้านี้อีกครั้ง" />
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={Share2} title="ยังไม่มีข้อมูลคน" description="เพิ่มคนเพื่อดูกราฟความสัมพันธ์" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphCanvas data={data} />
    </ReactFlowProvider>
  );
}
