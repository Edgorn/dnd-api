import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CostSchema = z.object({
  quantity: z.number().min(0, "La cantidad del coste no puede ser negativa"),
  unit: z.string().regex(objectIdRegex, "La unidad de moneda debe ser un ID válido de MongoDB (Coin)")
});

export const LiquidUnitSchema = z.enum(["gallon", "pint", "ounce"]);
export const SolidUnitSchema = z.enum(["cubic_foot"]);

export const EquipSlotSchema = z.enum([
  "head",
  "neck",
  "cloak",
  "armor",
  "hands",
  "waist",
  "feet",
  "ring",
  "main_hand",
  "off_hand",
  "two_handed"
]);

export const LiquidVolumeDefSchema = z.object({
  value: z.number().min(0, "El valor de volumen líquido no puede ser negativo"),
  unit: LiquidUnitSchema
});

export const SolidVolumeDefSchema = z.object({
  value: z.number().min(0, "El valor de volumen sólido no puede ser negativo"),
  unit: SolidUnitSchema
});

export const ContainerRulesSchema = z.object({
  maxWeight: z.number().min(0, "El peso máximo no puede ser negativo").optional(),
  maxItems: z.number().min(0, "La cantidad máxima de objetos no puede ser negativa").optional(),
  acceptedStorageTags: z.array(z.string()).optional(),
  maxLiquidCapacity: LiquidVolumeDefSchema.optional(),
  maxSolidCapacity: SolidVolumeDefSchema.optional()
});

export const WeaponDamageSchema = z.object({
  dice: z.string().min(1, "El dado no puede estar vacío"),
  type: z.string().min(1, "El tipo de daño no puede estar vacío")
});

export const WeaponRangeThrowSchema = z.object({
  normal: z.number().min(0, "El alcance normal no puede ser negativo"),
  long: z.number().min(0, "El alcance largo no puede ser negativo")
});

export const WeaponSchema = z.object({
  category: z.string().optional(),
  damage: z.array(WeaponDamageSchema).optional(),
  two_handed_damage: z.array(WeaponDamageSchema).optional(),
  properties: z.array(z.string()).optional(),
  range: z.string().optional(),
  range_throw: WeaponRangeThrowSchema.optional()
});

export const ArmorClassSchema = z.object({
  base: z.number(),
  dex_bonus: z.number(),
  max_bonus: z.number()
});

export const ArmorSchema = z.object({
  category: z.string().optional(),
  class: ArmorClassSchema.optional(),
  str_minimum: z.number().optional(),
  stealth_disadvantage: z.number().optional()
});

export const EquipmentBonusesSchema = z.object({
  armor_class: z.number().optional(),
  saving_throws: z.number().optional()
});

export const CharacterEquipmentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB").optional(),
    quantity: z.number().min(1, "La cantidad debe ser al menos 1").optional(),
    name: z.string().min(1, "El nombre no puede estar vacío").optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    cost: CostSchema.optional(),
    weight: z.number().min(0, "El peso no puede ser negativo").optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    equipSlot: EquipSlotSchema.nullable().optional(),
    storageTags: z.array(z.string()).nullable().optional(),
    containerStats: ContainerRulesSchema.nullable().optional(),
    proficiencies: z.array(z.string()).optional(),
    weapon: WeaponSchema.optional(),
    armor: ArmorSchema.optional(),
    isMagic: z.boolean().optional(),
    isBond: z.boolean().optional(),
    equipped: z.boolean().optional(),
    bonuses: EquipmentBonusesSchema.optional(),
    content: z.array(CharacterEquipmentSchema).optional()
  }).refine(item => !!(item.id || item.name), {
    message: "Debe indicar id o name"
  })
);

export const CreateEquipmentSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string(),
  cost: CostSchema,
  weight: z.number().min(0, "El peso no puede ser negativo"),
  category: z.string().min(1, "La categoría no puede estar vacía"),
  subcategory: z.string().min(1, "La subcategoría no puede estar vacía"),
  equipSlot: EquipSlotSchema.nullable().optional(),
  storageTags: z.array(z.string()).nullable().optional(),
  containerStats: ContainerRulesSchema.nullable().optional(),
  proficiencies: z.array(z.string()).optional(),
  weapon: WeaponSchema.nullable().optional(),
  content: z.array(CharacterEquipmentSchema).optional()
});

export const UpdateEquipmentSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().optional(),
  cost: CostSchema.optional(),
  weight: z.number().min(0, "El peso no puede ser negativo").optional(),
  category: z.string().min(1, "La categoría no puede estar vacía").optional(),
  subcategory: z.string().min(1, "La subcategoría no puede estar vacía").optional(),
  equipSlot: EquipSlotSchema.nullable().optional(),
  storageTags: z.array(z.string()).nullable().optional(),
  containerStats: ContainerRulesSchema.nullable().optional(),
  proficiencies: z.array(z.string()).optional(),
  weapon: WeaponSchema.nullable().optional(),
  content: z.array(CharacterEquipmentSchema).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export const EquipmentParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB")
});

const EquipmentChoiceFilterSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
);

const EquipmentChoiceBranchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("item"),
    id: z.string().min(1, "El id del equipamiento no puede estar vacío"),
    quantity: z.number().int().min(1).optional()
  }),
  z.object({
    type: z.literal("choice"),
    choose: z.number().int().min(1, "Debe elegir al menos 1"),
    options: z.array(z.string()).optional(),
    filter: EquipmentChoiceFilterSchema.optional()
  })
]);

/** Input schema for class/background equipment_choices (simple options/filter or nested alternatives). */
export const EquipmentChoiceMongoSchema = z
  .object({
    choose: z.number().int().min(1, "Debe elegir al menos 1"),
    options: z.array(z.string()).optional(),
    filter: EquipmentChoiceFilterSchema.optional(),
    alternatives: z.array(EquipmentChoiceBranchSchema).min(1).optional()
  })
  .superRefine((data, ctx) => {
    const hasAlternatives = !!data.alternatives && data.alternatives.length > 0;
    const hasSimple = !!(data.options?.length || data.filter);

    if (hasAlternatives && hasSimple) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No se pueden combinar alternatives con options/filter en la misma elección"
      });
    }

    if (!hasAlternatives && !hasSimple) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe indicar options, filter o alternatives"
      });
    }
  });
