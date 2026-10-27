import { describe, expect, it } from "vitest";
import { hydrateCompanions } from "./hydrateCompanions";
import { CreatureApi } from "../domain/types/creature.types";

const horse = {
  id: "horse1",
  name: "Caballo de monta",
  HPMax: 19,
  CA: 11,
  size: "large",
  speed: { walk: 60 },
  canBeMount: true,
  carryingCapacity: 480,
  attributes: [
    { id: "str", key: "str", name: "Fuerza", value: 16, modifier: 3 },
  ],
} as unknown as CreatureApi;

describe("hydrateCompanions", () => {
  it("attaches creature and copies catalog stats onto the companion", () => {
    const [hydrated] = hydrateCompanions(
      [{ id: "c1", name: "Relámpago", kind: "mount", creatureId: "horse1", hpCurrent: 12 }],
      [horse]
    );

    expect(hydrated.creature?.name).toBe("Caballo de monta");
    expect(hydrated.hpMax).toBe(19);
    expect(hydrated.ac).toBe(11);
    expect(hydrated.size).toBe("large");
    expect(hydrated.speed).toEqual({ walk: 60 });
    expect(hydrated.attributes).toEqual(horse.attributes);
    expect(hydrated.carryingCapacity).toBe(480);
  });

  it("matches creature ids with surrounding whitespace", () => {
    const [hydrated] = hydrateCompanions(
      [{ id: "c1", name: "Relámpago", kind: "mount", creatureId: " horse1 " }],
      [{ ...horse, id: " horse1" }]
    );
    expect(hydrated.creature?.HPMax).toBe(19);
    expect(hydrated.hpMax).toBe(19);
  });

  it("leaves catalog fields off when the creature is missing", () => {
    const [hydrated] = hydrateCompanions(
      [{ id: "c1", name: "Aldric", kind: "narrative" }],
      [horse]
    );
    expect(hydrated.creature).toBeUndefined();
    expect(hydrated.hpMax).toBeUndefined();
    expect(hydrated.ac).toBeUndefined();
    expect(hydrated.attributes).toBeUndefined();
    expect(hydrated.carryingCapacity).toBeUndefined();
  });
});
