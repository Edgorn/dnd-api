import { describe, it, expect, vi, beforeEach } from "vitest";
import FeatService from "./feat.service";
import IFeatRepository from "../repositories/IFeatRepository";
import AttributeService from "./attribute.service";
import { ValidationError } from "../errors/AppError";
import { AttributeApi } from "../types/attribute.types";
import { FeatApi, InputCreateFeat } from "../types/feat.types";

const strAttribute: AttributeApi = {
  id: "attr-str",
  ruleset: "system-1",
  name: "Strength",
  key: "str"
};

const createdFeat: FeatApi = {
  id: "feat-1",
  name: "Alert",
  description: [],
  summary: [],
  ruleset: "system-1",
  requirements: { attributeMode: "all", attributes: [] },
  deletedAt: null
};

const grapplerFeat: FeatApi = {
  id: "feat-2",
  name: "Grappler",
  description: [],
  summary: [],
  ruleset: "system-1",
  requirements: {
    attributeMode: "all",
    attributes: [{ key: "str", name: "Strength", min: 13 }]
  },
  deletedAt: null
};

describe("FeatService", () => {
  const mockFeatRepository = {
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn()
  };

  const mockAttributeService = {
    getBySystems: vi.fn()
  };

  let service: FeatService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FeatService(
      mockFeatRepository as unknown as IFeatRepository,
      mockAttributeService as unknown as AttributeService
    );
  });

  it("creates a feat without requirements without looking up attributes", async () => {
    mockFeatRepository.create.mockResolvedValue(createdFeat);
    const input: InputCreateFeat = { name: "Alert", ruleset: "system-1" };

    const result = await service.create(input);

    expect(mockAttributeService.getBySystems).not.toHaveBeenCalled();
    expect(mockFeatRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdFeat);
  });

  it("creates Grappler when the strength attribute exists", async () => {
    mockAttributeService.getBySystems.mockResolvedValue([strAttribute]);
    mockFeatRepository.create.mockResolvedValue(grapplerFeat);
    const input: InputCreateFeat = {
      name: "Grappler",
      ruleset: "system-1",
      requirements: {
        attributeMode: "all",
        attributes: [{ key: "str", min: 13 }]
      }
    };

    const result = await service.create(input);

    expect(mockAttributeService.getBySystems).toHaveBeenCalledWith(["system-1"]);
    expect(mockFeatRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(grapplerFeat);
  });

  it("throws 400 when an attribute key does not exist in the ruleset", async () => {
    mockAttributeService.getBySystems.mockResolvedValue([strAttribute]);
    const input: InputCreateFeat = {
      name: "Grappler",
      ruleset: "system-1",
      requirements: {
        attributeMode: "all",
        attributes: [{ key: "xyz", min: 13 }]
      }
    };

    await expect(service.create(input)).rejects.toSatisfy(
      (error: unknown) => error instanceof ValidationError && error.statusCode === 400
    );
    expect(mockFeatRepository.create).not.toHaveBeenCalled();
  });
});
