import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CharacterIdParamsSchema = z.object({
  id: z
    .string()
    .min(1, "ID de personaje requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
});

export const LevelUpDataQuerySchema = z.object({
  class: z.string().min(1, "ID de clase requerido"),
});

export const ToggleFavoriteEquipmentSchema = z.object({
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

export const LevelUpSchema = z.object({
  class: z.string().min(1, "ID de clase requerido"),
  hpIncrease: z
    .number()
    .int("El incremento de PG debe ser un entero")
    .min(1, "El incremento de PG debe ser al menos 1"),
  spells: z
    .array(
      z.array(
        z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB")
      )
    )
    .optional(),
  subclass: z
    .string()
    .regex(objectIdRegex, "La subclase debe ser un ObjectId válido de MongoDB")
    .optional(),
});

export const PrepareSpellsSchema = z.object({
  class: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  spells: z.array(
    z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB")
  ),
});

export const LearnSpellsSchema = z.object({
  class: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  spells: z
    .array(
      z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB")
    )
    .min(1, "Debe indicar al menos un conjuro"),
});

export const BindSpellPrivilegesParamsSchema = z.object({
  id: z
    .string()
    .min(1, "ID de personaje requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
  traitId: z.string().min(1, "ID de rasgo requerido"),
});

export const BindSpellPrivilegesSchema = z.object({
  class: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  selections: z.array(
    z.array(
      z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB")
    )
  )
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
