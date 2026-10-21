import { describe, expect, it } from "vitest";
import { CreatureApi } from "./creature.types";

describe("creature damage types", () => {
  it("hidrata grants de afinidad con el catálogo Damage", () => {
    const damage = {
      id: "cold",
      name: "Frío",
      description: "",
      color: "#00f",
      ruleset: "sys1"
    };
    const creature: Pick<CreatureApi, "damage_resistances"> = {
      damage_resistances: [{
        damageTypes: [damage],
        source: "any",
        bypass: []
      }]
    };

    expect(creature.damage_resistances[0]?.damageTypes[0]?.id).toBe("cold");
  });
});
