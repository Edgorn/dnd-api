import { describe, it, expect, vi, beforeEach } from "vitest";
import SubclassRepository from "./subclass.repository";
import SubclassModel from "../schemas/Subclass";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import SkillService from "../../../../domain/services/skill.service";

vi.mock("../schemas/Subclass", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}));

const SYSTEM_ID = "507f1f77bcf86cd799439011";
const CLASS_ID = "507f1f77bcf86cd799439013";
const SUBCLASS_ID = "507f1f77bcf86cd799439015";
const SPELL_ID = "507f1f77bcf86cd799439017";

describe("SubclassRepository light queries", () => {
  const traitRepository = {
    getTraitsByIndexes: vi.fn()
  } as unknown as ITraitRepository;
  const skillService = {
    formatSkillChoices: vi.fn()
  } as unknown as SkillService;
  const systemRepository = {
    getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID])
  } as unknown as ISystemRepository;
  const spellRepository = {
    getSpellsByIndexes: vi.fn()
  } as unknown as ISpellRepository;
  const proficiencyRepository = {
    getProficienciesByIndices: vi.fn().mockResolvedValue([]),
    formatProficiencyChoices: vi.fn().mockResolvedValue([])
  } as unknown as IProficiencyRepository;

  let repository: SubclassRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    systemRepository.getSystemsAndAncestors = vi.fn().mockResolvedValue([SYSTEM_ID]);
    proficiencyRepository.getProficienciesByIndices = vi.fn().mockResolvedValue([]);
    proficiencyRepository.formatProficiencyChoices = vi.fn().mockResolvedValue([]);
    repository = new SubclassRepository(
      systemRepository,
      traitRepository,
      skillService,
      spellRepository,
      proficiencyRepository
    );
  });

  it("getSummariesByClassAndSystems does not format levels or traits", async () => {
    const lean = vi.fn().mockResolvedValue([
      {
        _id: SUBCLASS_ID,
        name: "Evocación",
        img: "evo.png",
        description: ["Fuego"],
        ruleset: SYSTEM_ID,
        classId: CLASS_ID
      }
    ]);
    const sort = vi.fn().mockReturnValue({ lean });
    const collation = vi.fn().mockReturnValue({ sort });
    const select = vi.fn().mockReturnValue({ collation });
    vi.mocked(SubclassModel.find).mockReturnValue({ select } as never);

    const [summary] = await repository.getSummariesByClassAndSystems(CLASS_ID, [SYSTEM_ID]);

    expect(select).toHaveBeenCalledWith("_id name img description ruleset classId");
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(skillService.formatSkillChoices).not.toHaveBeenCalled();
    expect(summary).toEqual({
      id: SUBCLASS_ID,
      name: "Evocación",
      img: "evo.png",
      description: ["Fuego"],
      ruleset: SYSTEM_ID,
      classId: CLASS_ID
    });
  });

  it("getSummariesByIds selects only id, name and classId", async () => {
    const lean = vi.fn().mockResolvedValue([
      { _id: SUBCLASS_ID, name: "Campeón", classId: CLASS_ID, levels: [{ traits: ["trait-1"] }] }
    ]);
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(SubclassModel.find).mockReturnValue({ select } as never);

    const [summary] = await repository.getSummariesByIds([SUBCLASS_ID, "not-an-id"]);

    expect(select).toHaveBeenCalledWith("_id name classId");
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
    expect(summary).toEqual({
      id: SUBCLASS_ID,
      name: "Campeón",
      classId: CLASS_ID
    });
  });

  it("getRulesByIds returns trait ids per level without hydrating catalog", async () => {
    const lean = vi.fn().mockResolvedValue([
      {
        _id: SUBCLASS_ID,
        name: "Evocación",
        ruleset: SYSTEM_ID,
        classId: CLASS_ID,
        levels: [{ level: 2, traits: ["trait-1"], traits_data: { "trait-1": { X: "1" } } }],
        proficiencies: [SPELL_ID],
        proficiencies_choices: [{ choose: 1, options: [SPELL_ID] }],
        expandedSpells: [SPELL_ID]
      }
    ]);
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(SubclassModel.find).mockReturnValue({ select } as never);

    const [rules] = await repository.getRulesByIds([SUBCLASS_ID]);

    expect(select).toHaveBeenCalledWith("_id ruleset classId name levels proficiencies proficiencies_choices expandedSpells alwaysPreparedSpells optionReplacements");
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(skillService.formatSkillChoices).not.toHaveBeenCalled();
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
    expect(proficiencyRepository.getProficienciesByIndices).not.toHaveBeenCalled();
    expect(rules).toEqual({
      id: SUBCLASS_ID,
      ruleset: SYSTEM_ID,
      classId: CLASS_ID,
      name: "Evocación",
      levels: [{ level: 2, traits: ["trait-1"], traits_data: { "trait-1": { X: "1" } } }],
      proficiencies: [SPELL_ID],
      proficiencies_choices: [{ choose: 1, options: [SPELL_ID] }],
      expandedSpells: [SPELL_ID]
    });
  });

  it("getSummariesByIds returns empty without querying when there are no valid ids", async () => {
    const result = await repository.getSummariesByIds(["", "not-an-id"]);

    expect(SubclassModel.find).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("countByClassIds aggregates without formatting subclass levels", async () => {
    vi.mocked(SubclassModel.aggregate).mockResolvedValue([
      { _id: CLASS_ID, count: 4 }
    ] as never);

    const counts = await repository.countByClassIds([CLASS_ID], [SYSTEM_ID]);

    expect(SubclassModel.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          classId: { $in: [CLASS_ID] },
          ruleset: { $in: [SYSTEM_ID] },
          deletedAt: null
        }
      },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]);
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(counts.get(CLASS_ID)).toBe(4);
  });

  it("hydrates expandedSpells on getById", async () => {
    const spell = { id: SPELL_ID, name: "Manos ardientes", level: 1 };
    vi.mocked(spellRepository.getSpellsByIndexes).mockResolvedValue([spell] as never);
    vi.mocked(SubclassModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: SUBCLASS_ID,
        name: "El Infernal",
        img: "",
        description: [],
        ruleset: SYSTEM_ID,
        classId: CLASS_ID,
        levels: [],
        expandedSpells: [SPELL_ID]
      })
    } as never);

    const result = await repository.getById(SUBCLASS_ID);

    expect(spellRepository.getSpellsByIndexes).toHaveBeenCalledWith([SPELL_ID]);
    expect(result?.expandedSpells).toEqual([spell]);
  });

  it("unsets expandedSpells when update receives null", async () => {
    const lean = vi.fn().mockResolvedValue({
      _id: SUBCLASS_ID,
      name: "El Infernal",
      img: "",
      description: [],
      ruleset: SYSTEM_ID,
      classId: CLASS_ID,
      levels: []
    });
    vi.mocked(SubclassModel.findByIdAndUpdate).mockReturnValue({ lean } as never);

    await repository.update({ id: SUBCLASS_ID, expandedSpells: null });

    expect(SubclassModel.findByIdAndUpdate).toHaveBeenCalledWith(
      SUBCLASS_ID,
      { $unset: { expandedSpells: 1 } },
      { returnDocument: "after" }
    );
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });

  it("hydrates alwaysPreparedSpells on getById", async () => {
    const spell = { id: SPELL_ID, name: "Bendición", level: 1 };
    vi.mocked(spellRepository.getSpellsByIndexes).mockResolvedValue([spell] as never);
    vi.mocked(SubclassModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: SUBCLASS_ID,
        name: "Dominio de la Vida",
        img: "",
        description: [],
        ruleset: SYSTEM_ID,
        classId: CLASS_ID,
        levels: [],
        alwaysPreparedSpells: [{ atLevel: 1, spellIds: [SPELL_ID] }]
      })
    } as never);

    const result = await repository.getById(SUBCLASS_ID);

    expect(spellRepository.getSpellsByIndexes).toHaveBeenCalledWith([SPELL_ID]);
    expect(result?.alwaysPreparedSpells).toEqual([{ atLevel: 1, spells: [spell] }]);
  });

  it("hydrates proficiencies on getById", async () => {
    const proficiency = { id: SPELL_ID, name: "Herramientas de herrero" };
    vi.mocked(proficiencyRepository.getProficienciesByIndices).mockResolvedValue([proficiency] as never);
    vi.mocked(proficiencyRepository.formatProficiencyChoices).mockResolvedValue([
      { choose: 1, query_type: "options", options: [proficiency] }
    ] as never);
    vi.mocked(SubclassModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: SUBCLASS_ID,
        name: "Dominio de la Forja",
        img: "",
        description: [],
        ruleset: SYSTEM_ID,
        classId: CLASS_ID,
        levels: [],
        proficiencies: [SPELL_ID],
        proficiencies_choices: [{ choose: 1, options: [SPELL_ID] }]
      })
    } as never);

    const result = await repository.getById(SUBCLASS_ID);

    expect(proficiencyRepository.getProficienciesByIndices).toHaveBeenCalledWith([SPELL_ID]);
    expect(proficiencyRepository.formatProficiencyChoices).toHaveBeenCalledWith([
      { choose: 1, options: [SPELL_ID] }
    ]);
    expect(result?.proficiencies).toEqual([proficiency]);
    expect(result?.proficiencies_choices).toEqual([
      { choose: 1, query_type: "options", options: [proficiency] }
    ]);
  });

  it("clears proficiencies_choices when update receives null", async () => {
    const lean = vi.fn().mockResolvedValue({
      _id: SUBCLASS_ID,
      name: "Dominio de la Forja",
      img: "",
      description: [],
      ruleset: SYSTEM_ID,
      classId: CLASS_ID,
      levels: [],
      proficiencies: []
    });
    vi.mocked(SubclassModel.findByIdAndUpdate).mockReturnValue({ lean } as never);

    await repository.update({ id: SUBCLASS_ID, proficiencies_choices: null });

    expect(SubclassModel.findByIdAndUpdate).toHaveBeenCalledWith(
      SUBCLASS_ID,
      { $set: { proficiencies_choices: [] } },
      { returnDocument: "after" }
    );
    expect(proficiencyRepository.getProficienciesByIndices).toHaveBeenCalledWith([]);
  });

  it("unsets alwaysPreparedSpells when update receives null", async () => {
    const lean = vi.fn().mockResolvedValue({
      _id: SUBCLASS_ID,
      name: "Dominio de la Vida",
      img: "",
      description: [],
      ruleset: SYSTEM_ID,
      classId: CLASS_ID,
      levels: []
    });
    vi.mocked(SubclassModel.findByIdAndUpdate).mockReturnValue({ lean } as never);

    await repository.update({ id: SUBCLASS_ID, alwaysPreparedSpells: null });

    expect(SubclassModel.findByIdAndUpdate).toHaveBeenCalledWith(
      SUBCLASS_ID,
      { $unset: { alwaysPreparedSpells: 1 } },
      { returnDocument: "after" }
    );
    expect(spellRepository.getSpellsByIndexes).not.toHaveBeenCalled();
  });
});
