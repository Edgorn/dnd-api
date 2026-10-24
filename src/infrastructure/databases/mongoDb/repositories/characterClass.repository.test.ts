import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterClassRepository from "./characterClass.repository";
import CharacterClassModel from "../schemas/CharacterClass";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import ISubclassRepository from "../../../../domain/repositories/ISubclassRepository";
import AttributeService from "../../../../domain/services/attribute.service";

vi.mock("../schemas/CharacterClass", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn()
  }
}));

const SYSTEM_ID = "507f1f77bcf86cd799439011";
const CLASS_ID = "507f1f77bcf86cd799439013";

function mockFindChain(docs: unknown[]) {
  const lean = vi.fn().mockResolvedValue(docs);
  const sort = vi.fn().mockReturnValue({ lean });
  const collation = vi.fn().mockReturnValue({ sort });
  const select = vi.fn().mockReturnValue({ collation });
  vi.mocked(CharacterClassModel.find).mockReturnValue({ select } as never);
  return { select, collation, sort, lean };
}

function buildRepository(overrides: {
  traitRepository?: ITraitRepository;
  spellRepository?: ISpellRepository;
  subclassRepository?: ISubclassRepository;
  attributeService?: AttributeService;
} = {}) {
  const systemRepository = {
    getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID])
  } as unknown as ISystemRepository;

  return {
    systemRepository,
    repository: new CharacterClassRepository(
      systemRepository,
      undefined,
      undefined,
      undefined,
      overrides.traitRepository,
      overrides.spellRepository,
      undefined,
      overrides.attributeService,
      overrides.subclassRepository
    )
  };
}

describe("CharacterClassRepository.getSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("projects light fields and does not hydrate traits, spells or subclasses", async () => {
    const traitRepository = {
      getTraitsByIndexes: vi.fn()
    } as unknown as ITraitRepository;
    const spellRepository = {
      formatSpellChoices: vi.fn()
    } as unknown as ISpellRepository;
    const subclassRepository = {
      getByClassAndSystems: vi.fn()
    } as unknown as ISubclassRepository;

    const { repository, systemRepository } = buildRepository({
      traitRepository,
      spellRepository,
      subclassRepository
    });

    const { select } = mockFindChain([
      {
        _id: CLASS_ID,
        name: "Mago",
        description: ["Lore"],
        img: "wizard.png",
        ruleset: SYSTEM_ID,
        hit_die: 6,
        spellcasting: "507f1f77bcf86cd799439014",
        subclassChoice: {
          name: "Tradiciones arcanas",
          description: ["Texto largo"],
          level: 2
        }
      }
    ]);

    const [summary] = await repository.getSummaries([SYSTEM_ID]);

    expect(systemRepository.getSystemsAndAncestors).toHaveBeenCalledWith([SYSTEM_ID]);
    expect(select).toHaveBeenCalledWith("_id name description img ruleset hit_die spellcasting subclassChoice");
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(spellRepository.formatSpellChoices).not.toHaveBeenCalled();
    expect(subclassRepository.getByClassAndSystems).not.toHaveBeenCalled();
    expect(summary).toEqual({
      id: CLASS_ID,
      name: "Mago",
      img: "wizard.png",
      description: ["Lore"],
      ruleset: SYSTEM_ID,
      hit_die: 6,
      hasSpellcasting: true,
      subclassChoice: { name: "Tradiciones arcanas", level: 2 }
    });
  });
});

describe("CharacterClassRepository.getCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects id, name and ruleset without levels", async () => {
    const { repository } = buildRepository();
    const { select } = mockFindChain([
      { _id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID }
    ]);

    const catalog = await repository.getCatalog([SYSTEM_ID]);

    expect(select).toHaveBeenCalledWith("_id name ruleset");
    expect(catalog).toEqual([
      { id: CLASS_ID, name: "Mago", ruleset: SYSTEM_ID }
    ]);
  });

  it("hydrates multiclass requirements when requested", async () => {
    const attributeService = {
      getBySystems: vi.fn().mockResolvedValue([
        { key: "int", name: "Inteligencia", icon: "int.png" }
      ])
    } as unknown as AttributeService;
    const { repository } = buildRepository({ attributeService });
    mockFindChain([
      {
        _id: CLASS_ID,
        name: "Mago",
        ruleset: SYSTEM_ID,
        multiclass: {
          requirements: { attributeMode: "all", attributes: [{ key: "int", min: 13 }] }
        }
      }
    ]);

    const [item] = await repository.getCatalog([SYSTEM_ID], true);

    expect(item.multiclass?.requirements).toEqual({
      attributeMode: "all",
      attributes: [{ key: "int", name: "Inteligencia", min: 13, icon: "int.png" }]
    });
  });
});
