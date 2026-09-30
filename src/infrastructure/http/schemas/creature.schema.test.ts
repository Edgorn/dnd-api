import { describe, expect, it } from "vitest";
import { CreateCreatureSchema, UpdateCreatureSchema } from "./creature.schema";

const priest = {
  name: "Sacerdote",
  ruleset: "sys1",
  creatureTypeId: "humanoide",
  race: "any",
  size: "Mediano",
  alignment: "cualquier alineamiento",
  armor_class: { value: 13, notes: "camisa de malla" },
  HPMax: 27,
  hit_dice: "5d8 + 5",
  speed: { walk: 25 },
  attributes: [
    { key: "str", value: 10 },
    { key: "dex", value: 10 },
    { key: "con", value: 12 },
    { key: "int", value: 13 },
    { key: "wis", value: 16 },
    { key: "cha", value: 13 }
  ],
  skill_bonuses: [
    { skillId: "medicine", bonus: 7 },
    { skillId: "persuasion", bonus: 3 },
    { skillId: "religion", bonus: 4 }
  ],
  languages: { speaks: [], understands: [], notes: "dos cualesquiera" },
  language_choices: { choose: 2 },
  challenge_rating: 2,
  xp: 450,
  prof_bonus: 2,
  spellcasting: {
    slots: { "1": 4, "2": 3, "3": 2 },
    spells: ["sacred-flame", "cure-wounds"]
  },
  traits: [{
    name: "Prerrogativa Divina",
    description: ["Como acción adicional, el sacerdote puede gastar un espacio de conjuro."]
  }],
  actions: [{
    name: "Maza",
    description: [],
    attack: {
      kind: "melee_weapon",
      attributeKey: "str",
      reach: 5,
      targets: "un objetivo",
      damage: [{ dice: "1d6", damageTypeId: "bludgeoning" }]
    }
  }]
};

describe("CreateCreatureSchema", () => {
  it("acepta al sacerdote con velocidad y alcance en pies", () => {
    const result = CreateCreatureSchema.safeParse(priest);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.speed.walk).toBe(25);
      expect(result.data.actions?.[0]?.attack?.reach).toBe(5);
      expect(result.data.race).toBe("any");
    }
  });

  it("acepta raza nula o un id de catálogo", () => {
    expect(CreateCreatureSchema.safeParse({ ...priest, race: null }).success).toBe(true);
    expect(CreateCreatureSchema.safeParse({ ...priest, race: "507f1f77bcf86cd799439011" }).success).toBe(true);
  });

  it("acepta tags y rechaza cadenas vacías en el array", () => {
    const withTags = CreateCreatureSchema.safeParse({
      ...priest,
      tags: ["cambiaformas", "demonio"]
    });
    expect(withTags.success).toBe(true);
    if (withTags.success) {
      expect(withTags.data.tags).toEqual(["cambiaformas", "demonio"]);
    }

    expect(CreateCreatureSchema.safeParse({ ...priest, tags: [""] }).success).toBe(false);
  });

  it("acepta los tres modos de language_choices y descarta claves ajenas", () => {
    const chooseOnly = CreateCreatureSchema.safeParse({
      ...priest,
      language_choices: { choose: 2 }
    });
    expect(chooseOnly.success).toBe(true);
    if (chooseOnly.success) {
      expect(chooseOnly.data.language_choices).toEqual({ choose: 2 });
    }

    const withOptions = CreateCreatureSchema.safeParse({
      ...priest,
      language_choices: { choose: 1, options: ["507f1f77bcf86cd799439011"] }
    });
    expect(withOptions.success).toBe(true);
    if (withOptions.success) {
      expect(withOptions.data.language_choices).toEqual({
        choose: 1,
        options: ["507f1f77bcf86cd799439011"]
      });
    }

    const withFilter = CreateCreatureSchema.safeParse({
      ...priest,
      language_choices: { choose: 1, filter: { type: "standard" } }
    });
    expect(withFilter.success).toBe(true);
    if (withFilter.success) {
      expect(withFilter.data.language_choices).toEqual({
        choose: 1,
        filter: { type: "standard" }
      });
    }

    const withResponseKeys = CreateCreatureSchema.safeParse({
      ...priest,
      language_choices: { choose: 2, query_type: "all", query_filter: { type: "exotic" } }
    });
    expect(withResponseKeys.success).toBe(true);
    if (withResponseKeys.success) {
      expect(withResponseKeys.data.language_choices).toEqual({ choose: 2 });
    }
  });

  it("rechaza una raza vacía", () => {
    expect(CreateCreatureSchema.safeParse({ ...priest, race: "" }).success).toBe(false);
  });

  it("rechaza un alta sin nombre, sistema o tipo", () => {
    expect(CreateCreatureSchema.safeParse({ ...priest, name: "" }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({ ...priest, ruleset: "" }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({ ...priest, creatureTypeId: "" }).success).toBe(false);
  });

  it("rechaza claves desconocidas", () => {
    const result = CreateCreatureSchema.safeParse({ ...priest, index: "priest" });
    expect(result.success).toBe(false);
  });

  it("rechaza listas de competencia y competencia doble", () => {
    expect(CreateCreatureSchema.safeParse({ ...priest, skills: ["medicine"] }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({ ...priest, double_skills: ["medicine"] }).success).toBe(false);
  });

  it("acepta nivel de lanzador, aptitud mágica, CD y bonificador de ataque", () => {
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: {
        casterLevel: 5,
        abilityId: "attr-wis",
        spellSaveDc: 13,
        spellAttackBonus: 5,
        slots: { "1": 4 },
        spells: ["sacred-flame"]
      }
    }).success).toBe(true);
  });

  it("rechaza nivel de lanzador 0, CD no entera y aptitud vacía", () => {
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: { casterLevel: 0, slots: {}, spells: [] }
    }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: { spellSaveDc: 13.5, slots: {}, spells: [] }
    }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: { abilityId: "", slots: {}, spells: [] }
    }).success).toBe(false);
  });

  it("acepta el lanzamiento nulo y rechaza bloques o ids vacíos", () => {
    expect(CreateCreatureSchema.safeParse({ ...priest, spellcasting: null }).success).toBe(true);
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: [{ name: "Lanzamiento", attributeKey: "wis", slots: {}, spells: {} }]
    }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: { slots: { "1": 4 }, spells: [""] }
    }).success).toBe(false);
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      spellcasting: { slots: { "1": -1 }, spells: ["sacred-flame"] }
    }).success).toBe(false);
  });

  it("acepta conjuros innatos agrupados por usos por día y a voluntad", () => {
    const result = CreateCreatureSchema.safeParse({
      ...priest,
      innateSpellcasting: {
        abilityId: "attr-int",
        spellSaveDc: 15,
        spells: [
          { usage: { type: "atWill" }, spells: ["mage-hand"] },
          { usage: { type: "perDay", value: 3 }, spells: ["comprehend-languages", "detect-magic", "identify"] },
          { usage: { type: "perDay", value: 1 }, spells: ["dispel-magic", "levitate", "locate-object"] }
        ]
      }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.innateSpellcasting?.spells).toHaveLength(3);
    }
    expect(CreateCreatureSchema.safeParse({ ...priest, innateSpellcasting: null }).success).toBe(true);
  });

  it("acepta visión ciega con ciego más allá de este radio", () => {
    const result = CreateCreatureSchema.safeParse({
      ...priest,
      senses: { blindsight: 60, blindsightBlindBeyond: true }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senses).toEqual({ blindsight: 60, blindsightBlindBeyond: true });
    }
  });

  it("rechaza ciego más allá del radio sin alcance de visión ciega", () => {
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      senses: { blindsightBlindBeyond: true }
    }).success).toBe(false);
  });

  it("acepta vuelo con flotar", () => {
    const result = CreateCreatureSchema.safeParse({
      ...priest,
      speed: { walk: 0, fly: 50, flyHover: true }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.speed).toEqual({ walk: 0, fly: 50, flyHover: true });
    }
  });

  it("rechaza flotar sin velocidad de vuelo", () => {
    const result = CreateCreatureSchema.safeParse({
      ...priest,
      speed: { walk: 30, flyHover: true }
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue =>
        issue.path[0] === "speed"
        && issue.path[1] === "flyHover"
        && issue.message === "flyHover requiere una velocidad de vuelo"
      )).toBe(true);
    }
  });

  it("acepta flyHover falso sin vuelo", () => {
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      speed: { walk: 30, flyHover: false }
    }).success).toBe(true);
  });

  it("rechaza special_abilities en el cuerpo HTTP", () => {
    expect(CreateCreatureSchema.safeParse({
      ...priest,
      special_abilities: priest.traits
    }).success).toBe(false);
  });

  it("rechaza grupos innatos sin conjuros o con usos por día no válidos", () => {
    const withGroup = (group: unknown) => CreateCreatureSchema.safeParse({
      ...priest,
      innateSpellcasting: { spells: [group] }
    }).success;

    expect(withGroup({ usage: { type: "perDay", value: 3 }, spells: [] })).toBe(false);
    expect(withGroup({ usage: { type: "perDay" }, spells: ["identify"] })).toBe(false);
    expect(withGroup({ usage: { type: "perDay", value: 0 }, spells: ["identify"] })).toBe(false);
    expect(withGroup({ usage: { type: "perDay", value: "3" }, spells: ["identify"] })).toBe(false);
    expect(withGroup({ usage: { type: "perDay", value: 1.5 }, spells: ["identify"] })).toBe(false);
    expect(withGroup({ spells: ["identify"] })).toBe(false);
  });
});

describe("UpdateCreatureSchema", () => {
  it("acepta un cambio parcial sin identificador en el cuerpo", () => {
    const result = UpdateCreatureSchema.safeParse({ name: "Sacerdote mayor" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
    }
  });

  it("rechaza un cuerpo vacío", () => {
    const result = UpdateCreatureSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
