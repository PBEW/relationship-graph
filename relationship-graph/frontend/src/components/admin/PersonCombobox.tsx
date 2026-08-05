import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { getPersonProfile } from "@/api/people";
import { listPeople } from "@/api/people";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface PersonComboboxProps {
  value: string | undefined;
  onChange: (personId: string) => void;
  excludeId?: string;
  placeholder?: string;
}

export function PersonCombobox({ value, onChange, excludeId, placeholder = "เลือกคน..." }: PersonComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const { data, isLoading } = useQuery({
    queryKey: ["people", "combobox", debouncedSearch],
    queryFn: () => listPeople({ search: debouncedSearch || undefined, per_page: 20 }),
    enabled: open,
  });

  // Deliberately NOT ["person-profile", value] - that key is also used by
  // usePersonProfile, whose queryFn caches the *full* profile shape
  // ({ person, relationships, stats, timeline }). Sharing the key meant
  // whichever query populated the cache first "won", and on pages that also
  // call usePersonProfile for the same id (e.g. adding a relationship from
  // that person's own profile page), this query would silently receive the
  // full-profile shape instead of just the person - display_name would be
  // undefined and the trigger button rendered blank.
  const { data: selectedPerson } = useQuery({
    queryKey: ["person-combobox-selected", value],
    queryFn: () => getPersonProfile(value!).then((p) => p.person),
    enabled: !!value,
    staleTime: 60_000,
  });

  const people = (data?.items ?? []).filter((p) => p.id !== excludeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedPerson ? selectedPerson.display_name : placeholder}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="ค้นหาคน..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{isLoading ? "กำลังค้นหา..." : "ไม่พบข้อมูลคน"}</CommandEmpty>
            <CommandGroup>
              {people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={person.id}
                  onSelect={() => {
                    onChange(person.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", person.id === value ? "opacity-100" : "opacity-0")} />
                  {person.display_name}
                  {person.nickname && (
                    <span className="text-muted-foreground">"{person.nickname}"</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
