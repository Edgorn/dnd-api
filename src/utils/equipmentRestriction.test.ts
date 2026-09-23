import { describe, it, expect } from "vitest";
import { EquipmentRestriction } from "../domain/types/traits.types";
import { findBlockedEquipmentRestriction, RestrictableEquipment } from "./equipmentRestriction";

const druidRestriction: EquipmentRestriction = {
  forbiddenMaterials: ["metal"],
  unlessMaterials: ["mithral"],
  scopes: ["armor", "shield"],
  enforcement: "block",
};

const traits = [{ equipmentRestriction: druidRestriction }];

function equip(partial: RestrictableEquipment): RestrictableEquipment {
  return partial;
}

describe("findBlockedEquipmentRestriction", () => {
  it("blocks metal body armor", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "armor", materials: ["metal"], armor: { class: { base: 18 } } }),
      traits
    );
    expect(blocked).toEqual(druidRestriction);
  });

  it("allows leather armor", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "armor", materials: ["leather"], armor: { class: { base: 11 } } }),
      traits
    );
    expect(blocked).toBeUndefined();
  });

  it("allows armor with unknown materials", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "armor", materials: [], armor: { class: { base: 18 } } }),
      traits
    );
    expect(blocked).toBeUndefined();
  });

  it("allows mithral that is also metal", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({
        equipSlot: "armor",
        materials: ["metal", "mithral"],
        armor: { class: { base: 18 } },
      }),
      traits
    );
    expect(blocked).toBeUndefined();
  });

  it("blocks a shield in the off hand when it has armor class", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "off_hand", materials: ["metal"], armor: { class: { base: 2 } } }),
      traits
    );
    expect(blocked).toEqual(druidRestriction);
  });

  it("does not block an off-hand weapon without an armor block", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "off_hand", materials: ["metal"] }),
      traits
    );
    expect(blocked).toBeUndefined();
  });

  it("does not block when enforcement is warn", () => {
    const blocked = findBlockedEquipmentRestriction(
      equip({ equipSlot: "armor", materials: ["metal"], armor: { class: { base: 18 } } }),
      [{ equipmentRestriction: { ...druidRestriction, enforcement: "warn" } }]
    );
    expect(blocked).toBeUndefined();
  });
});
