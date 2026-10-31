import { describe, expect, it } from "vitest";
import {
  filterExcludedById,
  filterSubclassesByExcludedClasses,
  isRaceExcluded,
  mergeCatalogExclusions,
  pruneRaceCatalog,
  pruneRaceForest,
} from "./catalogExclusions";

describe("mergeCatalogExclusions", () => {
  it("unions race and class ids from every system", () => {
    const result = mergeCatalogExclusions([
      { excludedRaceIds: ["elf"], excludedClassIds: ["wizard"] },
      { excludedRaceIds: ["dwarf", "elf"], excludedClassIds: ["bard"] },
      {},
    ]);

    expect([...result.raceIds].sort()).toEqual(["dwarf", "elf"]);
    expect([...result.classIds].sort()).toEqual(["bard", "wizard"]);
  });

  it("treats missing arrays as empty", () => {
    expect(mergeCatalogExclusions([{}])).toEqual({
      raceIds: new Set(),
      classIds: new Set(),
    });
  });
});

describe("pruneRaceForest", () => {
  const forest = [
    {
      id: "elf",
      subraces: {
        name: "Linajes",
        list: [
          { id: "high-elf" },
          {
            id: "wood-elf",
            subraces: { name: "Variantes", list: [{ id: "dark-wood-elf" }] },
          },
        ],
      },
    },
    { id: "dwarf" },
  ];

  it("removes a root and all descendants", () => {
    const result = pruneRaceForest(forest, ["elf"]);
    expect(result.map((node) => node.id)).toEqual(["dwarf"]);
  });

  it("removes a subrace and keeps the root", () => {
    const result = pruneRaceForest(forest, ["high-elf"]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("elf");
    expect(result[0].subraces?.list.map((node) => node.id)).toEqual(["wood-elf"]);
  });

  it("omits the subraces block when every child is excluded", () => {
    const result = pruneRaceForest(forest, ["high-elf", "wood-elf"]);
    expect(result[0]).toEqual({ id: "elf" });
  });
});

describe("pruneRaceCatalog", () => {
  const catalog = [
    { id: "elf", parentId: null },
    { id: "high-elf", parentId: "elf" },
    { id: "dwarf", parentId: null },
  ];

  it("drops an excluded id and its children", () => {
    expect(pruneRaceCatalog(catalog, ["elf"]).map((item) => item.id)).toEqual(["dwarf"]);
  });

  it("drops a child whose parent is excluded even if the parent is not in the list", () => {
    const onlyChild = [{ id: "high-elf", parentId: "elf" }];
    expect(pruneRaceCatalog(onlyChild, ["elf"])).toEqual([]);
  });

  it("keeps a root whose parentId is null when another id is excluded", () => {
    const mixed = [
      { id: "elf", parentId: null as string | null },
      { id: "dwarf", parentId: undefined },
    ];
    expect(pruneRaceCatalog(mixed, ["high-elf"]).map((item) => item.id)).toEqual(["elf", "dwarf"]);
  });
});

describe("filterExcludedById and subclasses", () => {
  it("filters classes by id", () => {
    const classes = [{ id: "wizard" }, { id: "fighter" }];
    expect(filterExcludedById(classes, ["wizard"])).toEqual([{ id: "fighter" }]);
  });

  it("filters subclasses whose classId is excluded", () => {
    const subclasses = [
      { id: "evocation", classId: "wizard" },
      { id: "champion", classId: "fighter" },
    ];
    expect(filterSubclassesByExcludedClasses(subclasses, ["wizard"])).toEqual([
      { id: "champion", classId: "fighter" },
    ]);
  });
});

describe("isRaceExcluded", () => {
  it("is true when the race or any ancestor is excluded", () => {
    expect(isRaceExcluded("high-elf", ["elf"], ["elf"])).toBe(true);
    expect(isRaceExcluded("high-elf", ["elf"], ["dwarf"])).toBe(false);
    expect(isRaceExcluded("elf", [], ["elf"])).toBe(true);
  });
});
