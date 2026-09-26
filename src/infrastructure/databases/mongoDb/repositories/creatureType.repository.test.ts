import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import CreatureTypeRepository from "./creatureType.repository";
import CreatureTypeModel from "../schemas/CreatureType";

vi.mock("../schemas/CreatureType", () => ({
  default: {
    find: vi.fn()
  }
}));

const HUMANOID_ID = "507f1f77bcf86cd799439011";

describe("CreatureTypeRepository.getByIds", () => {
  const repository = new CreatureTypeRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta solo identificadores válidos y excluye los borrados", async () => {
    vi.mocked(CreatureTypeModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{
        _id: new Types.ObjectId(HUMANOID_ID),
        name: "Humanoide",
        ruleset: "sys1",
        deletedAt: null
      }])
    } as never);

    const result = await repository.getByIds([HUMANOID_ID, "not-an-id"]);

    expect(CreatureTypeModel.find).toHaveBeenCalledWith({
      _id: { $in: [new Types.ObjectId(HUMANOID_ID)] },
      deletedAt: null
    });
    expect(result).toEqual([{
      id: HUMANOID_ID,
      name: "Humanoide",
      ruleset: "sys1",
      description: undefined,
      deletedAt: null
    }]);
  });

  it("no consulta la base si ningún identificador es válido", async () => {
    const result = await repository.getByIds(["not-an-id"]);

    expect(result).toEqual([]);
    expect(CreatureTypeModel.find).not.toHaveBeenCalled();
  });
});
