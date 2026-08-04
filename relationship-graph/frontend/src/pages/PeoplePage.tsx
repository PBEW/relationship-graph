import { UsersRound } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { Pager } from "@/components/common/Pager";
import { SearchBar } from "@/components/common/SearchBar";
import { PersonCard } from "@/components/people/PersonCard";
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
import type { Gender } from "@/types";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Unspecified" },
];

export function PeoplePage() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isPlaceholderData } = usePeople({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
    gender: gender === "all" ? undefined : gender,
  });

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">People</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            className="sm:max-w-sm"
          />
          <Select
            value={gender}
            onValueChange={(v) => {
              setGender(v as Gender | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No people found"
          description="Try a different search or filter."
        />
      ) : (
        <div
          className="grid gap-3 sm:grid-cols-2"
          style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
        >
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
    </div>
  );
}
