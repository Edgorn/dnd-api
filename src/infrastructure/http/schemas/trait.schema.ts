import { z } from "zod";
import { Types } from "mongoose";

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

export const CreateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional().default([]),
  summary: z.array(z.string()).optional().default([]),
  incompatible_traits: z.array(z.string()).optional().default([]),
  proficiencies: z.array(z.string()).optional(),
  skills: z.array(z.string().refine(val => Types.ObjectId.isValid(val), { message: "Cada skill debe ser un ID de Mongo válido" })).optional(),
  spellPrivileges: z.array(SpellPrivilegeRuleSchema).optional(),
  speed: TraitSpeedSchema.optional()
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
  speed: TraitSpeedSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
