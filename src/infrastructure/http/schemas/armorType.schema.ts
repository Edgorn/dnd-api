import { z } from "zod";

export const ArmorDurationSchema = z.object({
  value: z.number().positive("El valor de tiempo debe ser positivo"),
  unit: z.string().min(1, "La unidad de tiempo no puede estar vacía")
});

export const CreateArmorTypeSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  don: ArmorDurationSchema,
  doff: ArmorDurationSchema
});

export const UpdateArmorTypeSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().min(1, "La descripción no puede estar vacía").optional(),
  don: ArmorDurationSchema.optional(),
  doff: ArmorDurationSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
