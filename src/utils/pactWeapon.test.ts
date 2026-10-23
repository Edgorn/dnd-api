import { describe, expect, it } from "vitest";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";
import {
  applyBindPactWeapon,
  applyDismissPactWeapon,
  applyManifestPactWeapon,
  applySummonPactWeapon,
  applyUnbindPactWeapon,
  clearPactWeaponOnTraitLost,
  grantsPactWeaponProficiency,
  ownedPactWeapon,
  pactWeaponFormRejection,
  resolvePactWeaponUse
} from "./pactWeapon";

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

describe("ownedPactWeapon", () => {
  it("returns the first pactWeapon config", () => {
    const config = { melee: true, grantsProficiency: true, magical: true };
    expect(ownedPactWeapon([{ pactWeapon: config }])).toEqual(config);
    expect(ownedPactWeapon([{}])).toBeUndefined();
  });
});

describe("resolvePactWeaponUse", () => {
  it("asks for a form when there is no bond", () => {
    expect(resolvePactWeaponUse([row({ instanceId: "a" })])).toEqual({ kind: "need-form" });
  });

  it("manifests a stored bound weapon", () => {
    expect(resolvePactWeaponUse([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound", pactStored: true })
    ])).toEqual({ kind: "manifest", instanceId: "a" });
  });

  it("rejects a bound weapon that is already out", () => {
    expect(resolvePactWeaponUse([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound" })
    ])).toEqual({ kind: "already-manifest", instanceId: "a" });
  });

  it("replaces a summoned weapon with a new form", () => {
    expect(resolvePactWeaponUse([
      row({ instanceId: "a", isBond: true, pactOrigin: "summoned" })
    ])).toEqual({ kind: "need-form" });
  });
});

describe("applySummonPactWeapon", () => {
  it("creates a summoned row and drops the previous summoned form", () => {
    const previous = row({
      instanceId: "old",
      isBond: true,
      pactOrigin: "summoned",
      isMagic: true,
      equipped: true
    });
    const next = row({
      instanceId: "new",
      equipmentId: "axe",
      isBond: true,
      pactOrigin: "summoned",
      isMagic: true,
      equipped: true
    });
    const result = applySummonPactWeapon([previous, row({ instanceId: "pack" })], next);
    expect(result.inventory.map(item => item.instanceId)).toEqual(["pack", "new"]);
  });
});

describe("applyManifestPactWeapon", () => {
  it("clears pactStored on the bound row", () => {
    const result = applyManifestPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound", pactStored: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0].pactStored).toBeUndefined();
    expect(result.instanceId).toBe("a");
  });
});

describe("applyDismissPactWeapon", () => {
  it("deletes a summoned weapon", () => {
    const result = applyDismissPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "summoned", equipped: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory).toEqual([]);
  });

  it("stores a bound weapon", () => {
    const result = applyDismissPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound", equipped: true })
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0]).toMatchObject({
      instanceId: "a",
      isBond: true,
      pactOrigin: "bound",
      pactStored: true,
      equipped: false
    });
  });

  it("fails when nothing is manifested", () => {
    expect(applyDismissPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound", pactStored: true })
    ]).ok).toBe(false);
  });
});

describe("applyBindPactWeapon", () => {
  it("binds one magic weapon and destroys a summoned row", () => {
    const result = applyBindPactWeapon([
      row({ instanceId: "summon", isBond: true, pactOrigin: "summoned", isMagic: true }),
      row({ instanceId: "sword", isMagic: true })
    ], "sword");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory).toHaveLength(1);
    expect(result.inventory[0]).toMatchObject({
      instanceId: "sword",
      isBond: true,
      pactOrigin: "bound",
      pactStored: false
    });
  });

  it("clears a previous bound row", () => {
    const result = applyBindPactWeapon([
      row({ instanceId: "old", isBond: true, pactOrigin: "bound", isMagic: true }),
      row({ instanceId: "new", isMagic: true })
    ], "new");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory.find(item => item.instanceId === "old")?.isBond).toBe(false);
    expect(result.inventory.find(item => item.instanceId === "new")?.pactOrigin).toBe("bound");
  });

  it("rejects binding a summoned instance", () => {
    const result = applyBindPactWeapon([
      row({ instanceId: "summon", isBond: true, pactOrigin: "summoned" })
    ], "summon");
    expect(result.ok).toBe(false);
  });
});

describe("applyUnbindPactWeapon", () => {
  it("clears flags on a bound weapon", () => {
    const result = applyUnbindPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "bound", pactStored: true, isMagic: true })
    ], "a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inventory[0].isBond).toBe(false);
    expect(result.inventory[0].pactOrigin).toBeUndefined();
    expect(result.inventory[0].pactStored).toBeUndefined();
  });

  it("rejects unbinding a summoned weapon", () => {
    expect(applyUnbindPactWeapon([
      row({ instanceId: "a", isBond: true, pactOrigin: "summoned" })
    ], "a").ok).toBe(false);
  });
});

describe("clearPactWeaponOnTraitLost", () => {
  it("deletes summoned rows and unbinds stored weapons", () => {
    const result = clearPactWeaponOnTraitLost([
      row({ instanceId: "summon", isBond: true, pactOrigin: "summoned" }),
      row({ instanceId: "bound", isBond: true, pactOrigin: "bound", pactStored: true, isMagic: true }),
      row({ instanceId: "pack" })
    ]);
    expect(result.map(item => item.instanceId)).toEqual(["bound", "pack"]);
    expect(result[0].isBond).toBe(false);
    expect(result[0].pactStored).toBeUndefined();
  });
});

describe("pactWeaponFormRejection", () => {
  const config = { melee: true, grantsProficiency: true, magical: true };

  it("rejects missing weapons and ranged forms", () => {
    expect(pactWeaponFormRejection(config, null)).toMatch(/arma/);
    expect(pactWeaponFormRejection(config, { weapon: { range: "A distancia" } })).toMatch(/cuerpo a cuerpo/);
    expect(pactWeaponFormRejection(config, { weapon: { range: "Cuerpo a cuerpo" } })).toBeUndefined();
  });
});

describe("grantsPactWeaponProficiency", () => {
  it("is true only for a manifested bond", () => {
    expect(grantsPactWeaponProficiency({ isBond: true, pactStored: false }, true)).toBe(true);
    expect(grantsPactWeaponProficiency({ isBond: true, pactStored: true }, true)).toBe(false);
    expect(grantsPactWeaponProficiency({ isBond: true }, false)).toBe(false);
  });
});
