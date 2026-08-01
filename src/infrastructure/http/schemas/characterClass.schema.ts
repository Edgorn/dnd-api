import { z } from "zod";

export const CreateCharacterClassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional()
});

export const UpdateCharacterClassSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
