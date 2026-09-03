import { CoinApi } from "../domain/types/coin.types";

export type PersonajeMoneyItem = { quantity: number } & CoinApi;

const LEGACY_COIN_KEYS: { key: string; abbrs: string[]; names: string[] }[] = [
  { key: "pc", abbrs: ["pc", "cp"], names: ["cobre", "copper"] },
  { key: "pp", abbrs: ["pp", "sp"], names: ["plata", "silver"] },
  { key: "pe", abbrs: ["pe", "ep"], names: ["electrum"] },
  { key: "po", abbrs: ["po", "gp"], names: ["oro", "gold"] },
  { key: "ppt", abbrs: ["ppt"], names: ["platino", "platinum"] },
];

function findCoinByLegacyKey(
  coins: CoinApi[],
  legacy: (typeof LEGACY_COIN_KEYS)[number]
): CoinApi | undefined {
  return coins.find(
    c =>
      legacy.abbrs.includes(c.abbreviation.toLowerCase()) ||
      legacy.names.some(n => c.name.toLowerCase().includes(n))
  );
}

export function parseCharacterMoneyQuantities(
  raw: unknown,
  legacySystemCoins: CoinApi[] = []
): Map<string, number> {
  const quantities = new Map<string, number>();

  if (!raw) return quantities;

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (entry?.unit) {
        quantities.set(entry.unit, entry.quantity ?? 0);
      }
    }
    return quantities;
  }

  if (typeof raw === "object" && raw !== null && "unit" in raw && "quantity" in raw) {
    const single = raw as { unit: string; quantity: number };
    if (single.unit) {
      quantities.set(single.unit, single.quantity ?? 0);
    }
    return quantities;
  }

  if (typeof raw === "object" && raw !== null) {
    for (const legacy of LEGACY_COIN_KEYS) {
      const qty = (raw as Record<string, unknown>)[legacy.key];
      if (typeof qty === "number") {
        const coin = findCoinByLegacyKey(legacySystemCoins, legacy);
        if (coin) {
          quantities.set(coin.id, qty);
        }
      }
    }
  }

  return quantities;
}

export function getOrphanUnitIds(
  quantitiesByUnit: Map<string, number>,
  systemCoins: CoinApi[]
): string[] {
  const systemIds = new Set(systemCoins.map(c => c.id));
  return [...quantitiesByUnit.keys()].filter(id => !systemIds.has(id));
}

export function buildPersonajeMoneyItems(
  systemCoins: CoinApi[],
  quantitiesByUnit: Map<string, number>,
  orphanCoins: CoinApi[] = []
): PersonajeMoneyItem[] {
  const systemCoinIds = new Set(systemCoins.map(c => c.id));
  const result: PersonajeMoneyItem[] = systemCoins.map(coin => ({
    quantity: quantitiesByUnit.get(coin.id) ?? 0,
    ...coin,
  }));

  for (const [unitId, quantity] of quantitiesByUnit) {
    if (systemCoinIds.has(unitId)) continue;
    const orphan = orphanCoins.find(c => c.id === unitId);
    if (orphan) {
      result.push({ quantity, ...orphan });
    }
  }

  return result;
}
