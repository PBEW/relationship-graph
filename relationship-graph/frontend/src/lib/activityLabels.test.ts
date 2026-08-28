import { describe, expect, it } from "vitest";

import {
  ACTION_FILTER_OPTIONS,
  activityBadgeVariant,
  describeActivity,
} from "@/lib/activityLabels";

describe("describeActivity", () => {
  it("joins the action to what it acted on", () => {
    expect(describeActivity("create", "person")).toBe("เพิ่มคน");
    expect(describeActivity("delete", "relationship")).toBe("ลบความสัมพันธ์");
    expect(describeActivity("update", "relationship_type")).toBe("แก้ไขประเภทความสัมพันธ์");
  });

  it("leaves sign-ins as just the action", () => {
    // "เข้าสู่ระบบ", not "เข้าสู่ระบบเซสชัน".
    expect(describeActivity("login", "session")).toBe("เข้าสู่ระบบ");
    expect(describeActivity("logout", "session")).toBe("ออกจากระบบ");
  });
});

describe("activityBadgeVariant", () => {
  it("marks deletions as destructive so they stand out", () => {
    expect(activityBadgeVariant("delete")).toBe("destructive");
  });

  it("gives the other actions their own quieter variants", () => {
    expect(activityBadgeVariant("create")).toBe("default");
    expect(activityBadgeVariant("update")).toBe("secondary");
    expect(activityBadgeVariant("login")).toBe("outline");
  });
});

describe("ACTION_FILTER_OPTIONS", () => {
  it("offers every action as a filter", () => {
    expect(ACTION_FILTER_OPTIONS.map((o) => o.value)).toEqual([
      "login",
      "logout",
      "create",
      "update",
      "delete",
    ]);
    expect(ACTION_FILTER_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
  });
});
