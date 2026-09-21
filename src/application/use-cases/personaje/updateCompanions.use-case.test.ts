import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCompanions from "./updateCompanions.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("UpdateCompanions", () => {
  let personajeServiceMock: {
    updateCompanions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      updateCompanions: vi.fn(),
    };
  });

  it("should delegate to personajeService.updateCompanions", async () => {
    const useCase = new UpdateCompanions(personajeServiceMock as any);
    const companions = [{ name: "Aldric", role: "Mayordomo" }];
    const expected = {
      companions: [{ id: "507f1f77bcf86cd799439011", name: "Aldric", role: "Mayordomo" }],
    };
    personajeServiceMock.updateCompanions.mockResolvedValue(expected);

    const result = await useCase.execute("char1", companions, "user1");

    expect(personajeServiceMock.updateCompanions).toHaveBeenCalledWith(
      "char1",
      companions,
      "user1"
    );
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new UpdateCompanions(personajeServiceMock as any);
    personajeServiceMock.updateCompanions.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute("char1", [], "user1")).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new UpdateCompanions(personajeServiceMock as any);
    personajeServiceMock.updateCompanions.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute("char1", [], "user2")).rejects.toThrow(AppError);
    await expect(useCase.execute("char1", [], "user2")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
