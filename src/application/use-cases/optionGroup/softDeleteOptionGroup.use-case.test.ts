import { describe, it, expect, vi } from "vitest";
import SoftDeleteOptionGroup from "./softDeleteOptionGroup.use-case";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

const existing = { id: "group-1", name: "Invocaciones", description: [], ruleset: "system-1", deletedAt: null };

describe("SoftDeleteOptionGroup", () => {
  it("soft deletes when the user is the publisher", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(existing),
      softDelete: vi.fn().mockResolvedValue(undefined)
    } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    await new SoftDeleteOptionGroup(optionGroupService, systemService).execute("group-1", "user-1");
    expect(optionGroupService.softDelete).toHaveBeenCalledWith("group-1");
  });

  it("throws 404 when missing", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(null),
      softDelete: vi.fn()
    } as unknown as OptionGroupService;
    const useCase = new SoftDeleteOptionGroup(optionGroupService, { getById: vi.fn() } as unknown as SystemService);

    await expect(useCase.execute("group-1", "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });
});
