import { describe, expect, it } from "vitest";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";
import {
  applyBindWeaponBond,
  applyDismissWeaponBond,
  applyManifestWeaponBond,
  applySummonWeaponBond,
  applyUnbindWeaponBond,
  clearWeaponBondOnTraitLost,
  grantsWeaponBondProficiency,
  ownedWeaponBond,
  weaponBondFormRejection,
  resolveWeaponBondUse
} from "./weaponBond";

function row(overrides: Partial<PersonajeEquipmentMongo> & Pick<PersonajeEquipmentMongo, "instanceId">): PersonajeEquipmentMongo {
  return {
    equipmentId: "eq1",
    quantity: 1,
    equipped: false,
    isMagic: false,
    isBond: false,
    isFavorite: false,
    ...overrides
  };
}

describe("ownedWeaponBond", () => {
  it("returns the first weaponBond config", () => {
    const config = { melee: true, grantsProficiency: true, magical: true };
    expect(ownedWeaponBond([{ weaponBond: config }])).toEqual(config);
    expect(ownedWeaponBond([{}])).toBeUndefined();
  });
});

describe("resolveWeaponBondUse", () => {
  it("asks for a form when there is no bond", () => {
    expect(resolveWeaponBondUse([row({ instanceId: "a" })])).toEqual({ kind: "need-form" });
  });

  it("manifests a stored bound weapon", () => {
    expect(resolveWeaponBondUse([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound", bondStored: true })
    ])).toEqual({ kind: "manifest", instanceId: "a" });
  });

  it("rejects a bound weapon that is already out", () => {
    expect(resolveWeaponBondUse([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound" })
    ])).toEqual({ kind: "already-manifest", instanceId: "a" });
  });

  it("replaces a summoned weapon with a new form", () => {
    expect(resolveWeaponBondUse([
      row({ instanceId: "a", isBond: true, bondOrigin: "summoned" })
    ])).toEqual({ kind: "need-form" });
  });
});

describe("applySummonWeaponBond", () => {
  it("creates a summoned row and drops the previous summoned form", () => {
    const previous = row({
      instanceId: "old",
      isBond: true,
      bondOrigin: "summoned",
      isMagic: true,
      equipped: true
    });
    const next = row({
      instanceId: "new",
      equipmentId: "axe",
      isBond: true,
      bondOrigin: "summoned",
      isMagic: true,
      equipped: true
    });
    const result = applySummonWeaponBond([previous, row({ instanceId: "pack" })], next);
    expect(result.inventory.map(item => item.instanceId)).toEqual(["pack", "new"]);
  });
});

describe("applyManifestWeaponBond", () => {
  it("clears bondStored on the bound row", () => {
    const result = applyManifestWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound", bondStored: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0].bondStored).toBeUndefined();
    expect(result.instanceId).toBe("a");
  });
});

describe("applyDismissWeaponBond", () => {
  it("deletes a summoned weapon", () => {
    const result = applyDismissWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "summoned", equipped: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory).toEqual([]);
  });

  it("stores a bound weapon", () => {
    const result = applyDismissWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound", equipped: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0]).toMatchObject({
      instanceId: "a",
      isBond: true,
      bondOrigin: "bound",
      bondStored: true,
      equipped: false
    });
  });

  it("fails when nothing is manifested", () => {
    expect(applyDismissWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound", bondStored: true })
    ]).ok).toBe(false);
  });
});

describe("applyBindWeaponBond", () => {
  it("binds one magic weapon and destroys a summoned row", () => {
    const result = applyBindWeaponBond([
      row({ instanceId: "summon", isBond: true, bondOrigin: "summoned", isMagic: true }),
      row({ instanceId: "sword", isMagic: true })
    ], "sword");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory).toHaveLength(1);
    expect(result.inventory[0]).toMatchObject({
      instanceId: "sword",
      isBond: true,
      bondOrigin: "bound",
      bondStored: false
    });
  });

  it("clears a previous bound row", () => {
    const result = applyBindWeaponBond([
      row({ instanceId: "old", isBond: true, bondOrigin: "bound", isMagic: true }),
      row({ instanceId: "new", isMagic: true })
    ], "new");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory.find(item => item.instanceId === "old")?.isBond).toBe(false);
    expect(result.inventory.find(item => item.instanceId === "new")?.bondOrigin).toBe("bound");
  });

  it("rejects binding a summoned instance", () => {
    const result = applyBindWeaponBond([
      row({ instanceId: "summon", isBond: true, bondOrigin: "summoned" })
    ], "summon");
    expect(result.ok).toBe(false);
  });
});

describe("applyUnbindWeaponBond", () => {
  it("clears flags on a bound weapon", () => {
    const result = applyUnbindWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "bound", bondStored: true, isMagic: true })
    ], "a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0].isBond).toBe(false);
    expect(result.inventory[0].bondOrigin).toBeUndefined();
    expect(result.inventory[0].bondStored).toBeUndefined();
  });

  it("rejects unbinding a summoned weapon", () => {
    expect(applyUnbindWeaponBond([
      row({ instanceId: "a", isBond: true, bondOrigin: "summoned" })
    ], "a").ok).toBe(false);
  });
});

describe("clearWeaponBondOnTraitLost", () => {
  it("deletes summoned rows and unbinds stored weapons", () => {
    const result = clearWeaponBondOnTraitLost([
      row({ instanceId: "summon", isBond: true, bondOrigin: "summoned" }),
      row({ instanceId: "bound", isBond: true, bondOrigin: "bound", bondStored: true, isMagic: true }),
      row({ instanceId: "pack" })
    ]);
    expect(result.map(item => item.instanceId)).toEqual(["bound", "pack"]);
    expect(result[0].isBond).toBe(false);
    expect(result[0].bondStored).toBeUndefined();
  });
});

describe("weaponBondFormRejection", () => {
  const config = { melee: true, grantsProficiency: true, magical: true };

  it("rejects missing weapons and ranged forms", () => {
    expect(weaponBondFormRejection(config, null)).toMatch(/arma/);
    expect(weaponBondFormRejection(config, { weapon: { range: "A distancia" } })).toMatch(/cuerpo a cuerpo/);
    expect(weaponBondFormRejection(config, { weapon: { range: "Cuerpo a cuerpo" } })).toBeUndefined();
  });
});

describe("grantsWeaponBondProficiency", () => {
  it("is true only for a manifested bond", () => {
    expect(grantsWeaponBondProficiency({ isBond: true, bondStored: false }, true)).toBe(true);
    expect(grantsWeaponBondProficiency({ isBond: true, bondStored: true }, true)).toBe(false);
    expect(grantsWeaponBondProficiency({ isBond: true }, false)).toBe(false);
  });
});
