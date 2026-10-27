import { describe, expect, it } from "vitest";
import { mergeEquipmentFlavor } from "./grantedEquipment";

describe("mergeEquipmentFlavor", () => {
  it("sets name without dropping an existing description", () => {
    expect(mergeEquipmentFlavor(
      { name: "Espada", description: "Vieja" },
      { name: "Filo de Invierno" }
    )).toEqual({
      name: "Filo de Invierno",
      description: "Vieja",
    });
  });

  it("clears a field with null and drops an empty overlay", () => {
    expect(mergeEquipmentFlavor({ name: "Filo" }, { name: null })).toBeUndefined();
  });

  it("keeps remaining keys after clearing one field", () => {
    expect(mergeEquipmentFlavor(
      { name: "Filo", description: ["Runas"] },
      { name: null }
    )).toEqual({ description: ["Runas"] });
  });

  it("accepts a description array", () => {
    expect(mergeEquipmentFlavor(undefined, { description: ["A", "B"] })).toEqual({
      description: ["A", "B"],
    });
  });
});
