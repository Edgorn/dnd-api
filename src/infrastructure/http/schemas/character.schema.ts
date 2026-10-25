import { z } from "zod";
import { SPELL_SLOT_POOLS } from "../../../domain/types/system.types";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CharacterIdParamsSchema = z.object({
  id: z
    .string()
    .min(1, "ID de personaje requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
});

export const CharacterEquipmentInstanceParamsSchema = CharacterIdParamsSchema.extend({
  instanceId: z
    .string()
    .min(1, "ID de instancia requerido")
    .regex(objectIdRegex, "El instanceId debe ser un ObjectId válido de MongoDB"),
});

export const LevelUpDataQuerySchema = z.object({
  class: z.string().min(1, "ID de clase requerido"),
});

export const ToggleFavoriteEquipmentSchema = z.object({
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
  xp: z.number().int().min(0, "La experiencia no puede ser negativa"),
});

const AbilityScoreIncreaseSchema = z.object({
  key: z.string().min(1, "La clave de característica es requerida"),
  bonus: z.union([z.literal(1), z.literal(2)], {
    message: "El bonus de característica debe ser 1 o 2",
  }),
});

const CatalogChoiceEntrySchema = z.object({
  name: z.string().min(1, "El nombre de la opción no puede estar vacío"),
  inputs: z.array(
    z.string().trim().min(1, "Cada texto debe tener entre 1 y 80 caracteres").max(80, "Cada texto debe tener entre 1 y 80 caracteres")
  ).optional(),
  raceIds: z.array(
    z.string().regex(objectIdRegex, "Cada raza debe ser un ObjectId válido de MongoDB")
  ).optional(),
  languageId: z.string().min(1, "El idioma no puede estar vacío").nullable().optional()
}).strict();

export const TraitChoicesSchema = z.record(
  z.string().min(1, "El id del rasgo no puede estar vacío"),
  z.record(
    z.string().min(1, "La clave de la elección no puede estar vacía"),
    z.array(z.union([
      z.string().min(1, "El nombre de la fila no puede estar vacío"),
      CatalogChoiceEntrySchema
    ]))
  )
);

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
  spellReplacements: z
    .array(
      z.object({
        from: z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB"),
        to: z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB"),
      })
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
  abilityScoreOption: z
    .string()
    .regex(objectIdRegex, "La opción alternativa debe ser un ObjectId válido de MongoDB")
    .optional(),
  traitChoices: TraitChoicesSchema.optional(),
  skillPicks: z
    .array(z.string().min(1, "Cada habilidad no puede estar vacía"))
    .optional(),
  skillProficiencyPicks: z
    .array(z.string().min(1, "Cada habilidad no puede estar vacía"))
    .optional(),
  proficiencyPicks: z
    .array(
      z.array(z.string().min(1, "Cada competencia no puede estar vacía"))
    )
    .optional(),
  optionPicks: z
    .array(
      z.object({
        groupId: z.string().regex(objectIdRegex, "groupId debe ser un ObjectId válido de MongoDB"),
        add: z.array(z.string().regex(objectIdRegex, "Cada opción debe ser un ObjectId válido de MongoDB")),
        replace: z
          .array(
            z.object({
              from: z.string().regex(objectIdRegex, "from debe ser un ObjectId válido de MongoDB"),
              to: z.string().regex(objectIdRegex, "to debe ser un ObjectId válido de MongoDB")
            }).strict()
          )
          .optional()
      }).strict()
    )
    .optional(),
}).superRefine((data, ctx) => {
  if (data.abilityScore !== undefined && data.abilityScoreOption !== undefined) {
    ctx.addIssue({
      code: "custom",
      message: "Debe elegir mejora de característica o una opción, no ambas",
      path: ["abilityScoreOption"],
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

export const CopySpellsSchema = z.object({
  class: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  spells: z
    .array(
      z.string().regex(objectIdRegex, "Cada conjuro debe ser un ObjectId válido de MongoDB")
    )
    .min(1, "Debe indicar al menos un conjuro"),
  traitId: z.string().regex(objectIdRegex, "El ID de rasgo debe ser un ObjectId válido de MongoDB").optional(),
});

export const SpendHitDiceSchema = z.object({
  classId: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  count: z.number().int().min(1, "Debe gastar al menos 1 dado de golpe"),
  hpGained: z.number().int().min(0, "Los PG recuperados no pueden ser negativos"),
});

export const ApplyCharacterHpSchema = z.object({
  amount: z.number().int().min(1, "La cantidad debe ser un entero positivo"),
});

export const CharacterRestSchema = z.object({
  type: z.string().min(1, "El descanso debe indicar un tipo"),
  traitChoices: TraitChoicesSchema.optional(),
  hitDiceSpends: z.array(SpendHitDiceSchema).optional(),
});

export const SpendSpellSlotSchema = z.object({
  classId: z.string().regex(objectIdRegex, "El ID de clase debe ser un ObjectId válido de MongoDB"),
  pool: z.enum(SPELL_SLOT_POOLS, { error: "pool debe ser standard o fixedLevel" }),
  level: z.number().int().min(1, "El nivel de ranura debe estar entre 1 y 9").max(9, "El nivel de ranura debe estar entre 1 y 9"),
});

export const CharacterConditionParamsSchema = CharacterIdParamsSchema.extend({
  conditionId: z
    .string()
    .min(1, "ID de estado requerido")
    .regex(objectIdRegex, "El ID de estado debe ser un ObjectId válido de MongoDB"),
});

export const ApplyCharacterConditionSchema = z.object({
  conditionId: z.string().regex(objectIdRegex, "El ID de estado debe ser un ObjectId válido de MongoDB"),
  level: z.number().int().min(1, "El nivel añadido debe ser un entero positivo").optional(),
});

export const UpdateCharacterConditionSchema = z.object({
  delta: z.number().int("El cambio de nivel debe ser un entero").refine(
    (value) => value !== 0,
    { message: "El cambio de nivel no puede ser 0" }
  ),
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

export const AddCharacterEquipmentSchema = z.object({
  equipmentId: z
    .string()
    .min(1, "ID de equipamiento requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
  quantity: z.number().int().min(1, "La cantidad debe ser un entero mayor o igual a 1"),
});

export const DeleteCharacterEquipmentQuerySchema = z.object({
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser un entero mayor o igual a 1").optional(),
});

export const UpdateCharacterEquipmentEquippedSchema = z.object({
  equipped: z.boolean(),
});

export const BindWeaponBondSchema = z.object({
  isBond: z.boolean(),
});

export const UseTraitSchema = z.preprocess(
  value => value ?? {},
  z.object({
    equipmentId: z
      .string()
      .min(1, "ID de equipamiento requerido")
      .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB")
      .optional()
  })
);

export const CompanionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del compañero no puede estar vacío"),
  role: z.string().optional(),
  notes: z.string().optional(),
  sourceTraitId: z.string().optional(),
});

export const CompanionInputListSchema = z
  .array(CompanionInputSchema)
  .max(20, "No se pueden registrar más de 20 compañeros");

export const UpdateCharacterCompanionsSchema = z.object({
  companions: CompanionInputListSchema,
});

const atLeastOneFieldMessage = "Debe proporcionar al menos un campo para modificar";

const AppearancePatchSchema = z.object({
  age: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  eyes: z.string().optional(),
  hair: z.string().optional(),
  skin: z.string().optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: atLeastOneFieldMessage,
});

const IdealPatchSchema = z.object({
  title: z.string(),
  description: z.string(),
  alignment: z.string(),
}).strict();

const BackgroundPatchSchema = z.object({
  history: z.union([z.string(), z.array(z.string())]).optional(),
  alignment: z.string().optional(),
  personality: z.array(z.string()).optional(),
  ideals: z.array(IdealPatchSchema).optional(),
  bonds: z.array(z.string()).optional(),
  flaws: z.array(z.string()).optional(),
  god: z.string().optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: atLeastOneFieldMessage,
});

export const PatchCharacterFlavorSchema = z.object({
  img: z.string().optional(),
  appearance: AppearancePatchSchema.optional(),
  background: BackgroundPatchSchema.optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: atLeastOneFieldMessage,
});

export const AddCharacterFormSchema = z.object({
  creatureId: z.string().regex(objectIdRegex, "El ID de criatura debe ser un ObjectId válido de MongoDB"),
  spellId: z.string().regex(objectIdRegex, "El ID de conjuro debe ser un ObjectId válido de MongoDB"),
});

export const CharacterFormParamsSchema = CharacterIdParamsSchema.extend({
  formId: z
    .string()
    .min(1, "ID de forma requerido")
    .regex(objectIdRegex, "El formId debe ser un ObjectId válido de MongoDB"),
});
