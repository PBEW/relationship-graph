import { Panel } from "@xyflow/react";

import { SearchBar } from "@/components/common/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";

interface GraphToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  matchCount: number;
}

export function GraphToolbar({ search, onSearchChange, matchCount }: GraphToolbarProps) {
  const { data: types } = useRelationshipTypes();

  return (
    <>
      <Panel position="top-left" className="!m-3">
        <Card className="w-64 gap-2 py-3">
          <CardContent className="space-y-1 px-3">
            <SearchBar value={search} onChange={onSearchChange} placeholder="ค้นหาในกราฟ..." />
            {search && (
              <p className="text-xs text-muted-foreground">
                พบ {matchCount} คน
              </p>
            )}
          </CardContent>
        </Card>
      </Panel>

      <Panel position="bottom-left" className="!m-3">
        <Card className="gap-2 py-3">
          <CardContent className="flex max-w-64 flex-wrap gap-2 px-3">
            {types?.map((t) => (
              <span key={t.id} className="flex items-center gap-1 text-xs">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </span>
            ))}
          </CardContent>
        </Card>
      </Panel>
    </>
  );
}
