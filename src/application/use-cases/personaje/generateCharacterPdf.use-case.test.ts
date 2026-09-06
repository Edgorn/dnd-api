import { describe, it, expect, vi, beforeEach } from "vitest";
import GenerateCharacterPdf from "./generateCharacterPdf.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";
import { PersonajeApi } from "../../../domain/types/personajes.types";

describe("GenerateCharacterPdf", () => {
  let personajeServiceMock: {
    consultarPersonaje: ReturnType<typeof vi.fn>;
  };
  let userRepositoryMock: {
    getUserName: ReturnType<typeof vi.fn>;
  };
  let pdfGeneratorMock: {
    generate: ReturnType<typeof vi.fn>;
  };

  const characterStub = {
    id: "507f1f77bcf86cd799439011",
    name: "Aragorn",
  } as unknown as PersonajeApi;

  beforeEach(() => {
    personajeServiceMock = {
      consultarPersonaje: vi.fn(),
    };
    userRepositoryMock = {
      getUserName: vi.fn(),
    };
    pdfGeneratorMock = {
      generate: vi.fn(),
    };
  });

  it("should load character, resolve player name and generate PDF bytes", async () => {
    const useCase = new GenerateCharacterPdf(
      personajeServiceMock as any,
      userRepositoryMock as any,
      pdfGeneratorMock as any
    );
    const pdfBytes = new Uint8Array([37, 80, 68, 70]);

    personajeServiceMock.consultarPersonaje.mockResolvedValue(characterStub);
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockResolvedValue(pdfBytes);

    const result = await useCase.execute("507f1f77bcf86cd799439011", "user1");

    expect(personajeServiceMock.consultarPersonaje).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "user1"
    );
    expect(userRepositoryMock.getUserName).toHaveBeenCalledWith("user1");
    expect(pdfGeneratorMock.generate).toHaveBeenCalledWith(characterStub, "Edgar");
    expect(result).toEqual(pdfBytes);
  });

  it("should propagate NotFoundError when character cannot be loaded", async () => {
    const useCase = new GenerateCharacterPdf(
      personajeServiceMock as any,
      userRepositoryMock as any,
      pdfGeneratorMock as any
    );
    personajeServiceMock.consultarPersonaje.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      NotFoundError
    );
    expect(pdfGeneratorMock.generate).not.toHaveBeenCalled();
  });

  it("should propagate errors from the PDF generator", async () => {
    const useCase = new GenerateCharacterPdf(
      personajeServiceMock as any,
      userRepositoryMock as any,
      pdfGeneratorMock as any
    );
    personajeServiceMock.consultarPersonaje.mockResolvedValue(characterStub);
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockRejectedValue(new Error("PDF template missing"));

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      "PDF template missing"
    );
  });
});
