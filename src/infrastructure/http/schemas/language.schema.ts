import { z } from 'zod';

export const createLanguageSchema = z.object({
  name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters long"),
  description: z.string().optional(),
  type: z.string().optional(),
  script: z.string().optional(),
  ruleset: z.string({ message: "Ruleset is required" })
});

export const updateLanguageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  script: z.string().optional()
});

export type CreateLanguageType = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageType = z.infer<typeof updateLanguageSchema>;
