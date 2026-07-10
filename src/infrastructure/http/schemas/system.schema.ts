import { z } from "zod";

export const CreateSystemSchema = z.object({
  name: z.string().min(1, "El nombre del sistema es obligatorio"),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
  isBase: z.boolean().optional(),
  parentId: z.string().optional(),
  globalModifierFormula: z.string().optional(),
  initiativeBonusFormula: z.string().optional(),
  defaultMinAttributeValue: z.number().optional(),
  defaultMaxAttributeValue: z.number().optional(),
  creationMinAttributeValue: z.number().optional(),
  creationMaxAttributeValue: z.number().optional(),
  maxLevel: z.number().int().min(1).optional(),
  maxSpellLevel: z.number().int().min(0).optional()
});

export const UpdateSystemSchema = z.object({
  name: z.string().min(1, "El nombre del sistema no puede estar vacío").optional(),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
  isBase: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  globalModifierFormula: z.string().optional(),
  initiativeBonusFormula: z.string().optional(),
  defaultMinAttributeValue: z.number().optional(),
  defaultMaxAttributeValue: z.number().optional(),
  creationMinAttributeValue: z.number().optional(),
  creationMaxAttributeValue: z.number().optional(),
  maxLevel: z.number().int().min(1).optional(),
  maxSpellLevel: z.number().int().min(0).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
