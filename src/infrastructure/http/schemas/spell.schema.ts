import { z } from "zod";

export const CastingTimeSchema = z.object({
  value: z.number().min(0, "El valor del tiempo de lanzamiento debe ser mayor o igual a 0"),
  unit: z.string().min(1, "La unidad del tiempo de lanzamiento no puede estar vacía"),
  condition: z.string().optional()
});

export const SpellRangeAreaSchema = z.object({
  shape: z.string().min(1, "La forma no puede estar vacía"),
  value: z.number().min(0, "El valor del área debe ser positivo"),
  unit: z.string().min(1, "La unidad del área no puede estar vacía")
});

export const SpellRangeSchema = z.object({
  type: z.string().min(1, "El tipo de rango no puede estar vacío"),
  value: z.number().min(0, "El valor del rango debe ser mayor o igual a 0").optional(),
  unit: z.string().min(1, "La unidad del rango no puede estar vacía").optional(),
  area: SpellRangeAreaSchema.optional()
});

export const SpellComponentsSchema = z.object({
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  materialsDescription: z.string().optional()
});

export const SpellDurationSchema = z.object({
  type: z.string().min(1, "El tipo de duración no puede estar vacío"),
  value: z.number().min(0, "El valor de la duración debe ser mayor o igual a 0").optional(),
  unit: z.string().min(1, "La unidad de duración no puede estar vacía").optional(),
  concentration: z.boolean()
});

export const DamageComponentSchema = z.object({
  diceCount: z.number().min(1, "El número de dados debe ser al menos 1"),
  diceType: z.string().min(2, "El tipo de dado no puede estar vacío (ej: d6)"),
  type: z.string().min(1, "El ID del tipo de daño no puede estar vacío")
});

export const SpellDamageScalingStepTypeSchema = z.enum(["add", "override"]);
export const SpellDamageScalingModeSchema = z.enum(["per_slot_level", "character_level"]);

export const ScalingStepSchema = z.object({
  level: z.number().min(0, "El nivel debe ser mayor o igual a 0"),
  type: SpellDamageScalingStepTypeSchema,
  components: z.array(DamageComponentSchema).default([])
});

export const SpellDamageScalingSchema = z.object({
  mode: SpellDamageScalingModeSchema,
  steps: z.array(ScalingStepSchema).default([])
});

export const SpellDamageSchema = z.object({
  base: z.array(DamageComponentSchema).default([]),
  scaling: SpellDamageScalingSchema.optional()
});

export const CreateSpellSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()),
  level: z.number().min(0, "El nivel debe ser mayor o igual a 0"),
  classes: z.array(z.string()).default([]),
  school: z.string().optional(),
  castingTime: CastingTimeSchema.optional(),
  range: SpellRangeSchema.optional(),
  components: SpellComponentsSchema.optional(),
  duration: SpellDurationSchema.optional(),
  damage: SpellDamageSchema.optional()
});

export const UpdateSpellSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  level: z.number().min(0).optional(),
  classes: z.array(z.string()).optional(),
  school: z.string().optional(),
  castingTime: CastingTimeSchema.optional(),
  range: SpellRangeSchema.optional(),
  components: SpellComponentsSchema.optional(),
  duration: SpellDurationSchema.optional(),
  damage: SpellDamageSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
