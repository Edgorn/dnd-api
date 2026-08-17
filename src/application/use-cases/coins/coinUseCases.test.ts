import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCoin from "./createCoin.use-case";
import UpdateCoin from "./updateCoin.use-case";
import GetCoins from "./getCoins.use-case";
import GetCoinById from "./getCoinById.use-case";
import DeleteCoin from "./deleteCoin.use-case";
import RestoreCoin from "./restoreCoin.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";
import ICoinRepository from "../../../domain/repositories/ICoinRepository";

describe("Coin Use Cases", () => {
  let coinRepositoryMock: ICoinRepository;

  beforeEach(() => {
    coinRepositoryMock = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn(),
      getBySystems: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
    };
  });

  describe("CreateCoin", () => {
    it("should create coin successfully", async () => {
      const useCase = new CreateCoin(coinRepositoryMock);
      const input = {
        ruleset: "dnd5e",
        name: "Pieza de Oro",
        abbreviation: "po",
        isBase: true,
        multiplier: 1,
        weight: 0.02,
        color: "#FFD700",
      };
      const expectedOutput = { id: "coin1", ...input, deletedAt: null };
      vi.mocked(coinRepositoryMock.create).mockResolvedValue(expectedOutput);

      const result = await useCase.execute(input);

      expect(result).toEqual(expectedOutput);
      expect(coinRepositoryMock.create).toHaveBeenCalledWith(input);
    });
  });

  describe("UpdateCoin", () => {
    it("should update coin successfully", async () => {
      const useCase = new UpdateCoin(coinRepositoryMock);
      const input = {
        id: "coin1",
        name: "Pieza de Oro Modificada",
        weight: 0.025,
        color: "#FFDF00",
      };
      const expectedOutput = {
        id: "coin1",
        ruleset: "dnd5e",
        name: "Pieza de Oro Modificada",
        abbreviation: "po",
        isBase: true,
        multiplier: 1,
        weight: 0.025,
        color: "#FFDF00",
        deletedAt: null,
      };
      vi.mocked(coinRepositoryMock.update).mockResolvedValue(expectedOutput);

      const result = await useCase.execute(input);

      expect(result).toEqual(expectedOutput);
      expect(coinRepositoryMock.update).toHaveBeenCalledWith(input);
    });
  });

  describe("GetCoins", () => {
    it("should get coins by systems", async () => {
      const useCase = new GetCoins(coinRepositoryMock);
      const expectedCoins = [
        {
          id: "coin1",
          ruleset: "dnd5e",
          name: "Pieza de Oro",
          abbreviation: "po",
          isBase: true,
          multiplier: 1,
          weight: 0.02,
          color: "#FFD700",
          deletedAt: null,
        },
      ];
      vi.mocked(coinRepositoryMock.getBySystems).mockResolvedValue(expectedCoins);

      const result = await useCase.execute(["dnd5e"]);

      expect(result).toEqual(expectedCoins);
      expect(coinRepositoryMock.getBySystems).toHaveBeenCalledWith(["dnd5e"], false);
    });
  });

  describe("GetCoinById", () => {
    it("should return coin if found", async () => {
      const useCase = new GetCoinById(coinRepositoryMock);
      const expectedCoin = {
        id: "coin1",
        ruleset: "dnd5e",
        name: "Pieza de Oro",
        abbreviation: "po",
        isBase: true,
        multiplier: 1,
        weight: 0.02,
        color: "#FFD700",
        deletedAt: null,
      };
      vi.mocked(coinRepositoryMock.getById).mockResolvedValue(expectedCoin);

      const result = await useCase.execute("coin1");

      expect(result).toEqual(expectedCoin);
      expect(coinRepositoryMock.getById).toHaveBeenCalledWith("coin1");
    });

    it("should throw NotFoundError if not found", async () => {
      const useCase = new GetCoinById(coinRepositoryMock);
      vi.mocked(coinRepositoryMock.getById).mockResolvedValue(null);

      await expect(useCase.execute("coin_not_found")).rejects.toThrow(NotFoundError);
    });
  });

  describe("DeleteCoin", () => {
    it("should soft delete coin successfully", async () => {
      const useCase = new DeleteCoin(coinRepositoryMock);
      vi.mocked(coinRepositoryMock.softDelete).mockResolvedValue();

      await useCase.execute("coin1");

      expect(coinRepositoryMock.softDelete).toHaveBeenCalledWith("coin1");
    });
  });

  describe("RestoreCoin", () => {
    it("should restore coin successfully", async () => {
      const useCase = new RestoreCoin(coinRepositoryMock);
      vi.mocked(coinRepositoryMock.restore).mockResolvedValue();

      await useCase.execute("coin1");

      expect(coinRepositoryMock.restore).toHaveBeenCalledWith("coin1");
    });
  });
});
