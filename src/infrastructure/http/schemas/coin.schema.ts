import { z } from "zod";

export const CreateCoinSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  abbreviation: z.string().min(1, "La abreviatura no puede estar vacía"),
  isBase: z.boolean().optional(),
  multiplier: z.number().positive("El multiplicador debe ser un número positivo"),
  weight: z.number().min(0, "El peso no puede ser negativo"),
  color: z.string().min(1, "El color no puede estar vacío")
});

export const UpdateCoinSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  abbreviation: z.string().min(1, "La abreviatura no puede estar vacía").optional(),
  isBase: z.boolean().optional(),
  multiplier: z.number().positive("El multiplicador debe ser un número positivo").optional(),
  weight: z.number().min(0, "El peso no puede ser negativo").optional(),
  color: z.string().min(1, "El color no puede estar vacío").optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
