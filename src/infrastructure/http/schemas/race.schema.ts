import { z } from "zod";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.array(z.union([z.string(), z.number()]))).optional()
});

export const CreateRaceSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional(),
  alignment: z.string().optional(),
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  img: z.string().optional(),
  ability_bonuses: z.array(z.any()).optional(),
  speed: z.object({
    walk: z.number()
  }),
  size: z.string().min(1, "El tamaño no puede estar vacío"),
  size_range: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  weight_range: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  age: z.object({
    maturity: z.number(),
    expectancy: z.number()
  }).optional(),
  traits: z.array(z.string()).optional(),
  traits_data: z.record(z.string(), z.any()).optional(),
  languages: z.object({
    speaks: z.array(z.string()).optional(),
    understands: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional(),
  language_choices: ChoiceMongoSchema.optional(),
  parentId: z.string().optional(),
  subraces_name: z.string().optional(),
  spell_choices: z.array(z.any()).optional()
});

export const UpdateRaceSchema = CreateRaceSchema.partial().refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
