import { describe, it, expect, vi, beforeEach } from "vitest";
import TraitRepository from "./trait.repository";
import TraitSchema from "../schemas/Trait";

vi.mock("../schemas/Trait", () => ({
  default: {
    find: vi.fn()
  }
}));

const TRAIT_ID = "507f1f77bcf86cd799439081";

describe("TraitRepository.getArmorClassInputsByIds", () => {
  let repository: TraitRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TraitRepository(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
  });

  it("selects only armor-class fields and skips full trait hydration", async () => {
    const lean = vi.fn().mockResolvedValue([
      {
        _id: { toString: () => TRAIT_ID },
        acFormula: "10 + @attributes.dex.modifier",
        bonuses: { armor_class: 1 },
        abilityScores: [{ key: "str", bonus: 1 }],
        suppressedByArmorTypeIds: ["heavy"],
        spells: ["should-not-be-selected"]
      }
    ]);
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(TraitSchema.find).mockReturnValue({ select } as never);

    const [trait] = await repository.getArmorClassInputsByIds([TRAIT_ID, TRAIT_ID, "not-an-id"]);

    expect(select).toHaveBeenCalledWith("_id abilityScores acFormula bonuses suppressedByArmorTypeIds");
    expect(trait).toEqual({
      id: TRAIT_ID,
      acFormula: "10 + @attributes.dex.modifier",
      bonuses: { armor_class: 1 },
      abilityScores: [{ key: "str", bonus: 1 }],
      suppressedByArmorTypeIds: ["heavy"]
    });
  });

  it("returns empty without querying when there are no valid ids", async () => {
    const result = await repository.getArmorClassInputsByIds(["", "nope"]);

    expect(TraitSchema.find).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
