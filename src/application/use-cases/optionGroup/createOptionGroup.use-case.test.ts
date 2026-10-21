import { describe, it, expect, vi } from "vitest";
import CreateOptionGroup from "./createOptionGroup.use-case";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputCreateOptionGroup, OptionGroupApi } from "../../../domain/types/optionGroup.types";

const input: InputCreateOptionGroup = {
  name: "Invocaciones sobrenaturales",
  description: ["Capacidades mágicas permanentes."],
  ruleset: "system-1"
};

const created: OptionGroupApi = {
  id: "group-1",
  name: input.name,
  description: input.description ?? [],
  ruleset: input.ruleset,
  deletedAt: null
};

describe("CreateOptionGroup", () => {
  it("creates a group when the user is the system publisher", async () => {
    const optionGroupService = { create: vi.fn().mockResolvedValue(created) } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    const useCase = new CreateOptionGroup(optionGroupService, systemService);
    const result = await useCase.execute(input, "user-1");

    expect(optionGroupService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it("throws 404 when the system does not exist", async () => {
    const optionGroupService = { create: vi.fn() } as unknown as OptionGroupService;
    const systemService = { getById: vi.fn().mockResolvedValue(null) } as unknown as SystemService;
    const useCase = new CreateOptionGroup(optionGroupService, systemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it("throws 403 when the user is not the publisher", async () => {
    const optionGroupService = { create: vi.fn() } as unknown as OptionGroupService;
    const systemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "other" })
    } as unknown as SystemService;
    const useCase = new CreateOptionGroup(optionGroupService, systemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
  });
});
