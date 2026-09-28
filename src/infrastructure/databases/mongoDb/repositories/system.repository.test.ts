import { describe, it, expect, vi, beforeEach } from "vitest";
import SystemRepository from "./system.repository";
import SistemasModel from "../schemas/System";
import { mergeRulesFromAncestry } from "../../../../utils/systemRulesMerge";

vi.mock("../schemas/System", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

function mockFindById(doc: unknown | null) {
  vi.mocked(SistemasModel.findOne).mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(doc),
  } as never);
}

describe("SystemRepository.getMergedRulesConfig", () => {
  let repository: SystemRepository;

  beforeEach(() => {
    repository = new SystemRepository();
    vi.clearAllMocks();
  });

  it("returns merged config from child ancestry chain", async () => {
    const childId = "507f1f77bcf86cd799439011";
    const parentId = "507f1f77bcf86cd799439012";

    vi.mocked(SistemasModel.find).mockResolvedValue([
      { _id: childId, name: "Child" },
    ] as never);

    mockFindById({
      _id: childId,
      parentId,
      xpProgression: [0, 500],
      hpInitialFormula: "child-hp",
      deletedAt: null,
    });
    mockFindById({
      _id: parentId,
      proficiencyProgression: [2, 4],
      hpInitialFormula: "parent-hp",
      deletedAt: null,
    });
    mockFindById(null);

    const config = await repository.getMergedRulesConfig([childId]);

    expect(config.xpProgression).toEqual([0, 500]);
    expect(config.proficiencyProgression).toEqual([2, 4]);
    expect(config.hpInitialFormula).toBe("child-hp");
  });

  it("returns empty config when no systems match", async () => {
    vi.mocked(SistemasModel.find).mockResolvedValue([] as never);
    const config = await repository.getMergedRulesConfig(["unknown"]);
    expect(config).toEqual({});
  });
});

describe("SystemRepository.hasChildren", () => {
  let repository: SystemRepository;

  beforeEach(() => {
    repository = new SystemRepository();
    vi.clearAllMocks();
  });

  it("counts only non-deleted children of the parent", async () => {
    vi.mocked(SistemasModel.countDocuments).mockResolvedValue(1 as never);

    const result = await repository.hasChildren("507f1f77bcf86cd799439011");

    expect(result).toBe(true);
    expect(SistemasModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
      deletedAt: null,
    }));
  });

  it("returns false for an invalid id without querying", async () => {
    const result = await repository.hasChildren("not-an-id");

    expect(result).toBe(false);
    expect(SistemasModel.countDocuments).not.toHaveBeenCalled();
  });
});

describe("mergeRulesFromAncestry integration scenarios", () => {
  it("child overrides parent arrays and inherits missing values", () => {
    const config = mergeRulesFromAncestry([
      {
        _id: "child" as never,
        name: "Child",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        xpProgression: [0, 900],
      },
      {
        _id: "parent" as never,
        name: "Parent",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        xpProgression: [0, 300],
        proficiencyProgression: [2, 2],
        baseAcFormula: "10 + @attributes.dex.modifier",
      },
    ] as never);

    expect(config.xpProgression).toEqual([0, 900]);
    expect(config.proficiencyProgression).toEqual([2, 2]);
    expect(config.baseAcFormula).toBe("10 + @attributes.dex.modifier");
  });

  it("returns only ruleset rules from a campaign, setting and ruleset chain", () => {
    const config = mergeRulesFromAncestry([
      {
        _id: "campaign" as never,
        name: "Mesa",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        kind: "campaign",
        maxLevel: 3,
        hpInitialFormula: "campaign-hp",
        xpProgression: [0, 1, 2],
      },
      {
        _id: "setting" as never,
        name: "Setting",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        kind: "setting",
        maxLevel: 10,
        hpInitialFormula: "setting-hp",
        baseAcFormula: "setting-ac",
      },
      {
        _id: "ruleset" as never,
        name: "Ruleset",
        description: "",
        publisher: "pub",
        isOpen: true,
        isBase: true,
        maxLevel: 20,
        hpInitialFormula: "ruleset-hp",
        xpProgression: [0, 300],
        baseAcFormula: "10 + @attributes.dex.modifier",
      },
    ] as never);

    expect(config.maxLevel).toBe(20);
    expect(config.hpInitialFormula).toBe("ruleset-hp");
    expect(config.xpProgression).toEqual([0, 300]);
    expect(config.baseAcFormula).toBe("10 + @attributes.dex.modifier");
  });

  it("treats empty abilityScoreProgression as an explicit child value", () => {
    const config = mergeRulesFromAncestry([
      {
        _id: "child" as never,
        name: "Child",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        abilityScoreProgression: [],
      },
      {
        _id: "parent" as never,
        name: "Parent",
        description: "",
        publisher: "pub",
        isOpen: false,
        isBase: false,
        abilityScoreProgression: [4, 8, 12, 16, 19],
      },
    ] as never);

    expect(config.abilityScoreProgression).toEqual([]);
  });
});
