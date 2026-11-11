import { Plus, UserPlus, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { PersonFormDialog } from "@/components/admin/PersonFormDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { QueryError } from "@/components/common/QueryError";
import { SearchBar } from "@/components/common/SearchBar";
import { PersonCard } from "@/components/people/PersonCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { usePeople } from "@/hooks/usePeople";
import { GENDER_OPTIONS } from "@/lib/genderLabels";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

const ALL = "all";

export function PeoplePage() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<Gender | typeof ALL>(ALL);
  const [country, setCountry] = useState(ALL);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = usePeople({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
    gender: gender === ALL ? undefined : gender,
    country: country === ALL ? undefined : country,
  });

  // The API filters on an exact country but has no list of countries, so offer
  // the ones it reports. shortcut: only sees the first 100 people, add a
  // countries endpoint if the group outgrows that.
  const { data: everyone } = usePeople({ per_page: 100 });
  const countries = useMemo(
    () =>
      [...new Set(everyone?.items.map((p) => p.country).filter((c): c is string => !!c))].sort((a, b) =>
        a.localeCompare(b, "th"),
      ),
    [everyone],
  );

  const isFiltered = !!debouncedSearch || gender !== ALL || country !== ALL;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="คนทั้งหมด"
        description="ดูรายชื่อทุกคนในกลุ่ม กดที่ชื่อเพื่อดูว่าเขาเกี่ยวข้องกับใคร"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            เพิ่มคน
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="ค้นหาคน..."
          className="sm:flex-1"
        />
        <Select
          value={gender}
          onValueChange={(v) => {
            setGender(v as Gender | typeof ALL);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="กรองตามเพศ" className="w-full sm:w-40">
            <SelectValue placeholder="ทุกเพศ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกเพศ</SelectItem>
            {GENDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="กรองตามประเทศ" className="w-full sm:w-44">
            <SelectValue placeholder="ทุกประเทศ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกประเทศ</SelectItem>
            {countries.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={UsersRound}
            title="ไม่พบคนที่ตรงกับที่เลือกไว้"
            description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
          />
        ) : (
          <EmptyState
            icon={UsersRound}
            title="ยังไม่มีใครในนี้เลย"
            description="เพิ่มเพื่อนคนแรกของกลุ่มเข้ามาได้เลย"
            action={
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="size-4" />
                เพิ่มคนแรก
              </Button>
            }
          />
        )
      ) : (
        <div className={cn("grid gap-4 transition-opacity duration-200 sm:grid-cols-2", isPlaceholderData && "opacity-60")}>
          {data.items.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
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

      <PersonFormDialog open={addOpen} onOpenChange={setAddOpen} person={null} />
    </div>
  );
}
