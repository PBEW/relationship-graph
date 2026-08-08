import type { AxiosAdapter } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, SLOW_REQUEST_EVENT } from "@/api/client";

/** Collects every slow/not-slow announcement the client makes. */
function recordSlowEvents(): boolean[] {
  const events: boolean[] = [];
  window.addEventListener(SLOW_REQUEST_EVENT, (event) => {
    events.push((event as CustomEvent<boolean>).detail);
  });
  return events;
}

/** An adapter whose responses are resolved by hand, to hold requests open. */
function pendingAdapter() {
  const resolvers: ((value: unknown) => void)[] = [];
  const adapter: AxiosAdapter = (config) =>
    new Promise((resolve) => {
      resolvers.push(() =>
        resolve({ data: {}, status: 200, statusText: "OK", headers: {}, config }),
      );
    });
  return { adapter, resolveAll: () => resolvers.forEach((resolve) => resolve(undefined)) };
}

describe("apiClient slow-request tracking", () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    apiClient.defaults.adapter = originalAdapter;
  });

  it("says nothing about requests that finish quickly", async () => {
    const events = recordSlowEvents();
    const { adapter, resolveAll } = pendingAdapter();
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get("/quick");
    await vi.advanceTimersByTimeAsync(500);
    resolveAll();
    await request;

    expect(events).toEqual([false]);
  });

  it("announces a request still running after the slow threshold", async () => {
    const events = recordSlowEvents();
    const { adapter, resolveAll } = pendingAdapter();
    apiClient.defaults.adapter = adapter;

    const request = apiClient.get("/cold-start");
    await vi.advanceTimersByTimeAsync(3500);
    expect(events).toEqual([true]);

    resolveAll();
    await request;
    expect(events).toEqual([true, false]);
  });

  it("keeps the announcement up until the last request settles", async () => {
    const events = recordSlowEvents();
    const { adapter, resolveAll } = pendingAdapter();
    apiClient.defaults.adapter = adapter;

    const first = apiClient.get("/one");
    const second = apiClient.get("/two");
    await vi.advanceTimersByTimeAsync(3500);
    expect(events).toEqual([true]);

    resolveAll();
    await Promise.all([first, second]);

    // One "done" only, fired when the count reached zero - not one per request.
    expect(events).toEqual([true, false]);
  });
});
