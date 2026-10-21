import { describe, it, expect, vi } from "vitest";
import RestoreOptionGroup from "./restoreOptionGroup.use-case";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

const existing = { id: "group-1", name: "Invocaciones", description: [], ruleset: "system-1", deletedAt: null };

describe("RestoreOptionGroup", () => {
  it("restores when the user is the publisher", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(existing),
      restore: vi.fn().mockResolvedValue(undefined)
    } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    await new RestoreOptionGroup(optionGroupService, systemService).execute("group-1", "user-1");
    expect(optionGroupService.restore).toHaveBeenCalledWith("group-1");
  });

  it("throws 403 when the user is not the publisher", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(existing),
      restore: vi.fn()
    } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "other" })
    } as unknown as SystemService;

    await expect(
      new RestoreOptionGroup(optionGroupService, systemService).execute("group-1", "user-1")
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
  });
});
