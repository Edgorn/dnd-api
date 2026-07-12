import { z } from "zod";

export const CreateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional().default([]),
  summary: z.array(z.string()).optional().default([]),
  incompatible_traits: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional()
});

export const UpdateTraitSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  incompatible_traits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
