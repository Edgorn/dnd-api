import { describe, it, expect, vi } from "vitest";
import CreateGroupOption from "./createGroupOption.use-case";
import { AppError } from "../../../domain/errors/AppError";

const input = {
  ruleset: "system-1",
  groupId: "group-1",
  traitId: "trait-1"
};

describe("CreateGroupOption", () => {
  it("creates an option when group, trait and publisher are valid", async () => {
    const created = { id: "opt-1", ...input, repeatable: false, deletedAt: null };
    const useCase = new CreateGroupOption(
      { create: vi.fn().mockResolvedValue(created) } as never,
      { getById: vi.fn().mockResolvedValue({ id: "group-1" }) } as never,
      { getById: vi.fn().mockResolvedValue({ id: "trait-1" }) } as never,
      { getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" }) } as never
    );

    await expect(useCase.execute(input, "user-1")).resolves.toEqual(created);
  });

  it("throws 404 when the group does not exist", async () => {
    const useCase = new CreateGroupOption(
      { create: vi.fn() } as never,
      { getById: vi.fn().mockResolvedValue(null) } as never,
      { getById: vi.fn() } as never,
      { getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" }) } as never
    );

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it("throws 404 when the trait does not exist", async () => {
    const useCase = new CreateGroupOption(
      { create: vi.fn() } as never,
      { getById: vi.fn().mockResolvedValue({ id: "group-1" }) } as never,
      { getById: vi.fn().mockResolvedValue(null) } as never,
      { getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" }) } as never
    );

    await expect(useCase.execute(input, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });
});
