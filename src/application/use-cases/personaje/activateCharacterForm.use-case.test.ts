import { describe, it, expect, vi } from "vitest";
import ActivateCharacterForm from "./activateCharacterForm.use-case";
import DeactivateCharacterForm from "./deactivateCharacterForm.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("ActivateCharacterForm", () => {
  it("delegates to personajeService.activateForm", async () => {
    const personajeService = { activateForm: vi.fn().mockResolvedValue({ id: "char1" }) };
    const useCase = new ActivateCharacterForm(personajeService as never);
    const data = { id: "char1", formId: "form1", userId: "user1" };

    await expect(useCase.execute(data)).resolves.toEqual({ id: "char1" });
    expect(personajeService.activateForm).toHaveBeenCalledWith(data);
  });

  it("propagates validation errors", async () => {
    const personajeService = {
      activateForm: vi.fn().mockRejectedValue(new ValidationError("Solo se puede activar una forma propia o de objetivo"))
    };
    const useCase = new ActivateCharacterForm(personajeService as never);

    await expect(useCase.execute({ id: "char1", formId: "form1", userId: "user1" }))
      .rejects.toThrow("Solo se puede activar una forma propia o de objetivo");
  });
});

describe("DeactivateCharacterForm", () => {
  it("delegates to personajeService.deactivateForm", async () => {
    const personajeService = { deactivateForm: vi.fn().mockResolvedValue({ id: "char1" }) };
    const useCase = new DeactivateCharacterForm(personajeService as never);
    const data = { id: "char1", formId: "form1", userId: "user1" };

    await expect(useCase.execute(data)).resolves.toEqual({ id: "char1" });
    expect(personajeService.deactivateForm).toHaveBeenCalledWith(data);
  });
});
