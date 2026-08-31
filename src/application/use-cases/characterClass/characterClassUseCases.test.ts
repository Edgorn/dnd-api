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

    it("should reject create when user is not the system publisher", async () => {
      const useCase = new CreateCharacterClass(characterClassServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "other" });

      await expect(
        useCase.execute({ ruleset: "sys1", name: "Mago" }, "user1")
      ).rejects.toBeInstanceOf(AppError);
      expect(characterClassServiceMock.create).not.toHaveBeenCalled();
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
        equipment: null
      };

      const result = await useCase.execute(input, "user1");

      expect(result.hit_die).toBe(12);
      expect(characterClassServiceMock.update).toHaveBeenCalledWith(input);
    });
  });
});
