import { Types } from "mongoose";
import { z } from "zod";
import { CREATURE_FORM_PURPOSES } from "../../../domain/types/creatureForm.types";

const mongoId = z.string().refine(val => Types.ObjectId.isValid(val), {
  message: "Debe ser un ID de Mongo válido"
});

export const CreatureFormPoolIdsSchema = z.object({
  mode: z.literal("ids"),
  creatureIds: z.array(mongoId).min(1, "Debe indicar al menos una criatura")
}).strict().superRefine((pool, ctx) => {
  if (new Set(pool.creatureIds).size !== pool.creatureIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Los IDs de criatura no pueden repetirse",
      path: ["creatureIds"]
    });
  }
});

export const CreatureFormPoolFilterSchema = z.object({
  mode: z.literal("filter"),
  creatureTypeIds: z.array(mongoId).optional(),
  maxCR: z.number().min(0, "El CR máximo no puede ser negativo").optional(),
  sizes: z.array(z.string().min(1, "El tamaño no puede estar vacío")).optional(),
  tags: z.array(z.string().min(1, "La etiqueta no puede estar vacía")).optional()
}).strict().superRefine((pool, ctx) => {
  if (pool.creatureTypeIds && new Set(pool.creatureTypeIds).size !== pool.creatureTypeIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Los tipos de criatura no pueden repetirse",
      path: ["creatureTypeIds"]
    });
  }
});

export const CreatureFormSchema = z.object({
  purpose: z.enum(CREATURE_FORM_PURPOSES),
  choose: z.number().int().min(1, "Debe poder elegirse al menos una forma").default(1),
  replaceOnRecast: z.boolean().default(true),
  pool: z.discriminatedUnion("mode", [CreatureFormPoolIdsSchema, CreatureFormPoolFilterSchema])
}).strict();

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
  bonus: z.number().int().default(0),
  type: z.string().min(1, "El ID del tipo de daño no puede estar vacío").optional(),
  choice: z.string().min(1, "La clave de la elección de daño no puede estar vacía").optional()
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

export const SpellDamageChoiceSchema = z.object({
  key: z.string().min(1, "La clave de la elección no puede estar vacía"),
  choose: z.number().int().min(1, "Debe elegirse al menos una opción"),
  options: z.array(z.string().min(1, "El ID de la opción de daño no puede estar vacío")).min(1, "La elección debe incluir al menos una opción")
});

const validateSpellDamage = (
  data: {
    choices?: { key: string; choose: number; options: string[] }[];
    base: { type?: string; choice?: string }[];
    scaling?: { steps: { components: { type?: string; choice?: string }[] }[] };
  },
  ctx: z.RefinementCtx
) => {
  const choices = data.choices ?? [];
  const keys = new Set<string>();

  choices.forEach((choice, index) => {
    if (keys.has(choice.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La clave de la elección está duplicada",
        path: ["choices", index, "key"]
      });
    }
    keys.add(choice.key);

    if (choice.choose > choice.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número de opciones a elegir no puede superar las opciones disponibles",
        path: ["choices", index, "choose"]
      });
    }

    if (new Set(choice.options).size !== choice.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las opciones de la elección no pueden repetirse",
        path: ["choices", index, "options"]
      });
    }
  });

  const usedKeys = new Set<string>();

  const checkComponent = (
    component: { type?: string; choice?: string },
    path: (string | number)[]
  ) => {
    const hasType = component.type !== undefined;
    const hasChoice = component.choice !== undefined;
    if (hasType === hasChoice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: hasType
          ? "El componente debe indicar un tipo fijo o una elección, no ambos"
          : "El componente debe indicar un tipo fijo o una elección",
        path: [...path, "choice"]
      });
    }
    if (hasChoice && !keys.has(component.choice as string)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La elección indicada no existe",
        path: [...path, "choice"]
      });
    }
    if (hasChoice) {
      usedKeys.add(component.choice as string);
    }
  };

  data.base.forEach((component, index) => {
    checkComponent(component, ["base", index]);
  });

  data.scaling?.steps.forEach((step, stepIndex) => {
    step.components.forEach((component, componentIndex) => {
      checkComponent(component, ["scaling", "steps", stepIndex, "components", componentIndex]);
    });
  });

  choices.forEach((choice, index) => {
    if (!usedKeys.has(choice.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La elección debe usarse en al menos un componente",
        path: ["choices", index, "key"]
      });
    }
  });
};

export const SpellDamageSchema = z.object({
  choices: z.array(SpellDamageChoiceSchema).optional(),
  base: z.array(DamageComponentSchema).default([]),
  scaling: SpellDamageScalingSchema.optional()
}).superRefine(validateSpellDamage);

export const SpellTableSchema = z.object({
  headers: z.array(z.string().min(1, "La cabecera no puede estar vacía")).min(1, "La tabla debe incluir al menos una cabecera"),
  rows: z.array(z.array(z.string()).min(1, "La fila debe incluir al menos una celda")).min(1, "La tabla debe incluir al menos una fila")
}).superRefine((table, ctx) => {
  table.rows.forEach((row, index) => {
    if (row.length !== table.headers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada fila debe tener el mismo número de celdas que las cabeceras",
        path: ["rows", index]
      });
    }
  });
});

const rejectLegacyCastingTime = (data: { castingTime?: unknown }, ctx: z.RefinementCtx) => {
  if (data.castingTime !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Usa castingTimes en lugar de castingTime",
      path: ["castingTime"]
    });
  }
};

export const CreateSpellSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()),
  level: z.number().min(0, "El nivel debe ser mayor o igual a 0"),
  classes: z.array(z.string()).default([]),
  school: z.string().optional(),
  castingTimes: z.array(CastingTimeSchema).min(1, "Debe indicar al menos un tiempo de lanzamiento").optional(),
  castingTime: z.unknown().optional(),
  range: SpellRangeSchema.optional(),
  components: SpellComponentsSchema.optional(),
  duration: SpellDurationSchema.optional(),
  damage: SpellDamageSchema.optional(),
  creatureForm: CreatureFormSchema.optional(),
  tables: z.array(SpellTableSchema).optional(),
  ritual: z.boolean()
}).superRefine(rejectLegacyCastingTime);

export const UpdateSpellSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  level: z.number().min(0).optional(),
  classes: z.array(z.string()).optional(),
  school: z.string().optional(),
  castingTimes: z.array(CastingTimeSchema).min(1, "Debe indicar al menos un tiempo de lanzamiento").optional(),
  castingTime: z.unknown().optional(),
  range: SpellRangeSchema.optional(),
  components: SpellComponentsSchema.optional(),
  duration: SpellDurationSchema.optional(),
  damage: SpellDamageSchema.optional(),
  creatureForm: CreatureFormSchema.nullable().optional(),
  tables: z.array(SpellTableSchema).optional(),
  ritual: z.boolean().optional()
}).superRefine(rejectLegacyCastingTime).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
