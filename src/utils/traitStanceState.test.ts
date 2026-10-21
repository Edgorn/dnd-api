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
  const restRules = {
    kinds: [
      { key: "shortRest", name: "Descanso corto" },
      { key: "longRest", name: "Descanso largo", includes: ["shortRest"] }
    ],
    endStancesOn: ["shortRest"]
  };
  const traits = [
    { id: "rage", action: { recharge: "longRest" } },
    { id: "breath", action: { recharge: "shortRest" } },
    { id: "daily", action: { recharge: "shortRest" } }
  ];

  it("resets long-rest and included short-rest uses on a long rest and clears stances", () => {
    const result = applyCharacterRest({
      restType: "longRest",
      restRules,
      traits,
      traitResources: [
        { traitId: "rage", spent: 2 },
        { traitId: "breath", spent: 1 },
        { traitId: "daily", spent: 1 }
      ],
      activeTraitIds: ["rage"]
    });

    expect(result).toEqual({ traitResources: [], activeTraitIds: [] });
  });

  it("on a short rest only resets matching recharge and still clears stances when endStancesOn covers it", () => {
    const result = applyCharacterRest({
      restType: "shortRest",
      restRules,
      traits,
      traitResources: [
        { traitId: "rage", spent: 2 },
        { traitId: "breath", spent: 1 },
        { traitId: "daily", spent: 1 }
      ],
      activeTraitIds: ["rage"]
    });

    expect(result).toEqual({
      traitResources: [{ traitId: "rage", spent: 2 }],
      activeTraitIds: []
    });
  });

  it("keeps stances when endStancesOn is omitted", () => {
    const result = applyCharacterRest({
      restType: "longRest",
      restRules: { kinds: restRules.kinds },
      traits,
      traitResources: [{ traitId: "rage", spent: 2 }],
      activeTraitIds: ["rage"]
    });

    expect(result.activeTraitIds).toEqual(["rage"]);
  });

  it("keeps stances when the rest does not cover endStancesOn", () => {
    const result = applyCharacterRest({
      restType: "shortRest",
      restRules: { ...restRules, endStancesOn: ["longRest"] },
      traits,
      traitResources: [{ traitId: "rage", spent: 2 }],
      activeTraitIds: ["rage"]
    });

    expect(result).toEqual({
      traitResources: [{ traitId: "rage", spent: 2 }],
      activeTraitIds: ["rage"]
    });
  });
});

describe("rechargeMatchesRest", () => {
  const restRules = {
    kinds: [
      { key: "shortRest", name: "Descanso corto" },
      { key: "longRest", name: "Descanso largo", includes: ["shortRest"] }
    ]
  };

  it("matches included rest keys", () => {
    expect(rechargeMatchesRest("shortRest", "shortRest", restRules)).toBe(true);
    expect(rechargeMatchesRest("shortRest", "longRest", restRules)).toBe(true);
    expect(rechargeMatchesRest("longRest", "shortRest", restRules)).toBe(false);
  });
});

describe("spentForTrait", () => {
  it("reads spent from the first matching alias", () => {
    expect(spentForTrait([{ traitId: "legacy", spent: 2 }], ["rage", "legacy"])).toBe(2);
    expect(spentForTrait([], ["rage"])).toBe(0);
  });
});
