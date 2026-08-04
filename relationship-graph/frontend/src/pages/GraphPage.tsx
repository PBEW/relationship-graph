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
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { AvatarNode, type AvatarNodeType } from "@/components/graph/AvatarNode";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { ProfileSheet } from "@/components/graph/ProfileSheet";
import { RelationshipDetailDialog } from "@/components/graph/RelationshipDetailDialog";
import { RelationshipEdge, type RelationshipEdgeType } from "@/components/graph/RelationshipEdge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useGraph } from "@/hooks/useGraph";
import { computeForceLayout } from "@/lib/graphLayout";
import type { GraphData } from "@/types";

const nodeTypes = { avatar: AvatarNode };
const edgeTypes = { relationship: RelationshipEdge };

function GraphCanvas({ data }: { data: GraphData }) {
  const { fitView } = useReactFlow();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Nodes/edges live in React-Flow-managed state (via useNodesState) rather
  // than being passed straight from a memo, specifically so dragging a node
  // persists: a memo would hand back the same force-layout position on every
  // unrelated re-render (search, hover, ...) and silently snap drags back.
  const [nodes, setNodes, onNodesChange] = useNodesState<AvatarNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdgeType>([]);

  const initialPositions = useMemo(() => computeForceLayout(data), [data]);

  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of data.nodes) map.set(node.id, new Set());
    for (const edge of data.edges) {
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [data]);

  const toggleCollapse = useCallback((personId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }, []);

  const { visibleEdgeIds, hiddenNodeIds, totalDegree } = useMemo(() => {
    const hiddenEdgeIdSet = new Set<string>();
    for (const edge of data.edges) {
      if (collapsedNodeIds.has(edge.source) || collapsedNodeIds.has(edge.target)) {
        hiddenEdgeIdSet.add(edge.id);
      }
    }

    const visibleDegree = new Map<string, number>();
    const degree = new Map<string, number>();
    for (const node of data.nodes) {
      visibleDegree.set(node.id, 0);
      degree.set(node.id, 0);
    }
    for (const edge of data.edges) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
      if (!hiddenEdgeIdSet.has(edge.id)) {
        visibleDegree.set(edge.source, (visibleDegree.get(edge.source) ?? 0) + 1);
        visibleDegree.set(edge.target, (visibleDegree.get(edge.target) ?? 0) + 1);
      }
    }

    const hidden = new Set<string>();
    for (const node of data.nodes) {
      if (collapsedNodeIds.has(node.id)) continue;
      const total = degree.get(node.id) ?? 0;
      const visible = visibleDegree.get(node.id) ?? 0;
      if (total > 0 && visible === 0) hidden.add(node.id);
    }

    return {
      visibleEdgeIds: new Set(data.edges.filter((e) => !hiddenEdgeIdSet.has(e.id)).map((e) => e.id)),
      hiddenNodeIds: hidden,
      totalDegree: degree,
    };
  }, [data, collapsedNodeIds]);

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
        .filter((n) => !hiddenNodeIds.has(n.id))
        .map((n) => {
          const pos = initialPositions.get(n.id);
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
              nickname: n.nickname,
              avatar: n.avatar,
              dimmed,
              highlighted,
              emphasized,
              collapsed: collapsedNodeIds.has(n.id),
              hasHiddenNeighbors: (totalDegree.get(n.id) ?? 0) > 0,
              onToggleCollapse: toggleCollapse,
            },
          } satisfies AvatarNodeType;
        }),
    [
      data.nodes,
      initialPositions,
      hiddenNodeIds,
      matchingNodeIds,
      hoveredNeighborhood,
      hoveredNodeId,
      collapsedNodeIds,
      totalDegree,
      toggleCollapse,
    ],
  );

  const computedEdges: RelationshipEdgeType[] = useMemo(
    () =>
      data.edges
        .filter((e) => visibleEdgeIds.has(e.id))
        .map((e) => {
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
            },
          } satisfies RelationshipEdgeType;
        }),
    [data.edges, visibleEdgeIds, matchingNodeIds, hoveredNodeId],
  );

  // Merge rather than replace: keep whatever position a node is currently
  // at (e.g. dragged by the user) and only seed brand-new nodes from the
  // force layout.
  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const existing = currentById.get(n.id);
        return existing ? { ...n, position: existing.position } : n;
      });
    });
  }, [computedNodes, setNodes]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  useEffect(() => {
    if (!matchingNodeIds || matchingNodeIds.size === 0) return;
    const ids = [...matchingNodeIds].filter((id) => !hiddenNodeIds.has(id));
    if (ids.length === 0) return;
    fitView({ nodes: ids.map((id) => ({ id })), duration: 400, padding: 0.3, maxZoom: 1.2 });
  }, [matchingNodeIds, hiddenNodeIds, fitView]);

  const onNodeClick: NodeMouseHandler<AvatarNodeType> = useCallback((_event, node) => {
    setSelectedPersonId(node.id);
  }, []);

  const onEdgeClick: EdgeMouseHandler<RelationshipEdgeType> = useCallback((_event, edge) => {
    setSelectedEdgeId(edge.id);
  }, []);

  const onNodeMouseEnter: NodeMouseHandler<AvatarNodeType> = useCallback((_event, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

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
        <GraphToolbar search={search} onSearchChange={setSearch} matchCount={matchingNodeIds?.size ?? 0} />
      </ReactFlow>

      <ProfileSheet
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onSelectPerson={setSelectedPersonId}
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
        <EmptyState icon={Share2} title="Couldn't load the graph" description="Try refreshing the page." />
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={Share2} title="No people yet" description="Add people to see the relationship graph." />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphCanvas data={data} />
    </ReactFlowProvider>
  );
}
