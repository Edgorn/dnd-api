import { z } from "zod";
import { Types } from "mongoose";
import { validateSystemFormula } from "../../../utils/formulaValidation";

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

export const TraitDamageChoiceRefSchema = z.object({
  traitId: z.string().min(1, "El rasgo referenciado no puede estar vacío"),
  choiceKey: z.string().min(1, "La clave de la elección no puede estar vacía"),
  grantsResistance: z.boolean().optional()
}).strict();

export const CreateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional().default([]),
  summary: z.array(z.string()).optional().default([]),
  incompatible_traits: z.array(z.string()).optional().default([]),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  spellPrivileges: z.array(SpellPrivilegeRuleSchema).optional(),
  companionRoster: TraitCompanionRosterSchema.optional(),
  speed: TraitSpeedSchema.optional(),
  acFormula: acFormulaSchema,
  suppressedByArmorTypeIds: suppressedByArmorTypeIdsSchema,
  languages: TraitLanguagesSchema.nullish(),
  damageChoices: TraitDamageChoicesSchema.nullish(),
  damageChoiceRef: TraitDamageChoiceRefSchema.nullish()
});

export const UpdateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  incompatible_traits: z.array(z.string()).optional(),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  spellPrivileges: z.array(SpellPrivilegeRuleSchema).optional(),
  companionRoster: TraitCompanionRosterSchema.optional(),
  speed: TraitSpeedSchema.optional(),
  acFormula: acFormulaSchema,
  suppressedByArmorTypeIds: suppressedByArmorTypeIdsSchema,
  languages: TraitLanguagesSchema.nullish(),
  damageChoices: TraitDamageChoicesSchema.nullish(),
  damageChoiceRef: TraitDamageChoiceRefSchema.nullish()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
