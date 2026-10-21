import { describe, it, expect, vi } from "vitest";
import SoftDeleteGroupOption from "./softDeleteGroupOption.use-case";
import { AppError } from "../../../domain/errors/AppError";

describe("SoftDeleteGroupOption", () => {
  it("soft deletes when the user is the publisher", async () => {
    const groupOptionService = {
      getById: vi.fn().mockResolvedValue({ id: "opt-1", ruleset: "system-1" }),
      softDelete: vi.fn()
    };
    const systemService = { getById: vi.fn().mockResolvedValue({ publisher: "user-1" }) };
    await new SoftDeleteGroupOption(groupOptionService as never, systemService as never).execute("opt-1", "user-1");
    expect(groupOptionService.softDelete).toHaveBeenCalledWith("opt-1");
  });

  it("throws 404 when missing", async () => {
    const useCase = new SoftDeleteGroupOption(
      { getById: vi.fn().mockResolvedValue(null), softDelete: vi.fn() } as never,
      { getById: vi.fn() } as never
    );
    await expect(useCase.execute("opt-1", "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });
});
