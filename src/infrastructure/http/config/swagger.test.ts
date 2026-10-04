import { describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  default: {
    writeFileSync: vi.fn()
  }
}));

describe("swagger generator CLI guard", () => {
  it("does not write openapi.json when the module is imported", async () => {
    const fs = await import("fs");
    await import("./swagger");
    expect(fs.default.writeFileSync).not.toHaveBeenCalled();
  });
});
