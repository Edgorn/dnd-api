import { describe, it, expect, vi, beforeEach } from "vitest";
import GenerateCharacterPdf from "./generateCharacterPdf.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";
import { CharacterApi } from "../../../domain/types/character.types";

describe("GenerateCharacterPdf", () => {
  let characterServiceMock: {
    getByIdForExport: ReturnType<typeof vi.fn>;
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
  } as unknown as CharacterApi;

  beforeEach(() => {
    characterServiceMock = {
      getByIdForExport: vi.fn(),
    };
    userRepositoryMock = {
      getUserName: vi.fn(),
    };
    pdfGeneratorMock = {
      generate: vi.fn(),
    };
  });

  it("should load character with owner id and generate PDF bytes", async () => {
    const useCase = new GenerateCharacterPdf(
      characterServiceMock as never,
      userRepositoryMock as never,
      pdfGeneratorMock as never
    );
    const pdfBytes = new Uint8Array([37, 80, 68, 70]);

    characterServiceMock.getByIdForExport.mockResolvedValue({
      character: characterStub,
      ownerId: "owner-user",
    });
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockResolvedValue(pdfBytes);

    const result = await useCase.execute("507f1f77bcf86cd799439011", "user1");

    expect(characterServiceMock.getByIdForExport).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "user1",
      { applyActiveTraits: false }
    );
    expect(userRepositoryMock.getUserName).toHaveBeenCalledWith("owner-user");
    expect(pdfGeneratorMock.generate).toHaveBeenCalledWith(characterStub, "Edgar");
    expect(result).toEqual(pdfBytes);
  });

  it("should use owner display name when requester is not the character owner", async () => {
    const useCase = new GenerateCharacterPdf(
      characterServiceMock as never,
      userRepositoryMock as never,
      pdfGeneratorMock as never
    );
    const pdfBytes = new Uint8Array([37, 80, 68, 70]);

    characterServiceMock.getByIdForExport.mockResolvedValue({
      character: characterStub,
      ownerId: "player-owner",
    });
    userRepositoryMock.getUserName.mockResolvedValue("Alice");
    pdfGeneratorMock.generate.mockResolvedValue(pdfBytes);

    await useCase.execute("507f1f77bcf86cd799439011", "master-user");

    expect(userRepositoryMock.getUserName).toHaveBeenCalledWith("player-owner");
    expect(pdfGeneratorMock.generate).toHaveBeenCalledWith(characterStub, "Alice");
  });

  it("should propagate NotFoundError when character cannot be loaded", async () => {
    const useCase = new GenerateCharacterPdf(
      characterServiceMock as never,
      userRepositoryMock as never,
      pdfGeneratorMock as never
    );
    characterServiceMock.getByIdForExport.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      NotFoundError
    );
    expect(pdfGeneratorMock.generate).not.toHaveBeenCalled();
  });

  it("should propagate errors from the PDF generator", async () => {
    const useCase = new GenerateCharacterPdf(
      characterServiceMock as never,
      userRepositoryMock as never,
      pdfGeneratorMock as never
    );
    characterServiceMock.getByIdForExport.mockResolvedValue({
      character: characterStub,
      ownerId: "owner-user",
    });
    userRepositoryMock.getUserName.mockResolvedValue("Edgar");
    pdfGeneratorMock.generate.mockRejectedValue(new Error("PDF template missing"));

    await expect(useCase.execute("507f1f77bcf86cd799439011", "user1")).rejects.toThrow(
      "PDF template missing"
    );
  });
});
