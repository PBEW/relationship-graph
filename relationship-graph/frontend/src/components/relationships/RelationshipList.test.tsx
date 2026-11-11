import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { RelationshipList } from "@/components/relationships/RelationshipList";
import type { Person, Relationship } from "@/types";

vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true }) }));

function person(id: string, display_name: string): Person {
  return {
    id,
    display_name,
    avatar: null,
    nickname: null,
    vrchat_name: null,
    discord: null,
    steam: null,
    twitter: null,
    country: null,
    gender: null,
    birthday: null,
    bio: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

const me = person("me", "ฉัน");

function relationship(id: string, other: Person, status: Relationship["status"], meIsA = true): Relationship {
  const [a, b] = meIsA ? [me, other] : [other, me];
  return {
    id,
    person_a_id: a.id,
    person_b_id: b.id,
    relationship_type_id: "type",
    status,
    start_date: "2024-03-12",
    end_date: null,
    note: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    person_a: a,
    person_b: b,
    relationship_type: { id: "type", name: "เพื่อน", color: "#06B6D4", icon: "users", description: null },
  };
}

function renderList(relationships: Relationship[], onSelectPerson?: (id: string) => void) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <RelationshipList personId="me" relationships={relationships} onSelectPerson={onSelectPerson} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RelationshipList", () => {
  it("splits relationships into now and ended, naming the other person", () => {
    renderList([
      relationship("1", person("ann", "แอน"), "active"),
      relationship("2", person("bo", "โบ"), "ended", false),
    ]);

    const now = screen.getByRole("heading", { name: "ตอนนี้" }).closest("section")!;
    const ended = screen.getByRole("heading", { name: "จบไปแล้ว" }).closest("section")!;
    expect(within(now).getByRole("link", { name: "แอน" })).toHaveAttribute("href", "/people/ann");
    expect(within(ended).getByRole("link", { name: "โบ" })).toHaveAttribute("href", "/people/bo");
    expect(within(now).queryByText("ฉัน")).not.toBeInTheDocument();
  });

  it("omits the ended section when nothing has ended", () => {
    renderList([relationship("1", person("ann", "แอน"), "active")]);
    expect(screen.queryByRole("heading", { name: "จบไปแล้ว" })).not.toBeInTheDocument();
  });

  it("walks to the person instead of linking when given onSelectPerson", async () => {
    const onSelectPerson = vi.fn();
    renderList([relationship("1", person("ann", "แอน"), "active")], onSelectPerson);

    await userEvent.click(screen.getByRole("button", { name: "แอน" }));

    expect(onSelectPerson).toHaveBeenCalledWith("ann");
  });

  it("teaches what to do when there are no relationships", () => {
    renderList([]);
    expect(screen.getByText("ยังไม่มีความสัมพันธ์")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เพิ่มความสัมพันธ์" })).toBeInTheDocument();
  });
});
