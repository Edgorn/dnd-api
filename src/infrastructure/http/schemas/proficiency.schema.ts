import { z } from "zod";

export const createProficiencySchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  type: z.string().min(1, "El tipo no puede estar vacío"),
  parentProficiencyId: z.string().nullable().default(null),
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
});

export const updateProficiencySchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  type: z.string().min(1, "El tipo no puede estar vacío").optional(),
  parentProficiencyId: z.string().nullable().optional(),
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
});
