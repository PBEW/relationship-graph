import { ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { TypeBadge } from "@/components/relationships/TypeBadge";
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
import { formatDateRange } from "@/lib/formatDate";
import { STATUS_LABELS } from "@/lib/relationshipLabels";
import type { GraphEdge, GraphNode } from "@/types";

function PersonLink({ person }: { person: GraphNode }) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors duration-200 hover:bg-muted"
    >
      <PersonAvatar avatar={person.avatar} displayName={person.display_name} className="size-14" />
      <span className="max-w-full truncate text-sm font-medium">{person.display_name}</span>
    </Link>
  );
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
  const period = edge && formatDateRange(edge.start_date, edge.end_date, edge.status);

  return (
    <Dialog open={!!edge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {edge && sourceNode && targetNode && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
                <TypeBadge name={edge.relationship_type.name} color={edge.relationship_type.color} className="text-sm" />
                <Badge variant="outline">{STATUS_LABELS[edge.status]}</Badge>
              </DialogTitle>
              <DialogDescription>
                {edge.relationship_type.description ??
                  `${sourceNode.display_name} กับ ${targetNode.display_name}`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2">
              <PersonLink person={sourceNode} />
              <ArrowLeftRight aria-label="กับ" className="size-5 shrink-0 text-muted-foreground" />
              <PersonLink person={targetNode} />
            </div>

            {period && <p className="text-center text-sm text-muted-foreground tabular-nums">{period}</p>}

            {edge.note && <p className="rounded-xl bg-muted p-3 text-sm">{edge.note}</p>}

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
