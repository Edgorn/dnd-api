import { describe, it, expect, vi, beforeEach } from "vitest";
import RestCharacter from "./restCharacter.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("RestCharacter", () => {
  let characterServiceMock: {
    restCharacter: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      restCharacter: vi.fn()
    };
  });

  const input = {
    id: "char1",
    type: "longRest" as const,
    userId: "user1",
    traitChoices: { "infernal-resilience": { resistance: ["fire"] } },
    hitDiceSpends: [{ classId: "507f1f77bcf86cd799439011", count: 2, hpGained: 14 }]
  };

  it("delegates to characterService.restCharacter", async () => {
    const useCase = new RestCharacter(characterServiceMock as never);
    const expected = { id: "char1", traitResources: [], activeTraitIds: [] };
    characterServiceMock.restCharacter.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.restCharacter).toHaveBeenCalledWith(input);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new RestCharacter(characterServiceMock as never);
    characterServiceMock.restCharacter.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it("propagates when the system has no rest rules", async () => {
    const useCase = new RestCharacter(characterServiceMock as never);
    characterServiceMock.restCharacter.mockRejectedValue(
      new ValidationError("Este sistema no define descansos")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "Este sistema no define descansos",
      statusCode: 400
    });
  });

  it("propagates when the rest does not allow hit dice spends", async () => {
    const useCase = new RestCharacter(characterServiceMock as never);
    characterServiceMock.restCharacter.mockRejectedValue(
      new ValidationError("Este descanso no admite gastar dados de golpe")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "Este descanso no admite gastar dados de golpe",
      statusCode: 400
    });
  });

  it("propagates when the rest type is not in the catalog", async () => {
    const useCase = new RestCharacter(characterServiceMock as never);
    characterServiceMock.restCharacter.mockRejectedValue(
      new ValidationError("Tipo de descanso inválido")
    );

    await expect(useCase.execute({ ...input, type: "watch" })).rejects.toMatchObject({
      message: "Tipo de descanso inválido",
      statusCode: 400
    });
  });
});
