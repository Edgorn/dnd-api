import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CostSchema = z.object({
  quantity: z.number().min(0, "La cantidad del coste no puede ser negativa"),
  unit: z.string().regex(objectIdRegex, "La unidad de moneda debe ser un ID válido de MongoDB (Coin)")
});

export const LiquidUnitSchema = z.enum(["gallon", "pint"]);
export const SolidUnitSchema = z.enum(["cubic_foot"]);

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

export const CreateEquipmentSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string(),
  cost: CostSchema,
  weight: z.number().min(0, "El peso no puede ser negativo"),
  category: z.string().min(1, "La categoría no puede estar vacía"),
  subcategory: z.string().min(1, "La subcategoría no puede estar vacía"),
  storageTags: z.array(z.string()).nullable().optional(),
  containerStats: ContainerRulesSchema.nullable().optional()
});

export const UpdateEquipmentSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().optional(),
  cost: CostSchema.optional(),
  weight: z.number().min(0, "El peso no puede ser negativo").optional(),
  category: z.string().min(1, "La categoría no puede estar vacía").optional(),
  subcategory: z.string().min(1, "La subcategoría no puede estar vacía").optional(),
  storageTags: z.array(z.string()).nullable().optional(),
  containerStats: ContainerRulesSchema.nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export const EquipmentParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB")
});
