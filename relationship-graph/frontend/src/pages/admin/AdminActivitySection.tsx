import { History } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivity } from "@/hooks/useActivity";
import {
  ACTION_FILTER_OPTIONS,
  activityBadgeVariant,
  describeActivity,
} from "@/lib/activityLabels";
import type { ActivityAction } from "@/types";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminActivitySection() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActivityAction | "all">("all");

  const { data, isLoading } = useActivity({
    page,
    per_page: 20,
    action: actionFilter === "all" ? undefined : actionFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          บันทึกการเข้าสู่ระบบและการแก้ไขข้อมูลทั้งหมด เรียงจากล่าสุด
        </p>
        <Select
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value as ActivityAction | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="ทุกการกระทำ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกการกระทำ</SelectItem>
            {ACTION_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={History} title="ยังไม่มีประวัติการใช้งาน" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">เวลา</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>การกระทำ</TableHead>
                <TableHead className="hidden md:table-cell">รายการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.username}</span>
                    {!entry.user_exists && (
                      <span className="ml-1 text-xs text-muted-foreground">(ลบบัญชีแล้ว)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={activityBadgeVariant(entry.action)}>
                      {describeActivity(entry.action, entry.entity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground md:table-cell">
                    {entry.summary ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <Pager
          page={data.page}
          pages={data.pages}
          hasPrev={data.has_prev}
          hasNext={data.has_next}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
