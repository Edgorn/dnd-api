import { describe, it, expect } from "vitest";
import {
  buildPersonajeMoneyItems,
  getOrphanUnitIds,
  parseCharacterMoneyQuantities,
} from "./characterMoney";
import { CoinApi } from "../domain/types/coin.types";

const coin = (id: string, abbreviation: string, name: string): CoinApi => ({
  id,
  ruleset: "dnd5e",
  name,
  abbreviation,
  isBase: abbreviation === "cp",
  multiplier: 1,
  weight: 0.01,
  color: "#000000",
  deletedAt: null,
});

const copper = coin("coin-copper", "cp", "Cobre");
const silver = coin("coin-silver", "sp", "Plata");
const gold = coin("coin-gold", "gp", "Oro");
const systemCoins = [copper, silver, gold];

describe("parseCharacterMoneyQuantities", () => {
  it("parses modern array format", () => {
    const map = parseCharacterMoneyQuantities([
      { unit: "coin-gold", quantity: 10 },
    ]);
    expect(map.get("coin-gold")).toBe(10);
  });

  it("parses single object format", () => {
    const map = parseCharacterMoneyQuantities({ unit: "coin-silver", quantity: 3 });
    expect(map.get("coin-silver")).toBe(3);
  });

  it("parses legacy object format against system coins", () => {
    const map = parseCharacterMoneyQuantities({ pc: 5, po: 2 }, systemCoins);
    expect(map.get("coin-copper")).toBe(5);
    expect(map.get("coin-gold")).toBe(2);
  });

  it("returns empty map for absent money", () => {
    expect(parseCharacterMoneyQuantities(undefined).size).toBe(0);
    expect(parseCharacterMoneyQuantities(null).size).toBe(0);
  });
});

describe("buildPersonajeMoneyItems", () => {
  it("includes all system coins with zero fill", () => {
    const quantities = new Map([["coin-gold", 10]]);
    const result = buildPersonajeMoneyItems(systemCoins, quantities);

    expect(result).toHaveLength(3);
    expect(result.find(c => c.id === "coin-gold")?.quantity).toBe(10);
    expect(result.find(c => c.id === "coin-copper")?.quantity).toBe(0);
    expect(result.find(c => c.id === "coin-silver")?.quantity).toBe(0);
  });

  it("returns all system coins with quantity 0 when money is empty", () => {
    const result = buildPersonajeMoneyItems(systemCoins, new Map());

    expect(result).toHaveLength(3);
    expect(result.every(c => c.quantity === 0)).toBe(true);
  });

  it("appends orphan coins not in system catalog", () => {
    const orphan = coin("coin-orphan", "xx", "Moneda huérfana");
    const quantities = new Map([
      ["coin-gold", 5],
      ["coin-orphan", 99],
    ]);
    const result = buildPersonajeMoneyItems(systemCoins, quantities, [orphan]);

    expect(result).toHaveLength(4);
    expect(result.at(-1)).toMatchObject({ id: "coin-orphan", quantity: 99 });
  });
});

describe("getOrphanUnitIds", () => {
  it("returns unit ids not present in system coins", () => {
    const quantities = new Map([
      ["coin-gold", 1],
      ["coin-orphan", 2],
    ]);
    expect(getOrphanUnitIds(quantities, systemCoins)).toEqual(["coin-orphan"]);
  });
});
