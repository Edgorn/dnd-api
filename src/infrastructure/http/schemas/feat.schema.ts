import { z } from "zod";

export const featAttributeRequirementSchema = z.object({
  key: z.string().min(1, "Attribute key is required"),
  min: z.number().int().min(1, "Minimum value must be at least 1")
});

export const featRequirementsSchema = z.object({
  attributeMode: z.enum(["all", "any"]).optional(),
  attributes: z.array(featAttributeRequirementSchema).optional()
});

export const createFeatSchema = z.object({
  name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters long"),
  description: z.array(z.string()).optional(),
  summary: z.array(z.string()).optional(),
  ruleset: z.string({ message: "Ruleset is required" }).min(1, "Ruleset is required"),
  requirements: featRequirementsSchema.optional()
});

export const updateFeatSchema = createFeatSchema.partial().extend({
  requirements: featRequirementsSchema.nullable().optional()
}).refine(
  data => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateFeatType = z.infer<typeof createFeatSchema>;
export type UpdateFeatType = z.infer<typeof updateFeatSchema>;
