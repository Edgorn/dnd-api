import { describe, it, expect, vi } from "vitest";
import RestoreGroupOption from "./restoreGroupOption.use-case";

describe("RestoreGroupOption", () => {
  it("restores when the user is the publisher", async () => {
    const groupOptionService = {
      getById: vi.fn().mockResolvedValue({ id: "opt-1", ruleset: "system-1" }),
      restore: vi.fn()
    };
    const systemService = { getById: vi.fn().mockResolvedValue({ publisher: "user-1" }) };
    await new RestoreGroupOption(groupOptionService as never, systemService as never).execute("opt-1", "user-1");
    expect(groupOptionService.restore).toHaveBeenCalledWith("opt-1");
  });
});
