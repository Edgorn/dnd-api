import { z } from "zod";
import { Types } from "mongoose";
import { validateSystemFormula } from "../../../utils/formulaValidation";
import { EquipmentMaterialSchema } from "./equipment.schema";
import { CreatureFormPoolFilterSchema, CreatureFormPoolIdsSchema } from "./spell.schema";
import {
  EQUIPMENT_RESTRICTION_ENFORCEMENTS,
  EQUIPMENT_RESTRICTION_SCOPES,
  SPELL_PRIVILEGE_RECHARGES,
  TRAIT_ACTION_KINDS,
  TRAIT_ACTIVATIONS,
  TRAIT_AREA_SHAPES,
  TRAIT_DAMAGE_CHOICE_SOURCES,
  TRAIT_DURATION_UNITS,
  TRAIT_SKILL_PROFICIENCY_VALUES,
  TRAIT_STACK_POLICIES,
  TRAIT_WEAPON_DAMAGE_BONUS_WHENS
} from "../../../domain/types/traits.types";

const SpellPrivilegeLevelFilterSchema = z.union([
  z.number().int().min(0).max(9),
  z.array(z.number().int().min(0).max(9)).min(1)
]);

export const SpellPrivilegeRuleSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1 conjuro"),
  source: z.enum(["known", "classList"]),
  filter: z.object({
    level: SpellPrivilegeLevelFilterSchema
  }),
  alwaysPrepared: z.boolean(),
  countsTowardPreparedCap: z.boolean(),
  freeCast: z.object({
    slotLevel: z.enum(["spellLevel"]),
    uses: z.union([
      z.literal("unlimited"),
      z.number().int().min(1)
    ]),
    recharge: z.enum(SPELL_PRIVILEGE_RECHARGES).nullable()
  }).nullable(),
  replace: z.object({
    hours: z.number().min(0, "Las horas no pueden ser negativas"),
    sameLevel: z.boolean()
  }).nullable()
});

const MovementSpeedsSchema = z.object({
  walk: z.number().positive().optional(),
  fly: z.number().positive().optional(),
  climb: z.number().positive().optional(),
  swim: z.number().positive().optional(),
  burrow: z.number().positive().optional()
});

export const TraitSpeedSchema = z.object({
  set: MovementSpeedsSchema.optional(),
  add: MovementSpeedsSchema.optional(),
  equalToWalk: z.array(z.enum(["fly", "climb", "swim", "burrow"])).optional(),
  condition: z.enum(["always"]).optional()
}).refine(
  data => Boolean(data.set) || Boolean(data.add) || Boolean(data.equalToWalk?.length),
  { message: "Debe incluir al menos set, add o equalToWalk" }
);

export const TraitCompanionRosterSchema = z.object({
  count: z
    .number()
    .int("El recuento de compañeros debe ser un entero")
    .min(1, "El recuento de compañeros debe ser al menos 1")
    .max(20, "El recuento de compañeros no puede superar 20"),
  suggestedRoles: z
    .array(z.string().min(1, "Cada rol sugerido no puede estar vacío"))
    .optional()
});

const acFormulaSchema = z.string().min(1, "La fórmula de CA no puede estar vacía").nullish().superRefine((val, ctx) => {
  if (val == null) return;
  const error = validateSystemFormula(val);
  if (error) {
    ctx.addIssue({ code: "custom", message: `acFormula: ${error}` });
  }
});

const suppressedByArmorTypeIdsSchema = z
  .array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada tipo de armadura debe ser un ID de Mongo válido" }))
  .nullish();

export const EquipmentRestrictionSchema = z.object({
  forbiddenMaterials: z.array(EquipmentMaterialSchema).min(1, "Debe indicar al menos un material prohibido"),
  unlessMaterials: z.array(EquipmentMaterialSchema).optional(),
  scopes: z.array(z.enum(EQUIPMENT_RESTRICTION_SCOPES)).min(1, "Debe indicar al menos un ámbito"),
  enforcement: z.enum(EQUIPMENT_RESTRICTION_ENFORCEMENTS)
}).strict();

export const TraitLanguagesSchema = z.object({
  speaks: z.array(z.string().min(1, "El idioma no puede estar vacío")),
  understands: z.array(z.string().min(1, "El idioma no puede estar vacío"))
}).strict();

const TraitAreaSchema = z.object({
  shape: z.enum(TRAIT_AREA_SHAPES),
  length: z.number().positive("La longitud del área debe ser mayor que 0"),
  width: z.number().positive("El ancho del área debe ser mayor que 0").optional(),
  unit: z.enum(["m", "ft"])
}).strict().superRefine((area, ctx) => {
  if (area.shape === "line" && area.width === undefined) {
    ctx.addIssue({
      code: "custom",
      message: "La línea debe indicar width",
      path: ["width"]
    });
  }
});

const TraitDamageChoiceOptionSchema = z.object({
  name: z.string().min(1, "El nombre de la fila no puede estar vacío"),
  damageTypeId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: "El tipo de daño debe ser un ID de Mongo válido"
  }),
  area: TraitAreaSchema.optional(),
  saveAttributeId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: "El atributo de salvación debe ser un ID de Mongo válido"
  }).optional()
}).strict();

const TraitDamageChoiceSchema = z.object({
  key: z.string().min(1, "La clave de la elección no puede estar vacía"),
  choose: z.number().int().min(1, "Debe elegir al menos 1 opción"),
  options: z.array(TraitDamageChoiceOptionSchema).default([]),
  source: z.enum(TRAIT_DAMAGE_CHOICE_SOURCES).optional(),
  grantsResistance: z.boolean().optional(),
  replaceOn: z.enum(SPELL_PRIVILEGE_RECHARGES).optional()
}).strict().superRefine((choice, ctx) => {
  if (!choice.source && choice.options.length < 1) {
    ctx.addIssue({
      code: "custom",
      message: "La elección debe tener al menos una opción",
      path: ["options"]
    });
  }

  if (!choice.source && choice.choose > choice.options.length) {
    ctx.addIssue({
      code: "custom",
      message: "choose no puede superar el número de opciones",
      path: ["choose"]
    });
  }

  const names = new Set<string>();
  choice.options.forEach((option, index) => {
    if (names.has(option.name)) {
      ctx.addIssue({
        code: "custom",
        message: `El nombre de fila ${option.name} está repetido`,
        path: ["options", index, "name"]
      });
    }
    names.add(option.name);
  });
});

export const TraitDamageChoicesSchema = z.array(TraitDamageChoiceSchema).superRefine((choices, ctx) => {
  const keys = new Set<string>();
  const optionNames = new Set<string>();

  choices.forEach((choice, choiceIndex) => {
    if (keys.has(choice.key)) {
      ctx.addIssue({
        code: "custom",
        message: `La clave ${choice.key} está repetida`,
        path: [choiceIndex, "key"]
      });
    }
    keys.add(choice.key);

    choice.options.forEach((option, optionIndex) => {
      if (optionNames.has(option.name)) {
        ctx.addIssue({
          code: "custom",
          message: `El nombre de fila ${option.name} está repetido`,
          path: [choiceIndex, "options", optionIndex, "name"]
        });
      }
      optionNames.add(option.name);
    });
  });
});

const TraitCatalogGrantSchema = z.object({
  atLevel: z.number().int().min(1, "El nivel de la concesión debe ser al menos 1"),
  choose: z.number().int().min(1, "Debe elegir al menos 1 opción")
}).strict();

const TraitCatalogOptionSchema = z.object({
  name: z.string().min(1, "El nombre de la opción no puede estar vacío"),
  inputs: z.number().int().min(1, "Los textos libres deben ser al menos 1").optional(),
  repeatable: z.boolean().optional(),
  label: z.string().min(1, "La etiqueta no puede estar vacía").optional(),
  creatureTypeId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: "El tipo de criatura debe ser un ID de Mongo válido"
  }).optional(),
  races: z.number().int().min(1, "Las razas a elegir deben ser al menos 1").optional()
}).strict().superRefine((option, ctx) => {
  if (option.inputs !== undefined && option.races !== undefined) {
    ctx.addIssue({
      code: "custom",
      message: "Una opción no puede pedir textos libres y razas a la vez",
      path: ["races"]
    });
  }

  const slots = option.races ?? option.inputs;
  if (slots === undefined) return;
  if (!option.label) {
    ctx.addIssue({
      code: "custom",
      message: option.races !== undefined
        ? "La opción con razas debe incluir label"
        : "La opción con textos libres debe incluir label",
      path: ["label"]
    });
    return;
  }
  for (let index = 0; index < slots; index++) {
    if (!option.label.includes(`{${index}}`)) {
      ctx.addIssue({
        code: "custom",
        message: `La etiqueta debe incluir {${index}}`,
        path: ["label"]
      });
    }
  }
});

const TraitCatalogCreatureTypeRacesSchema = z.object({
  creatureTypeId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: "El tipo de criatura debe ser un ID de Mongo válido"
  }),
  races: z.number().int().min(1, "Las razas a elegir deben ser al menos 1"),
  label: z.string().min(1, "La etiqueta no puede estar vacía")
}).strict().superRefine((item, ctx) => {
  for (let index = 0; index < item.races; index++) {
    if (!item.label.includes(`{${index}}`)) {
      ctx.addIssue({
        code: "custom",
        message: `La etiqueta debe incluir {${index}}`,
        path: ["label"]
      });
    }
  }
});

const TraitCatalogChoiceSchema = z.object({
  key: z.string().min(1, "La clave de la elección no puede estar vacía"),
  options: z.array(TraitCatalogOptionSchema).default([]),
  grants: z.array(TraitCatalogGrantSchema).min(1, "La elección debe indicar al menos una concesión"),
  language: z.enum(["optional", "required"]).optional(),
  source: z.enum(["creatureTypes"]).optional(),
  creatureTypeRaces: z.array(TraitCatalogCreatureTypeRacesSchema).optional()
}).strict().superRefine((choice, ctx) => {
  if (!choice.source && choice.options.length < 1) {
    ctx.addIssue({
      code: "custom",
      message: "La elección debe tener al menos una opción",
      path: ["options"]
    });
  }

  if (choice.creatureTypeRaces !== undefined && choice.source !== "creatureTypes") {
    ctx.addIssue({
      code: "custom",
      message: "Las razas por tipo de criatura solo se admiten con el origen creatureTypes",
      path: ["creatureTypeRaces"]
    });
  }

  const typeIds = new Set<string>();
  (choice.creatureTypeRaces ?? []).forEach((item, index) => {
    if (typeIds.has(item.creatureTypeId)) {
      ctx.addIssue({
        code: "custom",
        message: "El tipo de criatura está repetido",
        path: ["creatureTypeRaces", index, "creatureTypeId"]
      });
    }
    typeIds.add(item.creatureTypeId);
  });

  const names = new Set<string>();
  choice.options.forEach((option, index) => {
    if (names.has(option.name)) {
      ctx.addIssue({
        code: "custom",
        message: `El nombre ${option.name} está repetido`,
        path: ["options", index, "name"]
      });
    }
    names.add(option.name);
  });

  const levels = new Set<number>();
  let total = 0;
  choice.grants.forEach((grant, index) => {
    if (levels.has(grant.atLevel)) {
      ctx.addIssue({
        code: "custom",
        message: `El nivel ${grant.atLevel} está repetido`,
        path: ["grants", index, "atLevel"]
      });
    }
    levels.add(grant.atLevel);
    total += grant.choose;
  });

  const repeatable = choice.options.some(option => option.repeatable);
  if (!choice.source && !repeatable && total > choice.options.length) {
    ctx.addIssue({
      code: "custom",
      message: "La suma de choose no puede superar el número de opciones",
      path: ["grants"]
    });
  }
});

export const TraitCatalogChoicesSchema = z.array(TraitCatalogChoiceSchema).superRefine((choices, ctx) => {
  const keys = new Set<string>();
  choices.forEach((choice, index) => {
    if (keys.has(choice.key)) {
      ctx.addIssue({
        code: "custom",
        message: `La clave ${choice.key} está repetida`,
        path: [index, "key"]
      });
    }
    keys.add(choice.key);
  });
});

export const TraitDamageChoiceRefSchema = z.object({
  traitId: z.string().min(1, "El rasgo referenciado no puede estar vacío"),
  choiceKey: z.string().min(1, "La clave de la elección no puede estar vacía"),
  grantsResistance: z.boolean().optional()
}).strict();

export const TraitHitPointsSchema = z.object({
  perLevel: z
    .number()
    .int("perLevel debe ser un entero")
    .min(1, "perLevel debe ser al menos 1"),
  scope: z.enum(["class", "character"])
}).strict();

const saveDcFormulaSchema = z.string().min(1, "La fórmula de CD no puede estar vacía").superRefine((val, ctx) => {
  const error = validateSystemFormula(val);
  if (error) {
    ctx.addIssue({ code: "custom", message: `saveDcFormula: ${error}` });
  }
});

const classLevelKeySchema = z.string().refine(key => {
  const level = Number(key);
  return Number.isInteger(level) && level >= 1 && level <= 20;
}, { message: "El nivel de clase debe ser un entero entre 1 y 20" });

const traitUsesSchema = z.union([
  z.literal("unlimited"),
  z.number().int("Los usos deben ser un entero").min(1, "Los usos deben ser al menos 1")
]);

const usesByClassLevelSchema = z.record(classLevelKeySchema, traitUsesSchema).superRefine((map, ctx) => {
  if (Object.keys(map).length === 0) {
    ctx.addIssue({ code: "custom", message: "usesByClassLevel no puede estar vacío" });
  }
});

export const TraitDurationSchema = z.object({
  value: z.number().positive("La duración debe ser mayor que 0"),
  unit: z.enum(TRAIT_DURATION_UNITS)
}).strict();

export const TraitActionSchema = z.object({
  activation: z.enum(TRAIT_ACTIVATIONS),
  kind: z.enum(TRAIT_ACTION_KINDS).optional().default("instant"),
  deactivateActivation: z.enum(TRAIT_ACTIVATIONS).optional(),
  duration: TraitDurationSchema.optional(),
  saveDcFormula: saveDcFormulaSchema.optional(),
  uses: traitUsesSchema.optional(),
  usesByClassLevel: usesByClassLevelSchema.optional(),
  recharge: z.enum(SPELL_PRIVILEGE_RECHARGES).nullable().optional()
}).strict().superRefine((action, ctx) => {
  if (action.uses === "unlimited" && action.recharge != null) {
    ctx.addIssue({
      code: "custom",
      message: "La recarga debe ser nula si los usos son ilimitados",
      path: ["recharge"]
    });
  }
});

export const TraitWeaponDamageBonusSchema = z.object({
  when: z.enum(TRAIT_WEAPON_DAMAGE_BONUS_WHENS),
  melee: z.boolean(),
  abilityKeys: z.array(z.string().min(1, "La clave de atributo no puede estar vacía")).min(1).optional(),
  amount: z.number().int("El bono de daño debe ser un entero").min(1, "El bono de daño debe ser al menos 1").optional(),
  amountByClassLevel: z.record(
    classLevelKeySchema,
    z.number().int("El bono de daño debe ser un entero").min(1, "El bono de daño debe ser al menos 1")
  ).optional()
}).strict().superRefine((bonus, ctx) => {
  const hasAmount = bonus.amount !== undefined;
  const levelEntries = Object.keys(bonus.amountByClassLevel ?? {}).length;
  if (!hasAmount && levelEntries === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Debe indicar amount o amountByClassLevel"
    });
  }
});

const mongoObjectId = (message: string) =>
  z.string().refine(val => Types.ObjectId.isValid(val), { message });

const damageTypeIdArraySchema = z.array(
  z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada resistencia debe ser un ID de Mongo válido" })
);

const conditionIdArraySchema = z.array(
  z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada estado debe ser un ID de Mongo válido" })
);

const conditionalResistanceGroupSchema = z
  .string()
  .min(1, "El grupo de resistencia condicional no puede estar vacío")
  .nullish();

export const TraitInnateSpellGrantSchema = z.object({
  spellId: mongoObjectId("El conjuro debe ser un ID de Mongo válido"),
  atLevel: z.number().int().min(1, "El nivel de personaje debe ser al menos 1"),
  slotLevel: z.union([
    z.literal("spellLevel"),
    z.number().int().min(1, "El nivel de ranura debe ser al menos 1").max(9, "El nivel de ranura no puede superar 9")
  ]),
  uses: z.union([
    z.literal("unlimited"),
    z.number().int().min(1, "Los usos deben ser al menos 1")
  ]),
  recharge: z.enum(SPELL_PRIVILEGE_RECHARGES).nullable()
}).strict().superRefine((grant, ctx) => {
  if (grant.uses === "unlimited") {
    if (grant.recharge !== null) {
      ctx.addIssue({
        code: "custom",
        message: "La recarga debe ser nula si los usos son ilimitados",
        path: ["recharge"]
      });
    }
    return;
  }
  if (grant.recharge == null) {
    ctx.addIssue({
      code: "custom",
      message: "La recarga es obligatoria si los usos no son ilimitados",
      path: ["recharge"]
    });
  }
});

export const TraitStackGroupSchema = z.object({
  key: z.string().min(1, "La clave del grupo de acumulación no puede estar vacía"),
  policy: z.enum(TRAIT_STACK_POLICIES),
  rank: z.number().int("El rango debe ser un entero").min(1, "El rango debe ser al menos 1").optional()
}).strict().superRefine((group, ctx) => {
  if (group.policy === "max" && group.rank === undefined) {
    ctx.addIssue({
      code: "custom",
      message: "rank es obligatorio si policy es max",
      path: ["rank"]
    });
  }
});

export const TraitAbilityScoreSchema = z.object({
  key: z.string().min(1, "La clave de atributo no puede estar vacía"),
  bonus: z.number().int("El bono debe ser un entero").refine(value => value !== 0, {
    message: "El bono no puede ser 0"
  }),
  max: z.number().int("El máximo debe ser un entero").min(1, "El máximo debe ser al menos 1").optional()
}).strict();

export const TraitAbilityScoresSchema = z.array(TraitAbilityScoreSchema).min(1, "Debe indicar al menos una característica").superRefine((scores, ctx) => {
  const keys = new Set<string>();
  scores.forEach((score, index) => {
    if (keys.has(score.key)) {
      ctx.addIssue({
        code: "custom",
        message: `La característica ${score.key} está repetida`,
        path: [index, "key"]
      });
    }
    keys.add(score.key);
  });
});

const traitSkillProficiencyValueSchema = z.union([
  z.literal(TRAIT_SKILL_PROFICIENCY_VALUES[0]),
  z.literal(TRAIT_SKILL_PROFICIENCY_VALUES[1]),
  z.literal(TRAIT_SKILL_PROFICIENCY_VALUES[2])
]);

export const TraitSkillProficiencySchema = z.object({
  value: traitSkillProficiencyValueSchema,
  skillIds: z.array(mongoObjectId("Cada skill debe ser un ID de Mongo válido")).min(1, "Debe indicar al menos una skill").optional(),
  attributeKeys: z.array(z.string().min(1, "La clave de atributo no puede estar vacía")).min(1, "Debe indicar al menos una característica").optional()
}).strict();

export const TraitSkillProficienciesSchema = z.array(TraitSkillProficiencySchema).min(1, "Debe indicar al menos una regla de competencia");

function uniqueTraitChoiceKeys(
  data: {
    damageChoices?: Array<{ key: string }> | null;
    catalogChoices?: Array<{ key: string }> | null;
  },
  ctx: z.RefinementCtx
): void {
  const seen = new Set<string>();
  const register = (key: string, path: (string | number)[]) => {
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: `La clave ${key} está repetida`,
        path
      });
      return;
    }
    seen.add(key);
  };

  (data.damageChoices ?? []).forEach((choice, index) => {
    register(choice.key, ["damageChoices", index, "key"]);
  });
  (data.catalogChoices ?? []).forEach((choice, index) => {
    register(choice.key, ["catalogChoices", index, "key"]);
  });
}

export const TraitInnateSpellsSchema = z.object({
  abilityId: mongoObjectId("El atributo debe ser un ID de Mongo válido"),
  grants: z.array(TraitInnateSpellGrantSchema).min(1, "Debe indicar al menos un conjuro innato")
}).strict().superRefine((innateSpells, ctx) => {
  const spellIds = new Set<string>();
  innateSpells.grants.forEach((grant, index) => {
    if (spellIds.has(grant.spellId)) {
      ctx.addIssue({
        code: "custom",
        message: "El conjuro está repetido",
        path: ["grants", index, "spellId"]
      });
    }
    spellIds.add(grant.spellId);
  });
});

const uniqueMongoIdArray = (message: string) =>
  z.array(mongoObjectId(message)).min(1, "Debe indicar al menos un conjuro").superRefine((ids, ctx) => {
    const seen = new Set<string>();
    ids.forEach((id, index) => {
      if (seen.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: "El conjuro está repetido",
          path: [index]
        });
      }
      seen.add(id);
    });
  });

export const TraitGrantedSpellsSchema = uniqueMongoIdArray("Cada conjuro extra debe ser un ID de Mongo válido");

export const TraitCreatureFormExtensionSchema = z.object({
  spellId: mongoObjectId("El conjuro debe ser un ID de Mongo válido"),
  extraPool: z.discriminatedUnion("mode", [CreatureFormPoolIdsSchema, CreatureFormPoolFilterSchema])
}).strict();

export const TraitCreatureFormExtensionsSchema = z.array(TraitCreatureFormExtensionSchema)
  .min(1, "Debe indicar al menos una ampliación de formas")
  .superRefine((extensions, ctx) => {
    const seen = new Set<string>();
    extensions.forEach((extension, index) => {
      if (seen.has(extension.spellId)) {
        ctx.addIssue({
          code: "custom",
          message: "El conjuro está repetido",
          path: [index, "spellId"]
        });
      }
      seen.add(extension.spellId);
    });
  });

export const CreateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional().default([]),
  summary: z.array(z.string()).optional().default([]),
  incompatible_traits: z.array(z.string()).optional().default([]),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  resistances: damageTypeIdArraySchema.optional().default([]),
  conditional_resistances: damageTypeIdArraySchema.optional().default([]),
  conditionalConditionImmunities: conditionIdArraySchema.optional().default([]),
  spellPrivileges: z.array(SpellPrivilegeRuleSchema).optional(),
  companionRoster: TraitCompanionRosterSchema.optional(),
  speed: TraitSpeedSchema.optional(),
  acFormula: acFormulaSchema,
  suppressedByArmorTypeIds: suppressedByArmorTypeIdsSchema,
  ignoresArmorSpeedPenaltyForTypeIds: suppressedByArmorTypeIdsSchema,
  equipmentRestriction: EquipmentRestrictionSchema.nullish(),
  languages: TraitLanguagesSchema.nullish(),
  damageChoices: TraitDamageChoicesSchema.nullish(),
  catalogChoices: TraitCatalogChoicesSchema.nullish(),
  damageChoiceRef: TraitDamageChoiceRefSchema.nullish(),
  hitPoints: TraitHitPointsSchema.nullish(),
  action: TraitActionSchema.nullish(),
  weaponDamageBonus: TraitWeaponDamageBonusSchema.nullish(),
  innateSpells: TraitInnateSpellsSchema.nullish(),
  grantedSpells: TraitGrantedSpellsSchema.nullish(),
  creatureFormExtensions: TraitCreatureFormExtensionsSchema.nullish(),
  abilityScores: TraitAbilityScoresSchema.nullish(),
  skillProficiencies: TraitSkillProficienciesSchema.nullish(),
  stackGroup: TraitStackGroupSchema.nullish(),
  conditionalResistanceGroup: conditionalResistanceGroupSchema
}).superRefine(uniqueTraitChoiceKeys);

export const UpdateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  incompatible_traits: z.array(z.string()).optional(),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  resistances: damageTypeIdArraySchema.optional(),
  conditional_resistances: damageTypeIdArraySchema.optional(),
  conditionalConditionImmunities: conditionIdArraySchema.optional(),
  spellPrivileges: z.array(SpellPrivilegeRuleSchema).optional(),
  companionRoster: TraitCompanionRosterSchema.optional(),
  speed: TraitSpeedSchema.optional(),
  acFormula: acFormulaSchema,
  suppressedByArmorTypeIds: suppressedByArmorTypeIdsSchema,
  ignoresArmorSpeedPenaltyForTypeIds: suppressedByArmorTypeIdsSchema,
  equipmentRestriction: EquipmentRestrictionSchema.nullish(),
  languages: TraitLanguagesSchema.nullish(),
  damageChoices: TraitDamageChoicesSchema.nullish(),
  catalogChoices: TraitCatalogChoicesSchema.nullish(),
  damageChoiceRef: TraitDamageChoiceRefSchema.nullish(),
  hitPoints: TraitHitPointsSchema.nullish(),
  action: TraitActionSchema.nullish(),
  weaponDamageBonus: TraitWeaponDamageBonusSchema.nullish(),
  innateSpells: TraitInnateSpellsSchema.nullish(),
  grantedSpells: TraitGrantedSpellsSchema.nullish(),
  creatureFormExtensions: TraitCreatureFormExtensionsSchema.nullish(),
  abilityScores: TraitAbilityScoresSchema.nullish(),
  skillProficiencies: TraitSkillProficienciesSchema.nullish(),
  stackGroup: TraitStackGroupSchema.nullish(),
  conditionalResistanceGroup: conditionalResistanceGroupSchema
}).superRefine(uniqueTraitChoiceKeys).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
