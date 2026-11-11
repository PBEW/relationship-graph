import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GraphPage } from "@/pages/GraphPage";
import type { GraphData } from "@/types";

const mocks = vi.hoisted(() => ({ graph: null as GraphData | null }));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/hooks/useGraph", () => ({
  useGraph: () => ({ data: mocks.graph, isLoading: false, isError: false }),
}));
vi.mock("@/hooks/useRelationshipTypes", () => ({ useRelationshipTypes: () => ({ data: [] }) }));
vi.mock("@/hooks/usePersonProfile", () => ({
  usePersonProfile: (id: string) => ({
    data: {
      person: { id, display_name: `โปรไฟล์ของ ${id}`, avatar: null },
      relationships: [],
      timeline: [],
    },
    isLoading: false,
    isError: false,
  }),
}));

function makeGraph(peopleCount: number): GraphData {
  const nodes = Array.from({ length: peopleCount }, (_, i) => ({
    id: `p${i}`,
    display_name: `คน ${i}`,
    nickname: null,
    avatar: null,
  }));
  // p2 knows the most people, so it is who a big graph opens on.
  const edges = ["p0", "p1", "p3"].map((other, i) => ({
    id: `e${i}`,
    source: "p2",
    target: other,
    status: "active" as const,
    start_date: null,
    end_date: null,
    note: null,
    relationship_type: { id: "t", name: "เพื่อน", color: "#06B6D4", icon: "users", description: null },
  }));
  return { nodes, edges };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="url">{location.search}</output>;
}

function renderAt(url: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[url]}>
        <GraphPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  // What React Flow and the page need from a browser that jsdom doesn't have.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "DOMMatrixReadOnly",
    class {
      m22 = 1;
    },
  );
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
});

beforeEach(() => {
  mocks.graph = makeGraph(40);
});

describe("GraphPage starting view", () => {
  it("opens a big graph on the most connected person and records them in the URL", async () => {
    renderAt("/graph");

    expect(screen.getByRole("heading", { name: "โปรไฟล์ของ p2" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent("?person=p2"));
  });

  it("opens a small graph on everyone, with the panel explaining what to do", () => {
    mocks.graph = makeGraph(30);
    renderAt("/graph");

    expect(screen.getByText("กดที่คนเพื่อดูว่าเขาเกี่ยวข้องกับใคร")).toBeInTheDocument();
    expect(screen.getByTestId("url")).toHaveTextContent("");
  });

  it("honours ?person= over the starting person", () => {
    renderAt("/graph?person=p7");
    expect(screen.getByRole("heading", { name: "โปรไฟล์ของ p7" })).toBeInTheDocument();
  });

  it("ignores a ?person= that no longer exists", async () => {
    mocks.graph = makeGraph(5);
    renderAt("/graph?person=gone");

    expect(screen.getByText("กดที่คนเพื่อดูว่าเขาเกี่ยวข้องกับใคร")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(""));
  });

  it("stays on everyone after leaving a ring, instead of snapping back to the start person", async () => {
    renderAt("/graph");

    await userEvent.click(screen.getByRole("button", { name: "ดูทุกคน" }));

    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent("?view=all"));
    expect(screen.getByText("กดที่คนเพื่อดูว่าเขาเกี่ยวข้องกับใคร")).toBeInTheDocument();
  });

  it("walks to someone found through the panel's search", async () => {
    mocks.graph = makeGraph(5);
    renderAt("/graph");

    await userEvent.type(screen.getByRole("textbox", { name: "ค้นหาชื่อคน..." }), "คน 4");
    await userEvent.click(screen.getByRole("button", { name: /คน 4/ }));

    expect(screen.getByRole("heading", { name: "โปรไฟล์ของ p4" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent("?person=p4"));
  });

  it("starts a phone on a slim bar that names the person and expands when pressed", async () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("max-width"),
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    renderAt("/graph?person=p2");

    // p2 has three relationships in the test graph.
    const expand = screen.getByRole("button", { name: "ดูความสัมพันธ์ 3" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("heading", { level: 1, name: /คน 2/ })).toBeInTheDocument();

    await userEvent.click(expand);

    expect(screen.getByRole("button", { name: "ย่อแผงนี้" })).toHaveAttribute("aria-expanded", "true");
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
  });
});
