import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "@/api/client";
import {
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
  toThaiErrorMessage,
  UNKNOWN_ERROR_MESSAGE,
} from "@/lib/errorMessages";

const THAI = /[฀-๿]/;

function axiosErrorWith(status: number, error?: string) {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = {
    data: error ? { error } : {},
    status,
    statusText: "",
    headers: {},
    config,
  };
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, null, response);
}

describe("toThaiErrorMessage", () => {
  it.each([
    ["Invalid username or password", 401],
    ["This account has been disabled", 401],
    ["Too many attempts. Please wait a minute and try again.", 429],
    ["Super admin access required", 403],
    ["Cannot delete a relationship type that is currently in use", 409],
    ["Cannot remove the last active super admin", 409],
    ["Cannot delete the last active super admin", 409],
    [
      "These two already have an active relationship of this type. End the existing one first, or pick a different type.",
      409,
    ],
  ])("translates %s", (message, status) => {
    const thai = toThaiErrorMessage(message, status);
    expect(thai).toMatch(THAI);
    expect(thai).not.toBe(message);
  });

  it("keeps the value inside parameterised messages", () => {
    expect(toThaiErrorMessage("Username 'bob' is already taken", 409)).toContain('"bob"');
    expect(toThaiErrorMessage("Relationship type 'เพื่อน' already exists", 409)).toContain('"เพื่อน"');
  });

  it.each([401, 403, 404, 409, 422, 429])("falls back on status %i for unknown text", (status) => {
    const thai = toThaiErrorMessage("Some new English message", status);
    expect(thai).toMatch(THAI);
    expect(thai).not.toContain("English");
  });

  it("treats every 5xx as a server problem", () => {
    expect(toThaiErrorMessage("Bad Gateway", 502)).toBe(SERVER_ERROR_MESSAGE);
  });

  it("reports a missing response as a connection problem", () => {
    expect(toThaiErrorMessage(undefined, undefined)).toBe(NETWORK_ERROR_MESSAGE);
  });
});

describe("getApiErrorMessage", () => {
  it("translates what the API returned", () => {
    expect(getApiErrorMessage(axiosErrorWith(401, "Invalid username or password"))).toBe(
      "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
    );
  });

  it("never passes the axios message through", () => {
    expect(getApiErrorMessage(axiosErrorWith(418))).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it("gives network failures a Thai message", () => {
    expect(getApiErrorMessage(new AxiosError("Network Error"))).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("does not leak the text of non-API errors", () => {
    expect(getApiErrorMessage(new Error("No refresh token available"))).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getApiErrorMessage("boom")).toBe(UNKNOWN_ERROR_MESSAGE);
  });
});
