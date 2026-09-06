import { describe, it, expect, vi, beforeEach } from "vitest";
import GetLevelUpData from "./getLevelUpData.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("GetLevelUpData", () => {
  let personajeServiceMock: {
    getLevelUpData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      getLevelUpData: vi.fn(),
    };
  });

  it("should delegate to personajeService.getLevelUpData", async () => {
    const useCase = new GetLevelUpData(personajeServiceMock as any);
    const expected = { class: "class1", hit_die: 8, prof_bonus: 2 };
    personajeServiceMock.getLevelUpData.mockResolvedValue(expected);

    const result = await useCase.execute("char1", "class1", "user1");

    expect(personajeServiceMock.getLevelUpData).toHaveBeenCalledWith("char1", "class1", "user1");
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new GetLevelUpData(personajeServiceMock as any);
    personajeServiceMock.getLevelUpData.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute("char1", "class1", "user1")).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new GetLevelUpData(personajeServiceMock as any);
    personajeServiceMock.getLevelUpData.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute("char1", "class1", "user2")).rejects.toThrow(AppError);
    await expect(useCase.execute("char1", "class1", "user2")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
