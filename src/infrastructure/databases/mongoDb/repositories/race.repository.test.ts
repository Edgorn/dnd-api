import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("../schemas/Race", () => ({
  default: {
    find: vi.fn(),
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
});
