import { describe, it, expect } from "vitest";
import {
  collectClassGrantedTraitIds,
  traitHitPointBonus
} from "./traitHitPoints";

const dwarven = { id: "dwarven-toughness", hitPoints: { perLevel: 1, scope: "character" as const } };
const draconic = { id: "draconic-resistance", hitPoints: { perLevel: 1, scope: "class" as const } };

describe("traitHitPointBonus", () => {
  it("adds perLevel once on character creation for both scopes", () => {
    const bonus = traitHitPointBonus({
      traits: [dwarven, draconic],
      classGrantedTraitIds: [draconic.id],
      classLevel: 1,
      characterLevel: 1,
      previouslyOwnedIds: []
    });
    expect(bonus).toBe(2);
  });

  it("adds perLevel on level up for traits already owned", () => {
    const bonus = traitHitPointBonus({
      traits: [dwarven, draconic],
      classGrantedTraitIds: [draconic.id],
      classLevel: 5,
      characterLevel: 5,
      previouslyOwnedIds: [dwarven.id, draconic.id]
    });
    expect(bonus).toBe(2);
  });

  it("retroactively applies character scope when the trait is newly gained", () => {
    const bonus = traitHitPointBonus({
      traits: [dwarven],
      classGrantedTraitIds: [],
      classLevel: 3,
      characterLevel: 5,
      previouslyOwnedIds: []
    });
    expect(bonus).toBe(5);
  });

  it("retroactively applies class scope only when the trait is in the class catalog", () => {
    const bonus = traitHitPointBonus({
      traits: [draconic],
      classGrantedTraitIds: [draconic.id],
      classLevel: 4,
      characterLevel: 6,
      previouslyOwnedIds: []
    });
    expect(bonus).toBe(4);
  });

  it("ignores class scope traits not granted by the leveled class", () => {
    const bonus = traitHitPointBonus({
      traits: [draconic],
      classGrantedTraitIds: [],
      classLevel: 4,
      characterLevel: 6,
      previouslyOwnedIds: []
    });
    expect(bonus).toBe(0);
  });

  it("counts each trait at most once", () => {
    const bonus = traitHitPointBonus({
      traits: [dwarven, { ...dwarven }],
      classGrantedTraitIds: [],
      classLevel: 2,
      characterLevel: 2,
      previouslyOwnedIds: [dwarven.id]
    });
    expect(bonus).toBe(1);
  });
});

describe("collectClassGrantedTraitIds", () => {
  it("collects traits from class and subclass up to max level", () => {
    const ids = collectClassGrantedTraitIds(
      [
        { level: 1, traits: ["a"] },
        { level: 3, traits: ["b"] }
      ],
      [{ level: 2, traits: ["c"] }],
      2
    );
    expect(ids).toEqual(new Set(["a", "c"]));
  });
});
