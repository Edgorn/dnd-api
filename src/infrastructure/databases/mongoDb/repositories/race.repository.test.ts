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
  },
}));

const PARENT_SYSTEM_ID = "507f1f77bcf86cd799439011";
const CHILD_SYSTEM_ID = "507f1f77bcf86cd799439012";
const ELF_ID = "507f1f77bcf86cd799439013";

function stubFormatDependencies() {
  return {
    languageRepository: {
      getLanguagesByIndex: vi.fn().mockResolvedValue([]),
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

describe("RaceRepository.obtenerPorSistema subrace ancestry filter", () => {
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

    await repository.obtenerPorSistema(PARENT_SYSTEM_ID);

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

    await repository.obtenerPorSistema(CHILD_SYSTEM_ID);

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

    await repository.obtenerPorSistema(PARENT_SYSTEM_ID, true);

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
    vi.mocked(RaceModel.find).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{
          _id: childId,
          name: "Trasgo",
          ruleset: PARENT_SYSTEM_ID,
          parentId,
          creatureTypeId: null,
        }]),
      }),
    } as never);
    vi.mocked(RaceModel.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: parentId,
          creatureTypeId: typeId,
          parentId: null,
        }),
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
    vi.mocked(RaceModel.find).mockReturnValueOnce({
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
    } as never);
    vi.mocked(RaceModel.findOne).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: parentId,
          creatureTypeId: typeId,
          parentId: null,
        }),
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
