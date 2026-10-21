import { describe, it, expect, vi } from "vitest";
import GetGroupOptionsByGroup from "./getGroupOptionsByGroup.use-case";
import { AppError } from "../../../domain/errors/AppError";

describe("GetGroupOptionsByGroup", () => {
  it("lists options of an existing group", async () => {
    const groupOptionService = {
      getByGroup: vi.fn().mockResolvedValue([
        { id: "opt-1", groupId: "group-1", traitId: "t1", ruleset: "sys", deletedAt: null }
      ])
    };
    const optionGroupService = {
      getById: vi.fn().mockResolvedValue({ id: "group-1", ruleset: "sys" })
    };
    const useCase = new GetGroupOptionsByGroup(groupOptionService as never, optionGroupService as never);
    const result = await useCase.execute("group-1", ["sys"]);

    expect(groupOptionService.getByGroup).toHaveBeenCalledWith("group-1", ["sys"]);
    expect(result).toEqual([{ id: "opt-1", groupId: "group-1", traitId: "t1", ruleset: "sys" }]);
  });

  it("throws 404 when the group is missing", async () => {
    const useCase = new GetGroupOptionsByGroup(
      { getByGroup: vi.fn() } as never,
      { getById: vi.fn().mockResolvedValue(null) } as never
    );
    await expect(useCase.execute("group-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });
});
