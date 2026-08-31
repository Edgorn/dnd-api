import { describe, it, expect, vi, beforeEach } from "vitest";
import SystemRepository from "./system.repository";
import SistemasModel from "../schemas/System";
import { mergeRulesFromAncestry } from "../../../../utils/systemRulesMerge";

vi.mock("../schemas/System", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
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
});
