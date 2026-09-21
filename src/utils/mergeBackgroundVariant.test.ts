import { describe, it, expect } from "vitest";
import { mergeBackgroundVariant, overlayFieldsPresent } from "./mergeBackgroundVariant";

describe("mergeBackgroundVariant", () => {
  const noble = {
    name: "Noble",
    img: "noble.png",
    description: ["Linaje noble."],
    traits: [],
    traits_choices: [{ choose: 1, options: ["privilege-id", "retainers-id"] }],
    skills: ["history-id", "persuasion-id"],
    money: [{ quantity: 25, unit: "gp-id" }],
    equipment: [
      { id: "clothes-id" },
      { id: "signet-id" },
      { id: "pedigree-id" }
    ]
  };

  it("inherits omitted fields and replaces present ones including empty arrays", () => {
    const knight = {
      name: "Caballero",
      img: "knight.png",
      description: ["Emblema de hidalguía y amor cortés."],
      traits: ["retainers-id"],
      traits_choices: [],
      equipment: [
        { id: "clothes-id" },
        { id: "signet-id" },
        {
          name: "Emblema de hidalguía",
          description: ["Emblema de hidalguía y los ideales del amor cortés."]
        }
      ]
    };

    const { merged, overriddenFields } = mergeBackgroundVariant(noble, knight);

    expect(merged.name).toBe("Caballero");
    expect(merged.img).toBe("knight.png");
    expect(merged.description).toEqual(["Emblema de hidalguía y amor cortés."]);
    expect(merged.traits).toEqual(["retainers-id"]);
    expect(merged.traits_choices).toEqual([]);
    expect(merged.skills).toEqual(["history-id", "persuasion-id"]);
    expect(merged.money).toEqual([{ quantity: 25, unit: "gp-id" }]);
    expect(merged.equipment).toEqual(knight.equipment);
    expect(overriddenFields).toEqual([
      "name",
      "description",
      "img",
      "traits",
      "traits_choices",
      "equipment"
    ]);
  });

  it("treats omitted keys as inherit even when the parent has values", () => {
    const overlay = { name: "Caballero" };
    const { merged, overriddenFields } = mergeBackgroundVariant(noble, overlay);

    expect(merged.skills).toEqual(noble.skills);
    expect(merged.traits_choices).toEqual(noble.traits_choices);
    expect(overriddenFields).toEqual(["name"]);
  });

  it("replaces with an empty array when the overlay key is present", () => {
    const overlay = { ...{ traits_choices: [] as { choose: number; options: string[] }[] } };
    const { merged } = mergeBackgroundVariant(noble, overlay);
    expect(merged.traits_choices).toEqual([]);
    expect(overlayFieldsPresent(overlay)).toEqual(["traits_choices"]);
  });
});
