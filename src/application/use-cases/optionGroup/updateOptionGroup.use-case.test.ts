import { describe, it, expect, vi } from "vitest";
import UpdateOptionGroup from "./updateOptionGroup.use-case";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { OptionGroupApi } from "../../../domain/types/optionGroup.types";

const existing: OptionGroupApi = {
  id: "group-1",
  name: "Invocaciones",
  description: [],
  ruleset: "system-1",
  deletedAt: null
};

describe("UpdateOptionGroup", () => {
  it("updates a group when the user is the publisher", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue({ ...existing, name: "Nuevo" })
    } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    const useCase = new UpdateOptionGroup(optionGroupService, systemService);
    const result = await useCase.execute({ id: "group-1", name: "Nuevo" }, "user-1");

    expect(result.name).toBe("Nuevo");
  });

  it("throws 404 when the group does not exist", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(null),
      update: vi.fn()
    } as unknown as OptionGroupService;
    const useCase = new UpdateOptionGroup(optionGroupService, { getById: vi.fn() } as unknown as SystemService);

    await expect(useCase.execute({ id: "group-1", name: "Nuevo" }, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it("throws 403 when the user is not the publisher", async () => {
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue(existing),
      update: vi.fn()
    } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "other" })
    } as unknown as SystemService;
    const useCase = new UpdateOptionGroup(optionGroupService, systemService);

    await expect(useCase.execute({ id: "group-1", name: "Nuevo" }, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
  });
});
