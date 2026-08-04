import { Link } from "react-router-dom";

import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-semibold">
              {isLoading ? <Skeleton className="h-9 w-16" /> : data?.total_people}
            </div>
            <div className="text-sm text-muted-foreground">Total People</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-semibold">
              {isLoading ? <Skeleton className="h-9 w-16" /> : data?.total_relationships}
            </div>
            <div className="text-sm text-muted-foreground">Total Relationships</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Connected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {data?.most_connected.map((p) => (
              <Link
                key={p.person_id}
                to={`/people/${p.person_id}`}
                className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-accent/50"
              >
                <span className="flex items-center gap-2">
                  <PersonAvatar avatar={p.avatar} displayName={p.display_name} className="size-8" />
                  {p.display_name}
                </span>
                <span className="text-muted-foreground">{p.relationship_count}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {data?.recently_added.map((p) => (
              <Link
                key={p.person_id}
                to={`/people/${p.person_id}`}
                className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent/50"
              >
                <PersonAvatar avatar={p.avatar} displayName={p.display_name} className="size-8" />
                {p.display_name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relationship Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {isLoading && <Skeleton className="h-8 w-full" />}
          {data?.relationship_distribution.map((d) => (
            <span
              key={d.name}
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: `${d.color}60`, color: d.color, backgroundColor: `${d.color}15` }}
            >
              {d.name}: {d.count}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
