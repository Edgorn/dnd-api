import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import RaceRepository from "./race.repository";
import RaceModel from "../schemas/Race";
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import SkillService from "../../../../domain/services/skill.service";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import IFeatRepository from "../../../../domain/repositories/IFeatRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import AttributeService from "../../../../domain/services/attribute.service";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import ICreatureTypeRepository from "../../../../domain/repositories/ICreatureTypeRepository";

vi.mock("../schemas/Race", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    aggregate: vi.fn(),
  },
}));

const PARENT_SYSTEM_ID = "507f1f77bcf86cd799439011";
const CHILD_SYSTEM_ID = "507f1f77bcf86cd799439012";
const ELF_ID = "507f1f77bcf86cd799439013";

function stubFormatDependencies() {
  return {
    languageRepository: {
      getByIds: vi.fn().mockResolvedValue([]),
      formatLanguageChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as ILanguageRepository,
    spellRepository: {
      formatSpellChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as ISpellRepository,
    skillService: {
      formatSkillChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as SkillService,
    proficiencyRepository: {
      formatProficiencyChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as IProficiencyRepository,
    featRepository: {
      formatFeatChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as IFeatRepository,
    traitRepository: {
      getTraitsByIndexes: vi.fn().mockResolvedValue([]),
    } as unknown as ITraitRepository,
    attributeService: {
      formatAbilityBonuses: vi.fn().mockResolvedValue([]),
      formatAbilityBonusChoices: vi.fn().mockResolvedValue(undefined),
      formatSpellcastingAttribute: vi.fn().mockResolvedValue(undefined),
    } as unknown as AttributeService,
    equipmentRepository: {
      getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([]),
    } as unknown as IEquipmentRepository,
  };
}

function mockRootRaceFind(races: unknown[]) {
  vi.mocked(RaceModel.find).mockReturnValueOnce({
    collation: vi.fn().mockReturnThis(),
    sort: vi.fn().mockResolvedValue(races),
  } as never);
}

describe("RaceRepository.getBySystem subrace ancestry filter", () => {
  const elfRace = {
    _id: ELF_ID,
    name: "Elf",
    ruleset: PARENT_SYSTEM_ID,
    parentId: null,
    deletedAt: null,
  };

  let systemRepository: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };
  let repository: RaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    const deps = stubFormatDependencies();
    systemRepository = {
      getSystemsAndAncestors: vi.fn(),
    };
    repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository,
      systemRepository as unknown as ISystemRepository
    );
  });

  it("filters nested subraces with the parent ancestry when listing the parent system", async () => {
    const parentExpanded = [PARENT_SYSTEM_ID];
    systemRepository.getSystemsAndAncestors.mockResolvedValue(parentExpanded);
    mockRootRaceFind([elfRace]);
    vi.mocked(RaceModel.find).mockResolvedValueOnce([]);

    await repository.getBySystem(PARENT_SYSTEM_ID);

    expect(RaceModel.find).toHaveBeenNthCalledWith(1, {
      ruleset: { $in: parentExpanded },
      parentId: null,
      deletedAt: null,
    });
    expect(RaceModel.find).toHaveBeenNthCalledWith(2, {
      parentId: ELF_ID,
      deletedAt: null,
      ruleset: { $in: parentExpanded },
    });
  });

  it("filters nested subraces with parent and child ids when listing the child system", async () => {
    const childExpanded = [CHILD_SYSTEM_ID, PARENT_SYSTEM_ID];
    systemRepository.getSystemsAndAncestors.mockResolvedValue(childExpanded);
    mockRootRaceFind([elfRace]);
    vi.mocked(RaceModel.find).mockResolvedValueOnce([]);

    await repository.getBySystem(CHILD_SYSTEM_ID);

    expect(RaceModel.find).toHaveBeenNthCalledWith(1, {
      ruleset: { $in: childExpanded },
      parentId: null,
      deletedAt: null,
    });
    expect(RaceModel.find).toHaveBeenNthCalledWith(2, {
      parentId: ELF_ID,
      deletedAt: null,
      ruleset: { $in: childExpanded },
    });
  });

  it("filters root races and subraces to playable documents when playable is true", async () => {
    const parentExpanded = [PARENT_SYSTEM_ID];
    systemRepository.getSystemsAndAncestors.mockResolvedValue(parentExpanded);
    mockRootRaceFind([elfRace]);
    vi.mocked(RaceModel.find).mockResolvedValueOnce([]);

    await repository.getBySystem(PARENT_SYSTEM_ID, true);

    expect(RaceModel.find).toHaveBeenNthCalledWith(1, {
      ruleset: { $in: parentExpanded },
      parentId: null,
      deletedAt: null,
      playable: { $ne: false },
    });
    expect(RaceModel.find).toHaveBeenNthCalledWith(2, {
      parentId: ELF_ID,
      deletedAt: null,
      ruleset: { $in: parentExpanded },
      playable: { $ne: false },
    });
  });
});

describe("RaceRepository.getRaceRefsByIds", () => {
  const childId = "507f1f77bcf86cd799439021";
  const parentId = "507f1f77bcf86cd799439022";
  const typeId = "507f1f77bcf86cd799439023";

  let repository: RaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    const deps = stubFormatDependencies();
    repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository
    );
  });

  it("inherits the creature type from the parent race", async () => {
    vi.mocked(RaceModel.find)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{
            _id: childId,
            name: "Trasgo",
            ruleset: PARENT_SYSTEM_ID,
            parentId,
            creatureTypeId: null,
          }]),
        }),
      } as never)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{
            _id: parentId,
            creatureTypeId: typeId,
            parentId: null,
          }]),
        }),
      } as never);

    const refs = await repository.getRaceRefsByIds([childId, "not-an-id"]);

    const query = vi.mocked(RaceModel.find).mock.calls[0][0] as {
      _id: { $in: Types.ObjectId[] };
      deletedAt: null;
    };
    expect(query.deletedAt).toBeNull();
    expect(query._id.$in).toHaveLength(1);
    expect(query._id.$in[0]).toBeInstanceOf(Types.ObjectId);
    expect(query._id.$in[0].toString()).toBe(childId);
    expect(refs).toEqual([{
      id: childId,
      name: "Trasgo",
      ruleset: PARENT_SYSTEM_ID,
      creatureTypeId: typeId,
    }]);
  });
});

describe("RaceRepository.getRaceRefsBySystems", () => {
  const childId = "507f1f77bcf86cd799439021";
  const parentId = "507f1f77bcf86cd799439022";
  const typeId = "507f1f77bcf86cd799439023";

  let repository: RaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    const deps = stubFormatDependencies();
    repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository
    );
  });

  it("returns non-playable races and inherits the creature type", async () => {
    vi.mocked(RaceModel.find)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{
            _id: childId,
            name: "Trasgo",
            ruleset: PARENT_SYSTEM_ID,
            parentId,
            creatureTypeId: null,
            playable: false,
          }]),
        }),
      } as never)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{
            _id: parentId,
            creatureTypeId: typeId,
            parentId: null,
          }]),
        }),
      } as never);

    const refs = await repository.getRaceRefsBySystems([PARENT_SYSTEM_ID, PARENT_SYSTEM_ID]);

    expect(RaceModel.find).toHaveBeenCalledWith({
      ruleset: { $in: [PARENT_SYSTEM_ID] },
      deletedAt: null,
    });
    expect(refs).toEqual([{
      id: childId,
      name: "Trasgo",
      ruleset: PARENT_SYSTEM_ID,
      creatureTypeId: typeId,
    }]);
  });

  it("does not query when there are no rulesets", async () => {
    const refs = await repository.getRaceRefsBySystems([]);

    expect(refs).toEqual([]);
    expect(RaceModel.find).not.toHaveBeenCalled();
  });
});

describe("RaceRepository.getLevelUpData", () => {
  const childId = "507f1f77bcf86cd799439021";
  const parentId = "507f1f77bcf86cd799439022";
  let repository: RaceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    const deps = stubFormatDependencies();
    repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository,
      { getSystemsAndAncestors: vi.fn() } as unknown as ISystemRepository
    );
  });

  function mockRace(doc: unknown) {
    vi.mocked(RaceModel.findOne).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(doc)
    } as never);
  }

  it("merges the parent row and lets the child overwrite token keys", async () => {
    mockRace({
      _id: childId,
      parentId: { toString: () => parentId },
      levels: [{ level: 6, traits_data: { breath: { "{dice}": "4d6" } } }]
    });
    mockRace({
      _id: parentId,
      parentId: null,
      levels: [{
        level: 6,
        traits: ["breath"],
        traits_data: { breath: { "{dice}": "3d6", "{area}": "cono" } }
      }]
    });

    const result = await repository.getLevelUpData(childId, 6);

    expect(result).toEqual({
      level: 6,
      traits_data: { breath: { "{dice}": "4d6", "{area}": "cono" } }
    });
  });

  it("ignores a legacy levels value that is not an array", async () => {
    mockRace({
      _id: childId,
      parentId: null,
      levels: { 6: { traits_data: {} } }
    });

    await expect(repository.getLevelUpData(childId, 6)).resolves.toBeUndefined();
  });
});

describe("RaceRepository.countRootRacesByRulesets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups root races by ruleset without hydrating documents", async () => {
    const deps = stubFormatDependencies();
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository
    );
    vi.mocked(RaceModel.aggregate).mockResolvedValue([
      { _id: PARENT_SYSTEM_ID, count: 2 },
      { _id: "SRD", count: 1 },
    ] as never);

    const result = await repository.countRootRacesByRulesets([PARENT_SYSTEM_ID, "SRD", PARENT_SYSTEM_ID]);

    expect(RaceModel.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          parentId: null,
          deletedAt: null,
          ruleset: { $in: [PARENT_SYSTEM_ID, "SRD"] },
        },
      },
      {
        $group: {
          _id: "$ruleset",
          count: { $sum: 1 },
        },
      },
    ]);
    expect(result.get(PARENT_SYSTEM_ID)).toBe(2);
    expect(result.get("SRD")).toBe(1);
  });

  it("skips Mongo when there are no rulesets", async () => {
    const deps = stubFormatDependencies();
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository
    );

    const result = await repository.countRootRacesByRulesets([]);

    expect(result.size).toBe(0);
    expect(RaceModel.aggregate).not.toHaveBeenCalled();
  });
});

describe("RaceRepository.getSummaries", () => {
  const childRaceId = "507f1f77bcf86cd799439014";
  const typeId = "507f1f77bcf86cd799439023";

  it("builds a light tree without hydrating skill or ASI options", async () => {
    const deps = stubFormatDependencies();
    const formatSkillChoices = vi.fn();
    const formatAbilityBonusChoices = vi.fn();
    const getBySystems = vi.fn().mockResolvedValue([{ key: "dex", name: "Destreza" }]);
    const getByIds = vi.fn().mockResolvedValue([{ id: typeId, name: "Humanoide" }]);
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([PARENT_SYSTEM_ID])
    };
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      { formatSkillChoices } as unknown as SkillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      {
        ...deps.attributeService,
        getBySystems,
        formatAbilityBonusChoices
      } as unknown as AttributeService,
      deps.equipmentRepository,
      { getById: vi.fn(), getByIds } as unknown as ICreatureTypeRepository,
      systemRepository as unknown as ISystemRepository
    );

    vi.mocked(RaceModel.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: ELF_ID,
            name: "Elf",
            description: ["Long lore"],
            img: "elf.png",
            ruleset: PARENT_SYSTEM_ID,
            parentId: null,
            subraces_name: "Linajes",
            size: "Medium",
            speed: { walk: 30 },
            creatureTypeId: typeId,
            ability_bonuses: [{ key: "dex", bonus: 2 }],
            ability_bonus_choices: { choose: 2, options: ["str", "dex"] },
            skill_choices: { choose: 1 },
            playable: true
          },
          {
            _id: childRaceId,
            name: "High Elf",
            description: [],
            img: "high.png",
            ruleset: PARENT_SYSTEM_ID,
            parentId: ELF_ID,
            creatureTypeId: null,
            ability_bonuses: [],
            playable: true
          }
        ])
      })
    } as never);

    const [root] = await repository.getSummaries(PARENT_SYSTEM_ID, true);

    expect(formatSkillChoices).not.toHaveBeenCalled();
    expect(formatAbilityBonusChoices).not.toHaveBeenCalled();
    expect(deps.traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(getByIds).toHaveBeenCalledWith([typeId]);
    expect(root.ability_bonuses).toEqual([{ key: "dex", name: "Destreza", bonus: 2 }]);
    expect(root.ability_bonus_choices).toEqual({ choose: 2 });
    expect(root.skill_choices).toEqual({ choose: 1 });
    expect(root.subraces?.name).toBe("Linajes");
    expect(root.subraces?.list[0]).toMatchObject({
      id: childRaceId,
      name: "High Elf",
      creatureType: { id: typeId, name: "Humanoide" }
    });
  });
});

describe("RaceRepository.getCatalog", () => {
  const childRaceId = "507f1f77bcf86cd799439014";
  const typeId = "507f1f77bcf86cd799439023";

  it("returns a flat list with inherited creature types", async () => {
    const deps = stubFormatDependencies();
    const systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([PARENT_SYSTEM_ID])
    };
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn() } as unknown as ICreatureTypeRepository,
      systemRepository as unknown as ISystemRepository
    );

    vi.mocked(RaceModel.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: ELF_ID,
            name: "Elf",
            ruleset: PARENT_SYSTEM_ID,
            parentId: null,
            creatureTypeId: typeId
          },
          {
            _id: childRaceId,
            name: "High Elf",
            ruleset: PARENT_SYSTEM_ID,
            parentId: ELF_ID,
            creatureTypeId: null
          }
        ])
      })
    } as never);

    const catalog = await repository.getCatalog(PARENT_SYSTEM_ID, true);

    expect(RaceModel.find).toHaveBeenCalledWith({
      deletedAt: null,
      playable: { $ne: false },
      ruleset: { $in: [PARENT_SYSTEM_ID] }
    });
    expect(catalog).toEqual([
      { id: ELF_ID, name: "Elf", ruleset: PARENT_SYSTEM_ID, creatureTypeId: typeId },
      { id: childRaceId, name: "High Elf", ruleset: PARENT_SYSTEM_ID, creatureTypeId: typeId }
    ]);
  });
});

describe("RaceRepository.getById", () => {
  const typeId = "507f1f77bcf86cd799439023";

  it("hydrates only the requested race and does not load child races", async () => {
    const deps = stubFormatDependencies();
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      deps.attributeService,
      deps.equipmentRepository,
      { getById: vi.fn().mockResolvedValue({ id: typeId, name: "Humanoide" }) } as unknown as ICreatureTypeRepository
    );

    vi.mocked(RaceModel.findById).mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: ELF_ID,
        name: "Elf",
        description: ["Lore"],
        img: "elf.png",
        ruleset: PARENT_SYSTEM_ID,
        parentId: null,
        deletedAt: null,
        speed: { walk: 30 },
        size: "Medium",
        traits: ["darkvision"],
        traits_data: {},
        ability_bonuses: [],
        skill_choices: { choose: 1, options: ["skill-1"] },
        languages: {},
        variants: [],
        equipment: [],
        creatureTypeId: typeId,
        playable: true
      })
    } as never);

    const result = await repository.getById(ELF_ID);

    expect(result?.id).toBe(ELF_ID);
    expect(result?.subraces).toBeUndefined();
    expect(deps.traitRepository.getTraitsByIndexes).toHaveBeenCalledTimes(1);
    expect(deps.skillService.formatSkillChoices).toHaveBeenCalledTimes(1);
    expect(RaceModel.find).not.toHaveBeenCalled();
  });
});

describe("RaceRepository.getSummarySubtree", () => {
  const childRaceId = "507f1f77bcf86cd799439014";
  const typeId = "507f1f77bcf86cd799439023";

  it("returns the child summary tree of the parent without the parent node", async () => {
    const deps = stubFormatDependencies();
    const getBySystems = vi.fn().mockResolvedValue([]);
    const getByIds = vi.fn().mockResolvedValue([{ id: typeId, name: "Humanoide" }]);
    const repository = new RaceRepository(
      deps.languageRepository,
      deps.spellRepository,
      deps.skillService,
      deps.proficiencyRepository,
      deps.featRepository,
      deps.traitRepository,
      { ...deps.attributeService, getBySystems } as unknown as AttributeService,
      deps.equipmentRepository,
      { getById: vi.fn(), getByIds } as unknown as ICreatureTypeRepository,
      { getSystemsAndAncestors: vi.fn().mockResolvedValue([PARENT_SYSTEM_ID]) } as unknown as ISystemRepository
    );

    vi.mocked(RaceModel.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: ELF_ID,
            name: "Elf",
            description: ["Parent"],
            img: "elf.png",
            ruleset: PARENT_SYSTEM_ID,
            parentId: null,
            subraces_name: "Linajes",
            size: "Medium",
            speed: { walk: 30 },
            creatureTypeId: typeId,
            ability_bonuses: [],
            playable: true
          },
          {
            _id: childRaceId,
            name: "High Elf",
            description: ["Child lore"],
            img: "high.png",
            ruleset: PARENT_SYSTEM_ID,
            parentId: ELF_ID,
            creatureTypeId: null,
            ability_bonuses: [],
            playable: true
          }
        ])
      })
    } as never);

    const subtree = await repository.getSummarySubtree(ELF_ID, PARENT_SYSTEM_ID);

    expect(deps.skillService.formatSkillChoices).not.toHaveBeenCalled();
    expect(subtree?.name).toBe("Linajes");
    expect(subtree?.list).toHaveLength(1);
    expect(subtree?.list[0]).toMatchObject({
      id: childRaceId,
      name: "High Elf",
      description: ["Child lore"],
      creatureType: { id: typeId, name: "Humanoide" }
    });
  });
});


