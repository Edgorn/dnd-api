import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCharacterXp from "./updateCharacterXp.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("UpdateCharacterXp", () => {
  let characterServiceMock: {
    updateXp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      updateXp: vi.fn(),
    };
  });

  it("should delegate to characterService.updateXp", async () => {
    const useCase = new UpdateCharacterXp(characterServiceMock as any);
    characterServiceMock.updateXp.mockResolvedValue(undefined);

    await useCase.execute("char1", 1500, "user1");

    expect(characterServiceMock.updateXp).toHaveBeenCalledWith("char1", 1500, "user1");
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new UpdateCharacterXp(characterServiceMock as any);
    characterServiceMock.updateXp.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute("char1", 100, "user1")).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new UpdateCharacterXp(characterServiceMock as any);
    characterServiceMock.updateXp.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute("char1", 100, "user2")).rejects.toThrow(AppError);
    await expect(useCase.execute("char1", 100, "user2")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
