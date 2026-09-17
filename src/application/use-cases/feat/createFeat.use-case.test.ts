import { describe, it, expect, vi } from "vitest";
import CreateFeat from "./createFeat.use-case";
import FeatService from "../../../domain/services/feat.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { FeatApi, InputCreateFeat } from "../../../domain/types/feat.types";

const input: InputCreateFeat = {
  name: "Alert",
  description: ["You cannot be surprised."],
  summary: ["Cannot be surprised"],
  ruleset: "system-1"
};

const createdFeat: FeatApi = {
  id: "feat-1",
  name: input.name,
  description: input.description ?? [],
  summary: input.summary ?? [],
  ruleset: input.ruleset,
  requirements: { attributeMode: "all", attributes: [] },
  deletedAt: null
};

describe("CreateFeat UseCase", () => {
  it("should create a feat when the user is the system publisher", async () => {
    const mockFeatService = {
      create: vi.fn().mockResolvedValue(createdFeat)
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    const useCase = new CreateFeat(mockFeatService, mockSystemService);
    const result = await useCase.execute(input, "user-1");

    expect(mockSystemService.getById).toHaveBeenCalledWith("system-1");
    expect(mockFeatService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdFeat);
  });

  it("should throw 404 when the system does not exist", async () => {
    const mockFeatService = {
      create: vi.fn()
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue(null)
    } as unknown as SystemService;

    const useCase = new CreateFeat(mockFeatService, mockSystemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    expect(mockFeatService.create).not.toHaveBeenCalled();
  });

  it("should throw 403 when the user is not the system publisher", async () => {
    const mockFeatService = {
      create: vi.fn()
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "other-user" })
    } as unknown as SystemService;

    const useCase = new CreateFeat(mockFeatService, mockSystemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(mockFeatService.create).not.toHaveBeenCalled();
  });
});
