import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterClassService from "./characterClass.service";
import ICharacterClassRepository from "../repositories/ICharacterClassRepository";
import AttributeService from "./attribute.service";
import { ValidationError } from "../errors/AppError";
import { AttributeApi } from "../types/attribute.types";
import { CharacterClassApi, InputCreateCharacterClass } from "../types/characterClass.types";

const strAttribute: AttributeApi = {
  id: "attr-str",
  ruleset: "system-1",
  name: "Strength",
  key: "str"
};

const createdClass: CharacterClassApi = {
  id: "class-1",
  ruleset: "system-1",
  name: "Guerrero",
  description: [],
  img: "",
  hit_die: 10,
  proficiencies: [],
  saving_throws: [],
  traits: [],
  traits_data: {},
  prof_bonus: 2,
  god: false
};

describe("CharacterClassService", () => {
  const mockCharacterClassRepository = {
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn()
  };

  const mockAttributeService = {
    getBySystems: vi.fn()
  };

  let service: CharacterClassService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CharacterClassService(
      mockCharacterClassRepository as unknown as ICharacterClassRepository,
      mockAttributeService as unknown as AttributeService
    );
  });

  it("creates a class without multiclass requirements without looking up attributes", async () => {
    mockCharacterClassRepository.create.mockResolvedValue(createdClass);
    const input: InputCreateCharacterClass = { name: "Guerrero", ruleset: "system-1" };

    const result = await service.create(input);

    expect(mockAttributeService.getBySystems).not.toHaveBeenCalled();
    expect(mockCharacterClassRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdClass);
  });

  it("creates a class when the multiclass attribute key exists", async () => {
    mockAttributeService.getBySystems.mockResolvedValue([strAttribute]);
    mockCharacterClassRepository.create.mockResolvedValue(createdClass);
    const input: InputCreateCharacterClass = {
      name: "Guerrero",
      ruleset: "system-1",
      multiclass: {
        requirements: {
          attributeMode: "all",
          attributes: [{ key: "str", min: 13 }]
        }
      }
    };

    const result = await service.create(input);

    expect(mockAttributeService.getBySystems).toHaveBeenCalledWith(["system-1"]);
    expect(mockCharacterClassRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdClass);
  });

  it("throws 400 when a multiclass attribute key does not exist in the ruleset", async () => {
    mockAttributeService.getBySystems.mockResolvedValue([strAttribute]);
    const input: InputCreateCharacterClass = {
      name: "Guerrero",
      ruleset: "system-1",
      multiclass: {
        requirements: {
          attributeMode: "all",
          attributes: [{ key: "xyz", min: 13 }]
        }
      }
    };

    await expect(service.create(input)).rejects.toSatisfy(
      (error: unknown) => error instanceof ValidationError && error.statusCode === 400
    );
    expect(mockCharacterClassRepository.create).not.toHaveBeenCalled();
  });
});
