import { describe, expect, it } from "vitest";
import { AppError } from "../errors/AppError";
import { linearize, mostSpecificBases, parentsOfFromSystems } from "./systemHierarchy";

function graph(
  nodes: Array<{ id: string; parents?: string[] }>
): Map<string, string[]> {
  return parentsOfFromSystems(
    nodes.map((node) => ({ id: node.id, parentIds: node.parents ?? [] }))
  );
}

describe("linearize C3", () => {
  it("returns a single node without parents", () => {
    const parentsOf = graph([{ id: "nucleo" }]);
    expect(linearize(["nucleo"], parentsOf)).toEqual(["nucleo"]);
  });

  it("linearizes a diamond with sibling order preserved", () => {
    const parentsOf = graph([
      { id: "D" },
      { id: "B", parents: ["D"] },
      { id: "C", parents: ["D"] },
      { id: "A", parents: ["B", "C"] },
    ]);

    expect(linearize(["A"], parentsOf)).toEqual(["A", "B", "C", "D"]);
  });

  it("linearizes the Forgotten Realms / Avernus example", () => {
    const parentsOf = graph([
      { id: "Nucleo5e" },
      { id: "SRD51", parents: ["Nucleo5e"] },
      { id: "PHB", parents: ["SRD51"] },
      { id: "MM", parents: ["SRD51"] },
      { id: "DMG", parents: ["SRD51"] },
      { id: "FR", parents: ["PHB", "MM", "DMG"] },
      { id: "Averno", parents: ["FR"] },
    ]);

    expect(linearize(["Averno"], parentsOf)).toEqual([
      "Averno",
      "FR",
      "PHB",
      "MM",
      "DMG",
      "SRD51",
      "Nucleo5e",
    ]);
  });

  it("linearizes several starts as a virtual node", () => {
    const parentsOf = graph([
      { id: "Nucleo5e" },
      { id: "PHB", parents: ["Nucleo5e"] },
      { id: "MM", parents: ["Nucleo5e"] },
    ]);

    expect(linearize(["PHB", "MM"], parentsOf)).toEqual(["PHB", "MM", "Nucleo5e"]);
  });

  it("throws when C3 has no solution", () => {
    const parentsOf = graph([
      { id: "A" },
      { id: "B" },
      { id: "X", parents: ["A", "B"] },
      { id: "Y", parents: ["B", "A"] },
      { id: "Z", parents: ["X", "Y"] },
    ]);

    expect(() => linearize(["Z"], parentsOf)).toThrow(AppError);
    expect(() => linearize(["Z"], parentsOf)).toThrow("No se puede linealizar la jerarquía de sistemas");
  });

  it("throws on a parent cycle", () => {
    const parentsOf = graph([
      { id: "child", parents: ["parent"] },
      { id: "parent", parents: ["child"] },
    ]);

    expect(() => linearize(["child"], parentsOf)).toThrow("La jerarquía de sistemas no puede contener ciclos");
  });
});

describe("mostSpecificBases", () => {
  it("accepts a single Núcleo engine", () => {
    const parentsOf = graph([
      { id: "nucleo" },
      { id: "phb", parents: ["nucleo"] },
    ]);
    const bases = mostSpecificBases(
      linearize(["phb"], parentsOf),
      parentsOf,
      new Set(["nucleo"])
    );
    expect(bases).toEqual(["nucleo"]);
  });

  it("rejects 5.1 plus 5.2 as two most specific bases", () => {
    const parentsOf = graph([
      { id: "nucleo" },
      { id: "srd51", parents: ["nucleo"] },
      { id: "srd52", parents: ["nucleo"] },
    ]);
    const linearized = linearize(["srd51", "srd52"], parentsOf);
    const bases = mostSpecificBases(linearized, parentsOf, new Set(["nucleo", "srd51", "srd52"]));
    expect(bases.sort()).toEqual(["srd51", "srd52"]);
  });

  it("rejects Pathfinder plus 5e as unrelated engines", () => {
    const parentsOf = graph([{ id: "pf2e" }, { id: "dnd5e" }]);
    const bases = mostSpecificBases(
      linearize(["pf2e", "dnd5e"], parentsOf),
      parentsOf,
      new Set(["pf2e", "dnd5e"])
    );
    expect(bases.sort()).toEqual(["dnd5e", "pf2e"]);
  });

  it("keeps the more specific base and discards its ancestor engine", () => {
    const parentsOf = graph([
      { id: "nucleo" },
      { id: "srd51", parents: ["nucleo"] },
      { id: "phb", parents: ["srd51"] },
    ]);
    const bases = mostSpecificBases(
      linearize(["phb"], parentsOf),
      parentsOf,
      new Set(["nucleo", "srd51"])
    );
    expect(bases).toEqual(["srd51"]);
  });
});
