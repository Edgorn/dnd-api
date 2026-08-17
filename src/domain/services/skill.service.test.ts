import { describe, it, expect, vi } from "vitest";
import SkillService from "./skill.service";
import ISkillRepository from "../repositories/ISkillRepository";
import { SkillApi } from "../types/skill.types";
import { CharacterAttributeApi } from "../types/attribute.types";

describe("SkillService", () => {
  const mockSkills: SkillApi[] = [
    {
      id: "skill-id-athletics",
      key: "athletics",
      name: "Atletismo",
      description: "Fuerza para trepar y saltar",
      ruleset: "5e",
      attributeScore: ["str"],
      bonusFormula: undefined,
      deletedAt: null
    },
    {
      id: "skill-id-stealth",
      key: "stealth",
      name: "Sigilo",
      description: "Destreza para ocultarse",
      ruleset: "5e",
      attributeScore: ["dex"],
      bonusFormula: undefined,
      deletedAt: null
    },
    {
      id: "skill-id-arcana",
      key: "arcana",
      name: "Arcanos",
      description: "Conocimiento arcano",
      ruleset: "5e",
      attributeScore: ["int"],
      bonusFormula: undefined,
      deletedAt: null
    }
  ];

  const mockAttributes: CharacterAttributeApi[] = [
    {
      key: "str",
      name: "Fuerza",
      value: 16,
      modifier: 3,
      description: "Fuerza",
      ruleset: "5e",
      deletedAt: null
    },
    {
      key: "dex",
      name: "Destreza",
      value: 14,
      modifier: 2,
      description: "Destreza",
      ruleset: "5e",
      deletedAt: null
    },
    {
      key: "int",
      name: "Inteligencia",
      value: 10,
      modifier: 0,
      description: "Inteligencia",
      ruleset: "5e",
      deletedAt: null
    }
  ];

  const mockRepository: ISkillRepository = {
    create: vi.fn(),
    update: vi.fn(),
    getAll: vi.fn().mockResolvedValue(mockSkills),
    getBySystems: vi.fn(),
    getById: vi.fn(),
    getSkillsByIds: vi.fn(),
    getSkillsByKeys: vi.fn(),
    getSkillsByIndices: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    softDeleteByRuleset: vi.fn(),
    restoreByRuleset: vi.fn()
  };

  const service = new SkillService(mockRepository);

  it("should match skills correctly using IDs (new format)", async () => {
    const skills = await service.getCharacterSkills(
      ["skill-id-athletics"],
      [],
      mockAttributes,
      2,
      false
    );

    const athletics = skills.find(s => s.id === "skill-id-athletics");
    const stealth = skills.find(s => s.id === "skill-id-stealth");

    expect(athletics?.value).toBe(1);
    expect(athletics?.modifier).toBe(5); // 3 (str) + 1 * 2 (prof) = 5

    expect(stealth?.value).toBe(0);
    expect(stealth?.modifier).toBe(2); // 2 (dex) + 0 * 2 = 2
  });

  it("should match skills correctly using Keys (legacy format)", async () => {
    const skills = await service.getCharacterSkills(
      ["athletics"],
      [],
      mockAttributes,
      2,
      false
    );

    const athletics = skills.find(s => s.key === "athletics");
    expect(athletics?.value).toBe(1);
    expect(athletics?.modifier).toBe(5);
  });

  it("should handle double skills with IDs and Keys", async () => {
    const skills = await service.getCharacterSkills(
      [],
      ["skill-id-stealth"],
      mockAttributes,
      2,
      false
    );

    const stealth = skills.find(s => s.id === "skill-id-stealth");
    expect(stealth?.value).toBe(2);
    expect(stealth?.modifier).toBe(6); // 2 (dex) + 2 * 2 (prof) = 6
  });

  it("should apply jack of all trades (half proficiency) for non-proficient skills", async () => {
    const skills = await service.getCharacterSkills(
      ["skill-id-athletics"],
      [],
      mockAttributes,
      2,
      true
    );

    const athletics = skills.find(s => s.id === "skill-id-athletics");
    const stealth = skills.find(s => s.id === "skill-id-stealth");

    expect(athletics?.value).toBe(1);
    expect(athletics?.modifier).toBe(5);

    expect(stealth?.value).toBe(0.5);
    expect(stealth?.modifier).toBe(3); // 2 (dex) + 0.5 * 2 = 3
  });
});
