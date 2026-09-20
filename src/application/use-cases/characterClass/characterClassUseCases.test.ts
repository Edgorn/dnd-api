import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCharacterClass from "./createCharacterClass.use-case";
import UpdateCharacterClass from "./updateCharacterClass.use-case";
import { AppError } from "../../../domain/errors/AppError";

describe("CharacterClass Use Cases", () => {
  let characterClassServiceMock: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let systemServiceMock: {
    getById: ReturnType<typeof vi.fn>;
  };

  const createdClass = {
    id: "class1",
    ruleset: "sys1",
    name: "Guerrero",
    description: [],
    img: "",
    hit_die: 10,
    proficiencies: [],
    saving_throws: [],
    equipment: [],
    traits: [],
    traits_data: {},
    prof_bonus: 2
  };

  beforeEach(() => {
    characterClassServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn()
    };
    systemServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateCharacterClass", () => {
    it("should create class with god flag when deity selection is required", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue({ ...createdClass, name: "Clerigo", god: true });

      const input = {
        ruleset: "sys1",
        name: "Clerigo",
        hit_die: 8,
        god: true
      };

      const result = await useCase.execute(input, "user1");

      expect(result.god).toBe(true);
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create class with hit die, proficiencies, saving throws, skills and equipment", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue(createdClass);

      const input = {
        ruleset: "sys1",
        name: "Guerrero",
        hit_die: 10,
        proficiencies: ["prof1"],
        saving_throws: ["str", "con"],
        skill_choices: { choose: 2, options: ["skill1", "skill2"] },
        equipment: [{ id: "507f1f77bcf86cd799439011", quantity: 1 }],
        equipment_choices: [{ choose: 1, options: ["507f1f77bcf86cd799439012"] }]
      };

      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(createdClass);
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create class with spellcasting attribute, formulas and spell slot levels", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue({
        ...createdClass,
        name: "Mago",
        spellSaveDcFormula: "8 + @proficiencyBonus + @spellcasting.modifier",
        spellAttackBonusFormula: "@proficiencyBonus + @spellcasting.modifier",
        levels: [{ level: 1, spellcasting: { cantrips: 3, slots: { "1": 2 } } }]
      });

      const input = {
        ruleset: "sys1",
        name: "Mago",
        hit_die: 6,
        spellcasting: "507f1f77bcf86cd799439011",
        spellSaveDcFormula: "8 + @proficiencyBonus + @spellcasting.modifier",
        spellAttackBonusFormula: "@proficiencyBonus + @spellcasting.modifier",
        spellRepository: {
          name: "Libro de conjuros",
          equipmentId: "507f1f77bcf86cd799439011",
          includesCantrips: false,
          copy: {
            hoursPerSpellLevel: 2,
            costPerSpellLevel: { quantity: 50, unit: "507f1f77bcf86cd799439011" }
          },
          duplicate: {
            hoursPerSpellLevel: 1,
            costPerSpellLevel: { quantity: 10, unit: "507f1f77bcf86cd799439011" }
          },
          recoverPreparedOnLoss: true
        },
        levels: [
          {
            level: 1,
            spellcasting: { cantrips: 3, slots: { "1": 2 } },
            spell_choices: [{ choose: 1, filter: { level: [1, 2, 3, 4] } }],
            traits: ["507f1f77bcf86cd799439012"]
          },
          { level: 2, spellcasting: { cantrips: 3, slots: { "1": 3 } } }
        ]
      };

      const result = await useCase.execute(input, "user1");

      expect(result.name).toBe("Mago");
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create class with nested equipment alternatives (item vs subcategory filter)", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue({ ...createdClass, name: "Mago" });

      const input = {
        ruleset: "sys1",
        name: "Mago",
        hit_die: 6,
        equipment_choices: [
          {
            choose: 1,
            alternatives: [
              { type: "item" as const, id: "507f1f77bcf86cd799439011", quantity: 1 },
              {
                type: "choice" as const,
                choose: 1,
                filter: { subcategory: "canalizador arcano" }
              }
            ]
          }
        ]
      };

      const result = await useCase.execute(input, "user1");

      expect(result.name).toBe("Mago");
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create class with equipment bundle alternatives (martial+shield vs two martial)", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue(createdClass);

      const input = {
        ruleset: "sys1",
        name: "Guerrero",
        hit_die: 10,
        equipment_choices: [
          {
            choose: 1,
            alternatives: [
              {
                type: "bundle" as const,
                items: [
                  { type: "choice" as const, choose: 1, filter: { "weapon.category": "Martial" } },
                  { type: "item" as const, id: "507f1f77bcf86cd799439011", quantity: 1 }
                ]
              },
              { type: "choice" as const, choose: 2, filter: { "weapon.category": "Martial" } }
            ]
          }
        ]
      };

      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(createdClass);
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create class with filter-only equipment choice", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue(createdClass);

      const input = {
        ruleset: "sys1",
        name: "Guerrero",
        equipment_choices: [{ choose: 1, filter: { category: "Arma", "weapon.category": "Martial" } }]
      };

      await useCase.execute(input, "user1");
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should reject create when user is not the system publisher", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "other" });

      await expect(
        useCase.execute({ ruleset: "sys1", name: "Mago" }, "user1")
      ).rejects.toBeInstanceOf(AppError);
      expect(characterClassServiceMock.create).not.toHaveBeenCalled();
    });

    it("should create class with abilityScoreProgression override", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.create.mockResolvedValue({
        ...createdClass,
        abilityScoreProgression: [4, 6, 8, 12, 14, 16, 19]
      });

      const input = {
        ruleset: "sys1",
        name: "Guerrero",
        abilityScoreProgression: [4, 6, 8, 12, 14, 16, 19]
      };

      const result = await useCase.execute(input, "user1");

      expect(result.abilityScoreProgression).toEqual([4, 6, 8, 12, 14, 16, 19]);
      expect(characterClassServiceMock.create).toHaveBeenCalledWith(input);
    });
  });

  describe("UpdateCharacterClass", () => {
    it("should update class fields when user is the publisher", async () => {
      const useCase = new UpdateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      characterClassServiceMock.getById.mockResolvedValue({ ...createdClass, ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.update.mockResolvedValue({ ...createdClass, hit_die: 12 });

      const input = {
        id: "class1",
        hit_die: 12,
        saving_throws: ["dex"],
        equipment: null,
        spellcasting: "507f1f77bcf86cd799439011",
        spellSaveDcFormula: "8 + @proficiencyBonus + @spellcasting.modifier",
        levels: [{
          level: 1,
          spellcasting: { cantrips: 2, slots: { "1": 2 } },
          spell_choices: [{ choose: 2, filter: { level: [1, 2], classes: "Mago" } }]
        }]
      };

      const result = await useCase.execute(input, "user1");

      expect(result.hit_die).toBe(12);
      expect(characterClassServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should pass abilityScoreProgression null to clear the class override", async () => {
      const useCase = new UpdateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      characterClassServiceMock.getById.mockResolvedValue({ ...createdClass, ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      characterClassServiceMock.update.mockResolvedValue(createdClass);

      const input = {
        id: "class1",
        abilityScoreProgression: null
      };

      await useCase.execute(input, "user1");

      expect(characterClassServiceMock.update).toHaveBeenCalledWith(input);
    });
  });
});
