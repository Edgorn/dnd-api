import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import LanguageRepository from "./language.repository";
import LanguageSchema from "../schemas/Language";

vi.mock("../schemas/Language", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}));

const COMMON_ID = "507f1f77bcf86cd799439011";

describe("LanguageRepository.getByIds", () => {
  const repository = new LanguageRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta ObjectIds y omite etiquetas o slugs", async () => {
    vi.mocked(LanguageSchema.find).mockResolvedValue([{
      _id: new Types.ObjectId(COMMON_ID),
      name: "Común",
      ruleset: "sys1",
      deletedAt: null
    }] as never);

    const result = await repository.getByIds([COMMON_ID, "the languages of its creator"]);

    expect(LanguageSchema.find).toHaveBeenCalledWith({
      _id: { $in: [new Types.ObjectId(COMMON_ID)] },
      deletedAt: null
    });
    expect(result).toEqual([{
      id: COMMON_ID,
      name: "Común",
      type: undefined,
      description: undefined,
      script: undefined,
      ruleset: "sys1",
      deletedAt: null
    }]);
  });

  it("no consulta la base si ningún identificador es ObjectId", async () => {
    const result = await repository.getByIds(["draconic", "the languages of its creator"]);

    expect(result).toEqual([]);
    expect(LanguageSchema.find).not.toHaveBeenCalled();
  });
});

describe("LanguageRepository.getById", () => {
  const repository = new LanguageRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no busca por index y devuelve null si el id no es ObjectId", async () => {
    const result = await repository.getById("draconic");

    expect(result).toBeNull();
    expect(LanguageSchema.findById).not.toHaveBeenCalled();
  });
});
