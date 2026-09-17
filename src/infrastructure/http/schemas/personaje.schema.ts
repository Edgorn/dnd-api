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

const AbilityScoreIncreaseSchema = z.object({
  key: z.string().min(1, "La clave de característica es requerida"),
  bonus: z.union([z.literal(1), z.literal(2)], {
    message: "El bonus de característica debe ser 1 o 2",
  }),
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
  abilityScore: z
    .object({
      increases: z
        .array(AbilityScoreIncreaseSchema)
        .min(1, "Debe indicar al menos un incremento")
        .max(2, "Como máximo 2 incrementos"),
    })
    .optional(),
  feat: z
    .string()
    .regex(objectIdRegex, "La dote debe ser un ObjectId válido de MongoDB")
    .optional(),
}).superRefine((data, ctx) => {
  if (data.abilityScore !== undefined && data.feat !== undefined) {
    ctx.addIssue({
      code: "custom",
      message: "Debe elegir mejora de característica o dote, no ambas",
      path: ["feat"],
    });
  }

  const increases = data.abilityScore?.increases;
  if (!increases) return;

  const seen = new Set<string>();
  let total = 0;
  for (let i = 0; i < increases.length; i++) {
    if (seen.has(increases[i].key)) {
      ctx.addIssue({
        code: "custom",
        message: `abilityScore.increases contiene la característica duplicada ${increases[i].key}`,
        path: ["abilityScore", "increases", i, "key"],
      });
    }
    seen.add(increases[i].key);
    total += increases[i].bonus;
  }

  if (total !== 2) {
    ctx.addIssue({
      code: "custom",
      message: "Los incrementos de característica deben sumar 2 puntos",
      path: ["abilityScore", "increases"],
    });
  }
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
