import { describe, it, expect, vi, beforeEach } from "vitest";
import ProficiencyRepository from "./proficiency.repository";
import ProficiencySchema from "../schemas/Proficiency";
import SystemRepository from "./system.repository";

vi.mock("../schemas/Proficiency", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}));

function mockFindLean(docs: unknown[]) {
  vi.mocked(ProficiencySchema.find).mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(docs),
  } as never);
}

function mockFindCollationSort(docs: unknown[]) {
  vi.mocked(ProficiencySchema.find).mockReturnValueOnce({
    collation: vi.fn().mockReturnValue({
      sort: vi.fn().mockResolvedValue(docs),
    }),
  } as never);
}

describe("ProficiencyRepository.getDescendantProficiencies", () => {
  let repository: ProficiencyRepository;

  beforeEach(() => {
    repository = new ProficiencyRepository({} as SystemRepository);
    vi.clearAllMocks();
  });

  it("returns empty array for empty parent ids", async () => {
    expect(await repository.getDescendantProficiencies([])).toEqual([]);
    expect(ProficiencySchema.find).not.toHaveBeenCalled();
  });

  it("returns empty array for invalid parent ids", async () => {
    expect(await repository.getDescendantProficiencies(["not-an-id"])).toEqual([]);
    expect(ProficiencySchema.find).not.toHaveBeenCalled();
  });

  it("returns direct children", async () => {
    const parentId = "507f1f77bcf86cd799439011";
    const childId = "507f1f77bcf86cd799439012";
    const ruleset = "507f1f77bcf86cd799439013";

    mockFindLean([
      {
        _id: childId,
        name: "Armaduras pesadas",
        type: "Armaduras",
        parentProficiencyId: parentId,
        ruleset,
        deletedAt: null,
      },
    ]);
    mockFindLean([]);

    const result = await repository.getDescendantProficiencies([parentId]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(childId);
    expect(result[0].parentProficiencyId).toBe(parentId);
    expect(ProficiencySchema.find).toHaveBeenCalledTimes(2);
  });

  it("returns grandchildren across iterations", async () => {
    const parentId = "507f1f77bcf86cd799439011";
    const childId = "507f1f77bcf86cd799439012";
    const grandchildId = "507f1f77bcf86cd799439014";
    const ruleset = "507f1f77bcf86cd799439013";

    mockFindLean([
      {
        _id: childId,
        name: "Armaduras pesadas",
        type: "Armaduras",
        parentProficiencyId: parentId,
        ruleset,
        deletedAt: null,
      },
    ]);
    mockFindLean([
      {
        _id: grandchildId,
        name: "Placas",
        type: "Armaduras",
        parentProficiencyId: childId,
        ruleset,
        deletedAt: null,
      },
    ]);
    mockFindLean([]);

    const result = await repository.getDescendantProficiencies([parentId]);

    expect(result.map(item => item.id).sort()).toEqual([childId, grandchildId].sort());
    expect(ProficiencySchema.find).toHaveBeenCalledTimes(3);
  });

  it("does not loop when the graph cycles back to a visited parent", async () => {
    const parentId = "507f1f77bcf86cd799439011";
    const childId = "507f1f77bcf86cd799439012";
    const ruleset = "507f1f77bcf86cd799439013";

    mockFindLean([
      {
        _id: childId,
        name: "Armaduras pesadas",
        type: "Armaduras",
        parentProficiencyId: parentId,
        ruleset,
        deletedAt: null,
      },
    ]);
    mockFindLean([
      {
        _id: parentId,
        name: "Todas las armaduras",
        type: "Armaduras",
        parentProficiencyId: childId,
        ruleset,
        deletedAt: null,
      },
    ]);

    const result = await repository.getDescendantProficiencies([parentId]);

    expect(result.map(item => item.id).sort()).toEqual([childId, parentId].sort());
    expect(ProficiencySchema.find).toHaveBeenCalledTimes(2);
  });
});

describe("ProficiencyRepository.formatProficiencyChoices", () => {
  let repository: ProficiencyRepository;
  const proficiencyId = "507f1f77bcf86cd799439011";
  const ruleset = "507f1f77bcf86cd799439013";
  const proficiencyDoc = {
    _id: proficiencyId,
    name: "Herramientas de ladrón",
    type: "tool",
    parentProficiencyId: null,
    ruleset,
    deletedAt: null,
  };

  beforeEach(() => {
    repository = new ProficiencyRepository({} as SystemRepository);
    vi.clearAllMocks();
  });

  it("returns empty array when input is undefined", async () => {
    expect(await repository.formatProficiencyChoices(undefined)).toEqual([]);
    expect(ProficiencySchema.find).not.toHaveBeenCalled();
  });

  it("returns empty array when a choice has neither options nor filter", async () => {
    expect(await repository.formatProficiencyChoices([{ choose: 1 }])).toEqual([]);
    expect(ProficiencySchema.find).not.toHaveBeenCalled();
  });

  it("sets query_type to options for a list of ids", async () => {
    mockFindLean([proficiencyDoc]);

    const result = await repository.formatProficiencyChoices([
      { choose: 1, options: [proficiencyId] },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].query_type).toBe("options");
    expect(result[0].query_filter).toBeUndefined();
    expect(result[0].options[0].id).toBe(proficiencyId);
  });

  it("sets query_type to filter and copies query_filter from the input filter", async () => {
    mockFindCollationSort([proficiencyDoc]);
    const filter = { type: "tool" };

    const result = await repository.formatProficiencyChoices([
      { choose: 1, filter },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].query_type).toBe("filter");
    expect(result[0].query_filter).toEqual(filter);
    expect(result[0].options[0].id).toBe(proficiencyId);
  });

  it("maps a legacy options string to query_type filter and query_filter.type", async () => {
    mockFindCollationSort([proficiencyDoc]);

    const result = await repository.formatProficiencyChoices([
      { choose: 1, options: "tool" as unknown as string[] },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].query_type).toBe("filter");
    expect(result[0].query_filter).toEqual({ type: "tool" });
    expect(result[0].options[0].id).toBe(proficiencyId);
  });
});
