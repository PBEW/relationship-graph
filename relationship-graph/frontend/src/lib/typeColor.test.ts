import { describe, expect, it } from "vitest";

import { readableTypeColor } from "@/lib/typeColor";

describe("readableTypeColor", () => {
  it("swaps near-black colours for the foreground", () => {
    expect(readableTypeColor("#171717")).toBe("var(--foreground)");
    expect(readableTypeColor("#000000")).toBe("var(--foreground)");
  });

  it("keeps colours that show on both themes", () => {
    expect(readableTypeColor("#06B6D4")).toBe("#06B6D4");
    expect(readableTypeColor("#FACC15")).toBe("#FACC15");
  });

  it("leaves anything that is not a hex colour alone", () => {
    expect(readableTypeColor("tomato")).toBe("tomato");
  });
});
