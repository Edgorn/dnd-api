import { describe, it, expect, vi, beforeEach } from "vitest";
import BindWeaponBond from "./bindWeaponBond.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("BindWeaponBond", () => {
  let characterServiceMock: {
    bindWeaponBond: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      bindWeaponBond: vi.fn(),
    };
  });

  it("should delegate to characterService.bindWeaponBond", async () => {
    const useCase = new BindWeaponBond(characterServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      isBond: true,
    };
    const expected = {
      full: { id: "char1" },
      basic: { id: "char1" },
    };
    characterServiceMock.bindWeaponBond.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(characterServiceMock.bindWeaponBond).toHaveBeenCalledWith(input);
  });

  it("should propagate ValidationError when the item is not magic", async () => {
    const useCase = new BindWeaponBond(characterServiceMock as any);
    characterServiceMock.bindWeaponBond.mockRejectedValue(
      new ValidationError("Solo se puede vincular equipamiento mágico")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        isBond: true,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should propagate NotFoundError when the instance does not exist", async () => {
    const useCase = new BindWeaponBond(characterServiceMock as any);
    characterServiceMock.bindWeaponBond.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        isBond: false,
      })
    ).rejects.toThrow(NotFoundError);
  });
});
