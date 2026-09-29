import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { NotFoundError } from "../../../../domain/errors/AppError";
import ConditionRepository from "./condition.repository";
import ConditionModel from "../schemas/Condition";

vi.mock("../schemas/Condition", () => ({
  default: {
    find: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}));

const POISONED_ID = "507f1f77bcf86cd799439011";

describe("ConditionRepository.getByIds", () => {
  const repository = new ConditionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta solo identificadores válidos y excluye los borrados", async () => {
    vi.mocked(ConditionModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{
        _id: new Types.ObjectId(POISONED_ID),
        name: "Envenenado",
        ruleset: "sys1",
        deletedAt: null
      }])
    } as never);

    const result = await repository.getByIds([POISONED_ID, "not-an-id"]);

    expect(ConditionModel.find).toHaveBeenCalledWith({
      _id: { $in: [new Types.ObjectId(POISONED_ID)] },
      deletedAt: null
    });
    expect(result).toEqual([{
      id: POISONED_ID,
      name: "Envenenado",
      ruleset: "sys1",
      description: undefined,
      deletedAt: null
    }]);
  });

  it("no consulta la base si ningún identificador es válido", async () => {
    const result = await repository.getByIds(["not-an-id"]);

    expect(result).toEqual([]);
    expect(ConditionModel.find).not.toHaveBeenCalled();
  });
});

describe("ConditionRepository.update", () => {
  const repository = new ConditionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trata un identificador que no es ObjectId como no encontrado", async () => {
    await expect(repository.update({ id: "not-an-id", name: "Aturdido" }))
      .rejects.toBeInstanceOf(NotFoundError);
    expect(ConditionModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
