import { describe, it, expect } from "vitest";

describe("usePatients (placeholder)", () => {
  it("parses pageCount math", () => {
    const total = 95; const pageSize = 20;
    const pageCount = Math.ceil(total / pageSize);
    expect(pageCount).toBe(5);
  });
});