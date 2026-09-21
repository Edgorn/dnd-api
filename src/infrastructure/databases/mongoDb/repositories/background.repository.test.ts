import { describe, it, expect, vi, beforeEach } from "vitest";
import BackgroundRepository from "./background.repository";
import BackgroundModel from "../schemas/Background";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ISkillRepository from "../../../../domain/repositories/ISkillRepository";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import ICoinRepository from "../../../../domain/repositories/ICoinRepository";

vi.mock("../schemas/Background", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

const PARENT_SYSTEM_ID = "507f1f77bcf86cd799439011";
const CHILD_SYSTEM_ID = "507f1f77bcf86cd799439012";
const NOBLE_ID = "507f1f77bcf86cd799439013";

function stubFormatDependencies() {
  return {
    skillRepository: {
      getSkillsByIds: vi.fn().mockResolvedValue([]),
    } as unknown as ISkillRepository,
    proficiencyRepository: {
      getProficienciesByIndices: vi.fn().mockResolvedValue([]),
      formatProficiencyChoices: vi.fn().mockResolvedValue([]),
    } as unknown as IProficiencyRepository,
    languageRepository: {
      formatLanguageChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as ILanguageRepository,
    equipmentRepository: {
      getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([]),
      formatEquipmentItemChoices: vi.fn().mockResolvedValue(undefined),
    } as unknown as IEquipmentRepository,
    traitRepository: {
      getTraitsByIndexes: vi.fn().mockResolvedValue([]),
      formatTraitChoices: vi.fn().mockResolvedValue([]),
    } as unknown as ITraitRepository,
    coinRepository: {
      getCoinsByIds: vi.fn().mockResolvedValue([]),
    } as unknown as ICoinRepository,
  };
}

function mockRootFind(docs: unknown[]) {
  vi.mocked(BackgroundModel.find).mockReturnValueOnce({
    collation: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(docs),
  } as never);
}

function mockChildFind(docs: unknown[]) {
  vi.mocked(BackgroundModel.find).mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(docs),
  } as never);
}

describe("BackgroundRepository.getBySystems variant ancestry filter", () => {
  const noble = {
    _id: NOBLE_ID,
    name: "Noble",
    ruleset: PARENT_SYSTEM_ID,
    parentId: null,
    deletedAt: null,
  };

  let systemRepository: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };
  let repository: BackgroundRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    const deps = stubFormatDependencies();
    systemRepository = {
      getSystemsAndAncestors: vi.fn(),
    };
    repository = new BackgroundRepository(
      systemRepository as unknown as ISystemRepository,
      deps.skillRepository,
      deps.proficiencyRepository,
      deps.languageRepository,
      deps.equipmentRepository,
      deps.traitRepository,
      deps.coinRepository
    );
  });

  it("filters nested variants with the parent ancestry when listing the parent system", async () => {
    const parentExpanded = [PARENT_SYSTEM_ID];
    systemRepository.getSystemsAndAncestors.mockResolvedValue(parentExpanded);
    mockRootFind([noble]);
    mockChildFind([]);

    await repository.getBySystems([PARENT_SYSTEM_ID]);

    expect(BackgroundModel.find).toHaveBeenNthCalledWith(1, {
      ruleset: { $in: parentExpanded },
      parentId: null,
      deletedAt: null,
    });
    expect(BackgroundModel.find).toHaveBeenNthCalledWith(2, {
      parentId: NOBLE_ID,
      deletedAt: null,
      ruleset: { $in: parentExpanded },
    });
  });

  it("filters nested variants with parent and child ids when listing the child system", async () => {
    const childExpanded = [CHILD_SYSTEM_ID, PARENT_SYSTEM_ID];
    systemRepository.getSystemsAndAncestors.mockResolvedValue(childExpanded);
    mockRootFind([noble]);
    mockChildFind([]);

    await repository.getBySystems([CHILD_SYSTEM_ID]);

    expect(BackgroundModel.find).toHaveBeenNthCalledWith(1, {
      ruleset: { $in: childExpanded },
      parentId: null,
      deletedAt: null,
    });
    expect(BackgroundModel.find).toHaveBeenNthCalledWith(2, {
      parentId: NOBLE_ID,
      deletedAt: null,
      ruleset: { $in: childExpanded },
    });
  });

  it("unsets overlay fields sent as null on a variant update", async () => {
    const variantId = "507f1f77bcf86cd799439014";
    const variantDoc = {
      _id: variantId,
      name: "Caballero",
      ruleset: PARENT_SYSTEM_ID,
      parentId: NOBLE_ID,
      traits: ["retainers-id"],
    };
    const parentDoc = {
      _id: NOBLE_ID,
      name: "Noble",
      ruleset: PARENT_SYSTEM_ID,
      parentId: null,
      traits_choices: [{ choose: 1, options: ["privilege-id"] }],
    };

    const leanOnce = (doc: unknown) => ({
      lean: vi.fn().mockResolvedValue(doc),
    });

    vi.mocked(BackgroundModel.findById)
      .mockReturnValueOnce(leanOnce(variantDoc) as never)
      .mockReturnValueOnce(leanOnce(variantDoc) as never)
      .mockReturnValueOnce(leanOnce(parentDoc) as never);
    vi.mocked(BackgroundModel.findByIdAndUpdate).mockResolvedValue({} as never);

    await repository.update({ id: variantId, traits_choices: null });

    expect(BackgroundModel.findByIdAndUpdate).toHaveBeenCalledWith(variantId, {
      $unset: { traits_choices: 1 },
    });
  });
});
