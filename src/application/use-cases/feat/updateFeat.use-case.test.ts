import { describe, it, expect, vi } from "vitest";
import UpdateFeat from "./updateFeat.use-case";
import FeatService from "../../../domain/services/feat.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { FeatApi, InputUpdateFeat } from "../../../domain/types/feat.types";

const existingFeat: FeatApi = {
  id: "feat-1",
  name: "Alert",
  description: ["You cannot be surprised."],
  summary: ["Cannot be surprised"],
  ruleset: "system-1",
  requirements: { attributeMode: "all", attributes: [] },
  deletedAt: null
};

const input: InputUpdateFeat = {
  id: "feat-1",
  name: "Alert updated"
};

describe("UpdateFeat UseCase", () => {
  it("should update a feat when the user is the system publisher", async () => {
    const updatedFeat = { ...existingFeat, name: "Alert updated" };
    const mockFeatService = {
      getById: vi.fn().mockResolvedValue(existingFeat),
      update: vi.fn().mockResolvedValue(updatedFeat)
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" })
    } as unknown as SystemService;

    const useCase = new UpdateFeat(mockFeatService, mockSystemService);
    const result = await useCase.execute(input, "user-1");

    expect(mockFeatService.getById).toHaveBeenCalledWith("feat-1");
    expect(mockFeatService.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(updatedFeat);
  });

  it("should throw 404 when the feat does not exist", async () => {
    const mockFeatService = {
      getById: vi.fn().mockResolvedValue(null),
      update: vi.fn()
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn()
    } as unknown as SystemService;

    const useCase = new UpdateFeat(mockFeatService, mockSystemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    expect(mockFeatService.update).not.toHaveBeenCalled();
  });

  it("should throw 404 when the associated system does not exist", async () => {
    const mockFeatService = {
      getById: vi.fn().mockResolvedValue(existingFeat),
      update: vi.fn()
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue(null)
    } as unknown as SystemService;

    const useCase = new UpdateFeat(mockFeatService, mockSystemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
    expect(mockFeatService.update).not.toHaveBeenCalled();
  });

  it("should throw 403 when the user is not the system publisher", async () => {
    const mockFeatService = {
      getById: vi.fn().mockResolvedValue(existingFeat),
      update: vi.fn()
    } as unknown as FeatService;
    const mockSystemService = {
      getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "other-user" })
    } as unknown as SystemService;

    const useCase = new UpdateFeat(mockFeatService, mockSystemService);

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(mockFeatService.update).not.toHaveBeenCalled();
  });
});
