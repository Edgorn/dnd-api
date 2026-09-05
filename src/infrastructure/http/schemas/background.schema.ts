import { z } from "zod";
import { CharacterEquipmentSchema, EquipmentChoiceMongoSchema } from "./equipment.schema";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

const IdealSchema = z.object({
  title: z.string().min(1, "El título no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  alignment: z.string().min(1, "El alineamiento no puede estar vacío")
});

const MoneySchema = z.object({
  quantity: z.number().min(0, "La cantidad no puede ser negativa"),
  unit: z.string().min(1, "El identificador de la moneda no puede estar vacío")
});

export const CreateBackgroundSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  god: z.boolean().optional(),
  traits: z.array(z.string()).nullable().optional(),
  traits_data: z.record(z.string(), z.any()).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional(),
  personality_traits: z.array(z.string()).nullable().optional(),
  ideals: z.array(IdealSchema).nullable().optional(),
  bonds: z.array(z.string()).nullable().optional(),
  flaws: z.array(z.string()).nullable().optional(),
  money: z.array(MoneySchema).nullable().optional(),
  equipment_choices: z.array(EquipmentChoiceMongoSchema).nullable().optional(),
  equipment: z.array(CharacterEquipmentSchema).nullable().optional()
});

export const UpdateBackgroundSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  god: z.boolean().optional(),
  traits: z.array(z.string()).nullable().optional(),
  traits_data: z.record(z.string(), z.any()).nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional(),
  personality_traits: z.array(z.string()).nullable().optional(),
  ideals: z.array(IdealSchema).nullable().optional(),
  bonds: z.array(z.string()).nullable().optional(),
  flaws: z.array(z.string()).nullable().optional(),
  money: z.array(MoneySchema).nullable().optional(),
  equipment_choices: z.array(EquipmentChoiceMongoSchema).nullable().optional(),
  equipment: z.array(CharacterEquipmentSchema).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
