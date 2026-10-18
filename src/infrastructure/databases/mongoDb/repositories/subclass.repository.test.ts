import { describe, it, expect, vi, beforeEach } from "vitest";
import SubclassRepository from "./subclass.repository";
import SubclassModel from "../schemas/Subclass";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import SkillService from "../../../../domain/services/skill.service";

vi.mock("../schemas/Subclass", () => ({
  default: {
    find: vi.fn(),
    aggregate: vi.fn()
  }
}));

const SYSTEM_ID = "507f1f77bcf86cd799439011";
const CLASS_ID = "507f1f77bcf86cd799439013";
const SUBCLASS_ID = "507f1f77bcf86cd799439015";

describe("SubclassRepository light queries", () => {
  const traitRepository = {
    getTraitsByIndexes: vi.fn()
  } as unknown as ITraitRepository;
  const skillService = {
    formatSkillChoices: vi.fn()
  } as unknown as SkillService;
  const systemRepository = {
    getSystemsAndAncestors: vi.fn().mockResolvedValue([SYSTEM_ID])
  } as unknown as ISystemRepository;

  let repository: SubclassRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    systemRepository.getSystemsAndAncestors = vi.fn().mockResolvedValue([SYSTEM_ID]);
    repository = new SubclassRepository(systemRepository, traitRepository, skillService);
  });

  it("getSummariesByClassAndSystems does not format levels or traits", async () => {
    const lean = vi.fn().mockResolvedValue([
      {
        _id: SUBCLASS_ID,
        name: "Evocación",
        img: "evo.png",
        description: ["Fuego"],
        ruleset: SYSTEM_ID,
        classId: CLASS_ID
      }
    ]);
    const sort = vi.fn().mockReturnValue({ lean });
    const collation = vi.fn().mockReturnValue({ sort });
    const select = vi.fn().mockReturnValue({ collation });
    vi.mocked(SubclassModel.find).mockReturnValue({ select } as never);

    const [summary] = await repository.getSummariesByClassAndSystems(CLASS_ID, [SYSTEM_ID]);

    expect(select).toHaveBeenCalledWith("_id name img description ruleset classId");
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(skillService.formatSkillChoices).not.toHaveBeenCalled();
    expect(summary).toEqual({
      id: SUBCLASS_ID,
      name: "Evocación",
      img: "evo.png",
      description: ["Fuego"],
      ruleset: SYSTEM_ID,
      classId: CLASS_ID
    });
  });

  it("countByClassIds aggregates without formatting subclass levels", async () => {
    vi.mocked(SubclassModel.aggregate).mockResolvedValue([
      { _id: CLASS_ID, count: 4 }
    ] as never);

    const counts = await repository.countByClassIds([CLASS_ID], [SYSTEM_ID]);

    expect(SubclassModel.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          classId: { $in: [CLASS_ID] },
          ruleset: { $in: [SYSTEM_ID] },
          deletedAt: null
        }
      },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]);
    expect(traitRepository.getTraitsByIndexes).not.toHaveBeenCalled();
    expect(counts.get(CLASS_ID)).toBe(4);
  });
});
