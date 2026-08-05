import { Link } from "react-router-dom";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GraphEdge, GraphNode } from "@/types";

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface RelationshipDetailDialogProps {
  edge: GraphEdge | null;
  sourceNode: GraphNode | null;
  targetNode: GraphNode | null;
  onClose: () => void;
}

export function RelationshipDetailDialog({
  edge,
  sourceNode,
  targetNode,
  onClose,
}: RelationshipDetailDialogProps) {
  return (
    <Dialog open={!!edge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {edge && sourceNode && targetNode && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${edge.relationship_type.color}20`,
                    color: edge.relationship_type.color,
                    borderColor: `${edge.relationship_type.color}40`,
                  }}
                >
                  {edge.relationship_type.name}
                </Badge>
                {edge.status === "ended" && <Badge variant="secondary">เลิกกันแล้ว</Badge>}
              </DialogTitle>
              {edge.relationship_type.description && (
                <DialogDescription>{edge.relationship_type.description}</DialogDescription>
              )}
            </DialogHeader>

            <div className="flex items-center justify-center gap-4 py-2">
              <Link to={`/people/${sourceNode.id}`} className="flex flex-col items-center gap-1">
                <PersonAvatar avatar={sourceNode.avatar} displayName={sourceNode.display_name} className="size-12" />
                <span className="text-xs font-medium">{sourceNode.display_name}</span>
              </Link>
              <span className="text-muted-foreground">↔</span>
              <Link to={`/people/${targetNode.id}`} className="flex flex-col items-center gap-1">
                <PersonAvatar avatar={targetNode.avatar} displayName={targetNode.display_name} className="size-12" />
                <span className="text-xs font-medium">{targetNode.display_name}</span>
              </Link>
            </div>

            {(edge.start_date || edge.end_date) && (
              <p className="text-center text-sm text-muted-foreground">
                {formatDate(edge.start_date) ?? "?"} — {formatDate(edge.end_date) ?? "ปัจจุบัน"}
              </p>
            )}

            {edge.note && <p className="rounded-md bg-muted p-3 text-sm">{edge.note}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                ปิด
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
