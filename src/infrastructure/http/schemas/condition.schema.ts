import { z } from "zod";

const conditionLevelSchema = z.object({
  level: z.number().int("El nivel debe ser un entero").positive("El nivel debe ser un entero positivo"),
  description: z.string().min(1, "La descripción del nivel no puede estar vacía")
});

const refineConditionLevels = (
  data: {
    levels?: Array<{ level: number; description: string }>;
    cumulative?: boolean;
    recovery?: Array<{ restKey: string; delta: number }>;
  },
  ctx: z.RefinementCtx
) => {
  if (data.levels) {
    const seen = new Set<number>();
    data.levels.forEach((row, index) => {
      if (seen.has(row.level)) {
        ctx.addIssue({
          code: "custom",
          message: `El nivel ${row.level} está repetido`,
          path: ["levels", index, "level"]
        });
      }
      seen.add(row.level);
    });
  }

  if (data.cumulative === true && (!data.levels || data.levels.length === 0)) {
    ctx.addIssue({
      code: "custom",
      message: "Un estado acumulativo debe tener al menos un nivel",
      path: ["levels"]
    });
  }

  if (data.recovery) {
    const seen = new Set<string>();
    data.recovery.forEach((row, index) => {
      if (seen.has(row.restKey)) {
        ctx.addIssue({
          code: "custom",
          message: `recovery contiene la clave duplicada ${row.restKey}`,
          path: ["recovery", index, "restKey"]
        });
      }
      seen.add(row.restKey);
    });
  }
};

const conditionRecoverySchema = z.object({
  restKey: z.string().min(1, "La clave de recuperación no puede estar vacía"),
  delta: z.number().int("El delta debe ser un entero").refine(
    (value) => value !== 0,
    { message: "El delta de recuperación no puede ser 0" }
  )
}).strict();

const createConditionFields = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía").optional(),
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  levels: z.array(conditionLevelSchema).optional(),
  cumulative: z.boolean().optional(),
  recovery: z.array(conditionRecoverySchema).optional()
});

export const createConditionSchema = createConditionFields.superRefine(refineConditionLevels);

export const updateConditionSchema = createConditionFields
  .partial()
  .superRefine(refineConditionLevels)
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debe proporcionar al menos un campo para modificar" }
  );

export type CreateConditionInput = z.infer<typeof createConditionSchema>;
export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
