import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CharacterIdParamsSchema = z.object({
  id: z
    .string()
    .min(1, "ID de personaje requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
});

export const ToggleFavoriteEquipmentSchema = z.object({
  id: z.string().min(1, "ID de personaje requerido"),
  equip: z.string().min(1, "ID de equipamiento requerido"),
  isMagic: z.boolean(),
  isBond: z.boolean(),
  isFavorite: z.boolean(),
});

export const UpdateCharacterMoneySchema = z.object({
  money: z.array(
    z.object({
      unit: z.string().min(1, "ID de moneda requerido"),
      quantity: z.number(),
    })
  ),
});

export const UpdateCharacterXpSchema = z.object({
  XP: z.number().int().min(0, "La experiencia no puede ser negativa"),
});

const CharacterEquipmentMutationSchema = z.object({
  equip: z.string().min(1, "ID de equipamiento requerido"),
  quantity: z.number().int().min(1, "La cantidad debe ser un entero mayor o igual a 1"),
  isMagic: z.boolean(),
  isBond: z.boolean(),
});

export const AddCharacterEquipmentSchema = CharacterEquipmentMutationSchema;
export const DeleteCharacterEquipmentSchema = CharacterEquipmentMutationSchema;

export const UpdateCharacterEquipmentEquippedSchema = z.object({
  equip: z.string().min(1, "ID de equipamiento requerido"),
  isMagic: z.boolean(),
  isBond: z.boolean(),
  equipped: z.boolean(),
});
