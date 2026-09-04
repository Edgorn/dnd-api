import { z } from "zod";

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
