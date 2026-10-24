import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCharacterFlavor from "./updateCharacterFlavor.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("UpdateCharacterFlavor", () => {
  let personajeServiceMock: {
    updateFlavor: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      updateFlavor: vi.fn(),
    };
  });

  it("should delegate to personajeService.updateFlavor", async () => {
    const useCase = new UpdateCharacterFlavor(personajeServiceMock as any);
    const input = { id: "char1", userId: "user1", img: "https://img" };
    const expected = {
      img: "https://img",
      appearance: { age: 20, height: 170, weight: 70, eyes: "verdes", hair: "negro", skin: "clara" },
      background: {
        name: "Soldado",
        type: { name: "origen", values: [] },
        history: ["Sirvió en la milicia."],
        alignment: "LN",
        personality: [],
        ideals: [],
        bonds: [],
        flaws: [],
        god: "",
      },
    };
    personajeServiceMock.updateFlavor.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(personajeServiceMock.updateFlavor).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new UpdateCharacterFlavor(personajeServiceMock as any);
    personajeServiceMock.updateFlavor.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(
      useCase.execute({ id: "char1", userId: "user1", img: "" })
    ).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new UpdateCharacterFlavor(personajeServiceMock as any);
    personajeServiceMock.updateFlavor.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(
      useCase.execute({ id: "char1", userId: "user2", img: "" })
    ).rejects.toThrow(AppError);
    await expect(
      useCase.execute({ id: "char1", userId: "user2", img: "" })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
