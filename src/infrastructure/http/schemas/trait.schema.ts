import { z } from "zod";
import { Types } from "mongoose";
import { validateSystemFormula } from "../../../utils/formulaValidation";
import { EquipmentMaterialSchema } from "./equipment.schema";
import {
  EQUIPMENT_RESTRICTION_ENFORCEMENTS,
  EQUIPMENT_RESTRICTION_SCOPES
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
    recharge: z.enum(["shortRest", "longRest", "shortOrLongRest"]).nullable()
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

const TraitDamageChoiceOptionSchema = z.object({
  name: z.string().min(1, "El nombre de la fila no puede estar vacío"),
  damageTypeId: z.string().refine(val => Types.ObjectId.isValid(val), {
    message: "El tipo de daño debe ser un ID de Mongo válido"
  })
}).strict();

const TraitDamageChoiceSchema = z.object({
  key: z.string().min(1, "La clave de la elección no puede estar vacía"),
  choose: z.number().int().min(1, "Debe elegir al menos 1 opción"),
  options: z.array(TraitDamageChoiceOptionSchema).min(1, "La elección debe tener al menos una opción")
}).strict().superRefine((choice, ctx) => {
  if (choice.choose > choice.options.length) {
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
        message: `El tipo de criatura ${item.creatureTypeId} está repetido`,
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

export const CreateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional().default([]),
  summary: z.array(z.string()).optional().default([]),
  incompatible_traits: z.array(z.string()).optional().default([]),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  resistances: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada resistencia debe ser un ID de Mongo válido" })).optional().default([]),
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
  hitPoints: TraitHitPointsSchema.nullish()
});

export const UpdateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  incompatible_traits: z.array(z.string()).optional(),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  resistances: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada resistencia debe ser un ID de Mongo válido" })).optional(),
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
  hitPoints: TraitHitPointsSchema.nullish()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
