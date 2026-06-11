import { describe, expect, it } from "vitest";

import { formatSalary, timeAgo } from "./opportunitiesFormat";

describe("opportunitiesFormat", () => {
  it("formats salary ranges", () => {
    expect(formatSalary(null, null)).toBe("Compensación a convenir");
    expect(formatSalary(1000, 2000)).toMatch(/\d/);
    expect(formatSalary(1000, null)).toMatch(/Desde/i);
    expect(formatSalary(null, 2000)).toMatch(/Hasta/i);
  });

  it("formats timeAgo for invalid dates", () => {
    expect(timeAgo("not-a-date")).toBe("Hace un momento");
  });
});
