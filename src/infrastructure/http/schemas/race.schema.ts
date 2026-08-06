import { z } from "zod";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

export const CreateRaceSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).nullable().optional(),
  alignment: z.string().nullable().optional(),
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  img: z.string().nullable().optional(),
  ability_bonuses: z.array(z.any()).nullable().optional(),
  speed: z.object({
    walk: z.number()
  }),
  size: z.string().min(1, "El tamaño no puede estar vacío"),
  size_range: z.object({
    min: z.number(),
    max: z.number()
  }).nullable().optional(),
  weight_range: z.object({
    min: z.number(),
    max: z.number()
  }).nullable().optional(),
  age: z.object({
    maturity: z.number(),
    expectancy: z.number()
  }).nullable().optional(),
  traits: z.array(z.string()).nullable().optional(),
  traits_data: z.record(z.string(), z.any()).nullable().optional(),
  languages: z.object({
    speaks: z.array(z.string()).optional(),
    understands: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional(),
  parentId: z.string().nullable().optional(),
  subraces_name: z.string().nullable().optional(),
  spell_choices: z.array(ChoiceMongoSchema).nullable().optional(),
  spellcasting: z.string().nullable().optional()
});

export const UpdateRaceSchema = CreateRaceSchema.partial().refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
