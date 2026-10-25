import { describe, it, expect, vi } from "vitest";
import ActivateCharacterForm from "./activateCharacterForm.use-case";
import DeactivateCharacterForm from "./deactivateCharacterForm.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("ActivateCharacterForm", () => {
  it("delegates to characterService.activateForm", async () => {
    const characterService = { activateForm: vi.fn().mockResolvedValue({ id: "char1" }) };
    const useCase = new ActivateCharacterForm(characterService as never);
    const data = { id: "char1", formId: "form1", userId: "user1" };

    await expect(useCase.execute(data)).resolves.toEqual({ id: "char1" });
    expect(characterService.activateForm).toHaveBeenCalledWith(data);
  });

  it("propagates validation errors", async () => {
    const characterService = {
      activateForm: vi.fn().mockRejectedValue(new ValidationError("Solo se puede activar una forma propia o de objetivo"))
    };
    const useCase = new ActivateCharacterForm(characterService as never);

    await expect(useCase.execute({ id: "char1", formId: "form1", userId: "user1" }))
      .rejects.toThrow("Solo se puede activar una forma propia o de objetivo");
  });
});

describe("DeactivateCharacterForm", () => {
  it("delegates to characterService.deactivateForm", async () => {
    const characterService = { deactivateForm: vi.fn().mockResolvedValue({ id: "char1" }) };
    const useCase = new DeactivateCharacterForm(characterService as never);
    const data = { id: "char1", formId: "form1", userId: "user1" };

    await expect(useCase.execute(data)).resolves.toEqual({ id: "char1" });
    expect(characterService.deactivateForm).toHaveBeenCalledWith(data);
  });
});
