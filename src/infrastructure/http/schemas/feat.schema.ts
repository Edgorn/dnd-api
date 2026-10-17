import { z } from "zod";

export const featAttributeRequirementSchema = z.object({
  key: z.string().min(1, "La clave no puede estar vacía"),
  min: z.number().int().min(1, "El valor mínimo debe ser al menos 1")
});

export const featRequirementsSchema = z.object({
  attributeMode: z.enum(["all", "any"]).optional(),
  attributes: z.array(featAttributeRequirementSchema).optional()
});

export const createFeatSchema = z.object({
  name: z.string({ message: "El nombre no puede estar vacío" }).min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  ruleset: z.string({ message: "El sistema no puede estar vacío" }).min(1, "El sistema no puede estar vacío"),
  requirements: featRequirementsSchema.optional()
});

export const updateFeatSchema = createFeatSchema.partial().extend({
  requirements: featRequirementsSchema.nullable().optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un campo para modificar" }
);

export type CreateFeatType = z.infer<typeof createFeatSchema>;
export type UpdateFeatType = z.infer<typeof updateFeatSchema>;
