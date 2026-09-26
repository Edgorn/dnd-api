import { describe, it, expect, vi, beforeEach } from "vitest";
import GenerateCharacterPdf from "./generateCharacterPdf.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";
import { PersonajeApi } from "../../../domain/types/personajes.types";

describe("GenerateCharacterPdf", () => {
  let personajeServiceMock: {
    consultarPersonaje: ReturnType<typeof vi.fn>;
    getCampaignLink: ReturnType<typeof vi.fn>;
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
      getCampaignLink: vi.fn(),
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
    personajeServiceMock.getCampaignLink.mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      userId: "owner-user",
      campaign: null,
    });
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockResolvedValue(pdfBytes);

    const result = await useCase.execute("507f1f77bcf86cd799439011", "user1");

    expect(personajeServiceMock.consultarPersonaje).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "user1"
    );
    expect(personajeServiceMock.getCampaignLink).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(userRepositoryMock.getUserName).toHaveBeenCalledWith("owner-user");
    expect(pdfGeneratorMock.generate).toHaveBeenCalledWith(characterStub, "Edgar");
    expect(result).toEqual(pdfBytes);
  });

  it("should use owner display name when requester is not the character owner", async () => {
    const useCase = new GenerateCharacterPdf(
      personajeServiceMock as any,
      userRepositoryMock as any,
      pdfGeneratorMock as any
    );
    const pdfBytes = new Uint8Array([37, 80, 68, 70]);

    personajeServiceMock.consultarPersonaje.mockResolvedValue(characterStub);
    personajeServiceMock.getCampaignLink.mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      userId: "player-owner",
      campaign: "campaign-1",
    });
    userRepositoryMock.getUserName.mockResolvedValue("Alice");
    pdfGeneratorMock.generate.mockResolvedValue(pdfBytes);

    await useCase.execute("507f1f77bcf86cd799439011", "master-user");

    expect(userRepositoryMock.getUserName).toHaveBeenCalledWith("player-owner");
    expect(pdfGeneratorMock.generate).toHaveBeenCalledWith(characterStub, "Alice");
  });

  it("should throw NotFoundError when campaign link is missing after character load", async () => {
    const useCase = new GenerateCharacterPdf(
      personajeServiceMock as any,
      userRepositoryMock as any,
      pdfGeneratorMock as any
    );
    personajeServiceMock.consultarPersonaje.mockResolvedValue(characterStub);
    personajeServiceMock.getCampaignLink.mockResolvedValue(null);

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      NotFoundError
    );
    expect(userRepositoryMock.getUserName).not.toHaveBeenCalled();
    expect(pdfGeneratorMock.generate).not.toHaveBeenCalled();
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
    personajeServiceMock.getCampaignLink.mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      userId: "owner-user",
      campaign: null,
    });
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockRejectedValue(new Error("PDF template missing"));

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      "PDF template missing"
    );
  });
});
