import { describe, expect, it } from "vitest";

import { readJson, removeItem, writeJson } from "./storage";

describe("storage", () => {
  it("writeJson and readJson work together", () => {
    writeJson("k1", { ok: true, count: 2 });
    expect(readJson<{ ok: boolean; count: number }>("k1")).toEqual({ ok: true, count: 2 });
  });

  it("readJson returns null when key does not exist", () => {
    expect(readJson("missing-key")).toBeNull();
  });

  it("readJson returns null for invalid json", () => {
    localStorage.setItem("bad", "{");
    expect(readJson("bad")).toBeNull();
  });

  it("removeItem deletes a key", () => {
    localStorage.setItem("k2", "value");
    removeItem("k2");
    expect(localStorage.getItem("k2")).toBeNull();
  });
});

