import { z } from "zod";

export const createProficiencySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  parentProficiencyId: z.string().nullable().default(null),
  ruleset: z.string().min(1, "Ruleset is required"),
});

export const updateProficiencySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.string().min(1, "Type is required").optional(),
  parentProficiencyId: z.string().nullable().optional(),
  ruleset: z.string().min(1, "Ruleset is required").optional(),
});
