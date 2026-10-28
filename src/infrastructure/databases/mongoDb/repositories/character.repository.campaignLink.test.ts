import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterRepository from "./character.repository";
import CharacterModel from "../schemas/Character";

vi.mock("../schemas/Character", () => ({
  default: {
    findOneAndUpdate: vi.fn()
  }
}));

const CHAR_ID = "507f1f77bcf86cd799439004";
const CAMPAIGN_ID = "507f1f77bcf86cd799439010";

describe("CharacterRepository campaign link", () => {
  let repository: CharacterRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CharacterRepository(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
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

  it("unassignFromCampaign clears campaign only when the character belongs to that campaign", async () => {
    vi.mocked(CharacterModel.findOneAndUpdate).mockResolvedValue({
      _id: { toString: () => CHAR_ID },
      campaign: null
    } as never);

    const result = await repository.unassignFromCampaign(CHAR_ID, CAMPAIGN_ID);

    expect(CharacterModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: CHAR_ID, campaign: CAMPAIGN_ID },
      { $set: { campaign: null } },
      { returnDocument: "after" }
    );
    expect(result).toEqual({ characterId: CHAR_ID });
  });

  it("unassignFromCampaign returns null when the campaign filter does not match", async () => {
    vi.mocked(CharacterModel.findOneAndUpdate).mockResolvedValue(null as never);

    const result = await repository.unassignFromCampaign(CHAR_ID, CAMPAIGN_ID);

    expect(result).toBeNull();
  });
});
