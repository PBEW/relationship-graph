import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import { SLOW_REQUEST_EVENT } from "@/api/client";
import { ServerWakingBanner } from "@/components/common/ServerWakingBanner";

function emitSlow(isSlow: boolean) {
  act(() => {
    window.dispatchEvent(new CustomEvent<boolean>(SLOW_REQUEST_EVENT, { detail: isSlow }));
  });
}

describe("ServerWakingBanner", () => {
  it("stays hidden while requests are quick", () => {
    render(<ServerWakingBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("appears once a request is reported as slow", () => {
    render(<ServerWakingBanner />);
    emitSlow(true);
    expect(screen.getByRole("status")).toHaveTextContent("กำลังปลุกเซิร์ฟเวอร์");
  });

  it("disappears again when requests finish", () => {
    render(<ServerWakingBanner />);
    emitSlow(true);
    expect(screen.getByRole("status")).toBeInTheDocument();

    emitSlow(false);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
