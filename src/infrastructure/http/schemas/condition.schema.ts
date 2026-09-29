import { z } from "zod";

export const createConditionSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía").optional(),
  ruleset: z.string().min(1, "El sistema no puede estar vacío")
});

export const updateConditionSchema = createConditionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un campo para modificar" }
);

export type CreateConditionInput = z.infer<typeof createConditionSchema>;
export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
