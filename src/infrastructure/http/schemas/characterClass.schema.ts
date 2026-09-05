import { z } from "zod";
import { CharacterEquipmentSchema, EquipmentChoiceMongoSchema } from "./equipment.schema";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

const characterClassFields = {
  hit_die: z.number().int().min(1).optional(),
  proficiencies: z.array(z.string()).optional(),
  saving_throws: z.array(z.string().min(1)).optional(),
  skill_choices: ChoiceMongoSchema.nullable().optional(),
  equipment: z.array(CharacterEquipmentSchema).nullable().optional(),
  equipment_choices: z.array(EquipmentChoiceMongoSchema).nullable().optional()
};

export const CreateCharacterClassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
});

export const UpdateCharacterClassSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
