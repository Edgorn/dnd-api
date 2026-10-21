import { describe, it, expect, vi } from "vitest";
import UpdateGroupOption from "./updateGroupOption.use-case";
import { AppError } from "../../../domain/errors/AppError";

const existing = { id: "opt-1", ruleset: "system-1", groupId: "group-1", traitId: "trait-1" };

describe("UpdateGroupOption", () => {
  it("updates when the user is the publisher", async () => {
    const useCase = new UpdateGroupOption(
      {
        getById: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue({ ...existing, repeatable: true })
      } as never,
      { getById: vi.fn() } as never,
      { getById: vi.fn() } as never,
      { getById: vi.fn().mockResolvedValue({ id: "system-1", publisher: "user-1" }) } as never
    );

    const result = await useCase.execute({ id: "opt-1", repeatable: true }, "user-1");
    expect(result.repeatable).toBe(true);
  });

  it("throws 404 when missing", async () => {
    const useCase = new UpdateGroupOption(
      { getById: vi.fn().mockResolvedValue(null), update: vi.fn() } as never,
      { getById: vi.fn() } as never,
      { getById: vi.fn() } as never,
      { getById: vi.fn() } as never
    );

    await expect(useCase.execute({ id: "opt-1" }, "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });
});
