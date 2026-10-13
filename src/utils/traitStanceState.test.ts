import { describe, expect, it } from "vitest";
import {
  applyCharacterRest,
  applyDeactivateTrait,
  applyUseTraitAction,
  rechargeMatchesRest,
  spentForTrait
} from "./traitStanceState";
import { TraitAction } from "../domain/types/traits.types";

const rageAction: TraitAction = {
  activation: "bonusAction",
  kind: "stance",
  uses: 2,
  usesByClassLevel: { "1": 2, "3": 3, "6": 4 },
  recharge: "longRest"
};

const rage = {
  id: "rage",
  action: rageAction,
  suppressedByArmorTypeIds: ["heavy"]
};

describe("applyUseTraitAction", () => {
  it("increments spent and activates a stance", () => {
    const result = applyUseTraitAction({
      ownsTrait: true,
      trait: rage,
      classLevel: 5,
      spent: 0,
      traitResources: [],
      activeTraitIds: [],
      armorSuppressed: false
    });

    expect(result).toEqual({
      ok: true,
      traitResources: [{ traitId: "rage", spent: 1 }],
      activeTraitIds: ["rage"]
    });
  });

  it("rejects when no uses remain for the granting class level", () => {
    const result = applyUseTraitAction({
      ownsTrait: true,
      trait: rage,
      classLevel: 5,
      spent: 3,
      traitResources: [{ traitId: "rage", spent: 3 }],
      activeTraitIds: [],
      armorSuppressed: false
    });

    expect(result).toEqual({ ok: false, message: "No quedan usos de este rasgo" });
  });

  it("rejects heavy armor that suppresses the trait", () => {
    const result = applyUseTraitAction({
      ownsTrait: true,
      trait: rage,
      classLevel: 1,
      spent: 0,
      traitResources: [],
      activeTraitIds: [],
      armorSuppressed: true
    });

    expect(result).toEqual({
      ok: false,
      message: "Este rasgo está suprimido por la armadura equipada"
    });
  });

  it("rejects activating a stance that is already on", () => {
    const result = applyUseTraitAction({
      ownsTrait: true,
      trait: rage,
      classLevel: 1,
      spent: 0,
      traitResources: [],
      activeTraitIds: ["rage"],
      armorSuppressed: false
    });

    expect(result).toEqual({ ok: false, message: "Este rasgo ya está activo" });
  });

  it("does not increment spent for unlimited uses", () => {
    const result = applyUseTraitAction({
      ownsTrait: true,
      trait: {
        id: "rage",
        action: { ...rageAction, uses: "unlimited" }
      },
      spent: 0,
      traitResources: [],
      activeTraitIds: [],
      armorSuppressed: false
    });

    expect(result).toMatchObject({
      ok: true,
      traitResources: [],
      activeTraitIds: ["rage"]
    });
  });
});

describe("applyDeactivateTrait", () => {
  it("clears the stance without refunding a use", () => {
    const result = applyDeactivateTrait({
      traitId: "rage",
      traitResources: [{ traitId: "rage", spent: 1 }],
      activeTraitIds: ["rage"]
    });

    expect(result).toEqual({
      ok: true,
      traitResources: [{ traitId: "rage", spent: 1 }],
      activeTraitIds: []
    });
  });

  it("rejects when the stance is not active", () => {
    const result = applyDeactivateTrait({
      traitId: "rage",
      traitResources: [],
      activeTraitIds: []
    });

    expect(result).toEqual({ ok: false, message: "Este rasgo no está activo" });
  });
});

describe("applyCharacterRest", () => {
  const traits = [
    { id: "rage", action: { recharge: "longRest" as const } },
    { id: "breath", action: { recharge: "shortOrLongRest" as const } },
    { id: "daily", action: { recharge: "shortRest" as const } }
  ];

  it("resets long-rest and short-or-long uses on a long rest and clears stances", () => {
    const result = applyCharacterRest({
      restType: "longRest",
      traits,
      traitResources: [
        { traitId: "rage", spent: 2 },
        { traitId: "breath", spent: 1 }
      ]
    });

    expect(result).toEqual({ traitResources: [], activeTraitIds: [] });
  });

  it("on a short rest only resets matching recharge and still clears stances", () => {
    const result = applyCharacterRest({
      restType: "shortRest",
      traits,
      traitResources: [
        { traitId: "rage", spent: 2 },
        { traitId: "breath", spent: 1 },
        { traitId: "daily", spent: 1 }
      ]
    });

    expect(result).toEqual({
      traitResources: [{ traitId: "rage", spent: 2 }],
      activeTraitIds: []
    });
  });
});

describe("rechargeMatchesRest", () => {
  it("matches shortOrLongRest on both rests", () => {
    expect(rechargeMatchesRest("shortOrLongRest", "shortRest")).toBe(true);
    expect(rechargeMatchesRest("shortOrLongRest", "longRest")).toBe(true);
    expect(rechargeMatchesRest("longRest", "shortRest")).toBe(false);
  });
});

describe("spentForTrait", () => {
  it("reads spent from the first matching alias", () => {
    expect(spentForTrait([{ traitId: "legacy", spent: 2 }], ["rage", "legacy"])).toBe(2);
    expect(spentForTrait([], ["rage"])).toBe(0);
  });
});
