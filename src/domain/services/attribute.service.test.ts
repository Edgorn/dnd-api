import { describe, it, expect, vi, beforeEach } from "vitest";
import AttributeService from "./attribute.service";
import IAttributeRepository from "../repositories/IAttributeRepository";
import { AttributeApi } from "../types/attribute.types";

const chaAttribute: AttributeApi = {
  id: "507f1f77bcf86cd799439011",
  ruleset: "5e",
  name: "Carisma",
  key: "cha",
  abbreviation: "Car"
};

const intAttribute: AttributeApi = {
  id: "507f1f77bcf86cd799439012",
  ruleset: "5e",
  name: "Inteligencia",
  key: "int",
  abbreviation: "Int"
};

describe("AttributeService.formatSpellcastingAttribute", () => {
  const mockRepository: IAttributeRepository = {
    create: vi.fn(),
    update: vi.fn(),
    getBySystems: vi.fn(),
    getById: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    softDeleteByRuleset: vi.fn(),
    restoreByRuleset: vi.fn()
  };

  let service: AttributeService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.getById).mockResolvedValue(chaAttribute);
    vi.mocked(mockRepository.getBySystems).mockResolvedValue([chaAttribute, intAttribute]);
    service = new AttributeService(mockRepository);
  });

  it("returns undefined for empty spellcasting", async () => {
    await expect(service.formatSpellcastingAttribute(null, "5e")).resolves.toBeUndefined();
    await expect(service.formatSpellcastingAttribute(undefined, "5e")).resolves.toBeUndefined();
    await expect(service.formatSpellcastingAttribute("", "5e")).resolves.toBeUndefined();
    expect(mockRepository.getById).not.toHaveBeenCalled();
  });

  it("resolves a valid ObjectId via getById", async () => {
    const result = await service.formatSpellcastingAttribute("507f1f77bcf86cd799439011", "5e");

    expect(mockRepository.getById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(result).toEqual(chaAttribute);
    expect(mockRepository.getBySystems).not.toHaveBeenCalled();
  });

  it("resolves by key when the value is not an ObjectId", async () => {
    const result = await service.formatSpellcastingAttribute("cha", "5e");

    expect(mockRepository.getById).not.toHaveBeenCalled();
    expect(mockRepository.getBySystems).toHaveBeenCalledWith(["5e"]);
    expect(result).toEqual(chaAttribute);
  });

  it("falls back to key lookup when the ObjectId is not found", async () => {
    vi.mocked(mockRepository.getById).mockResolvedValue(null);
    vi.mocked(mockRepository.getBySystems).mockResolvedValue([
      { ...chaAttribute, key: "507f1f77bcf86cd799439099" }
    ]);

    const result = await service.formatSpellcastingAttribute("507f1f77bcf86cd799439099", "5e");

    expect(mockRepository.getById).toHaveBeenCalledWith("507f1f77bcf86cd799439099");
    expect(mockRepository.getBySystems).toHaveBeenCalledWith(["5e"]);
    expect(result?.key).toBe("507f1f77bcf86cd799439099");
  });
});
