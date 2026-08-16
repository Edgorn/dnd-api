import { z } from "zod";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

export const CreateBackgroundSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  god: z.boolean().optional(),
  traits: z.array(z.string()).nullable().optional(),
  traits_data: z.record(z.string(), z.any()).nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional()
});

export const UpdateBackgroundSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  god: z.boolean().optional(),
  traits: z.array(z.string()).nullable().optional(),
  traits_data: z.record(z.string(), z.any()).nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
