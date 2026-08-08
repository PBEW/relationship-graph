import { describe, expect, it } from "vitest";

import { resolveAvatarUrl } from "@/lib/avatarUrl";

const pageOrigin = window.location.origin;

describe("resolveAvatarUrl", () => {
  it("returns nothing when the person has no avatar", () => {
    expect(resolveAvatarUrl(null)).toBeUndefined();
    expect(resolveAvatarUrl(undefined)).toBeUndefined();
    expect(resolveAvatarUrl("")).toBeUndefined();
  });

  it("points a root-relative path at the API host, not the page it's rendered on", () => {
    expect(resolveAvatarUrl("/api/avatars/abc", "https://api.example.com/api")).toBe(
      "https://api.example.com/api/avatars/abc",
    );
  });

  it("falls back to the page origin when the API is same-origin", () => {
    expect(resolveAvatarUrl("/api/avatars/abc", "/api")).toBe(`${pageOrigin}/api/avatars/abc`);
  });

  it("leaves externally hosted pictures alone", () => {
    const external = "https://cdn.example.com/face.png";
    expect(resolveAvatarUrl(external, "https://api.example.com/api")).toBe(external);
    expect(resolveAvatarUrl("data:image/png;base64,AAA", "/api")).toBe(
      "data:image/png;base64,AAA",
    );
  });

  it("leaves anything that isn't a path alone", () => {
    expect(resolveAvatarUrl("face.png", "https://api.example.com/api")).toBe("face.png");
  });

  it("degrades to the raw value rather than throwing on a nonsense base", () => {
    expect(resolveAvatarUrl("/api/avatars/abc", "http://[")).toBe("/api/avatars/abc");
  });
});
