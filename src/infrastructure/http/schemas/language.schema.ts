import { z } from 'zod';

export const createLanguageSchema = z.object({
  name: z.string({ message: "El nombre no puede estar vacío" }).min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  type: z.string().optional(),
  script: z.string().optional(),
  ruleset: z.string({ message: "El sistema no puede estar vacío" })
});

export const updateLanguageSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  script: z.string().optional(),
  ruleset: z.string({ message: "El sistema no puede estar vacío" })
});

export type CreateLanguageType = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageType = z.infer<typeof updateLanguageSchema>;
