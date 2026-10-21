import { z } from "zod";
import { Prerequisite } from "../../../domain/types/prerequisite.types";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const OptionGroupIdParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB")
});

export const OptionGroupOptionsParamsSchema = z.object({
  groupId: z.string().regex(objectIdRegex, "El ID del grupo debe ser un ObjectId válido de MongoDB")
});

export const CreateOptionGroupSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional()
});

export const UpdateOptionGroupSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export const OptionChoiceMongoSchema = z.object({
  groupId: z.string().regex(objectIdRegex, "groupId debe ser un ObjectId válido de MongoDB"),
  choose: z.number().int().min(0, "choose no puede ser negativo"),
  replace: z.number().int().min(0, "replace no puede ser negativo").optional()
}).strict().superRefine((data, ctx) => {
  if (data.choose === 0 && (data.replace ?? 0) === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Debe indicar al menos choose o replace mayor que 0"
    });
  }
});

export const OptionReplacementConfigSchema = z.object({
  groupId: z.string().regex(objectIdRegex, "groupId debe ser un ObjectId válido de MongoDB"),
  count: z.number().int().min(1, "Debe poder recambiar al menos 1 opción")
}).strict();

export const OptionReplacementsSchema = z.array(OptionReplacementConfigSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    if (seen.has(items[i].groupId)) {
      ctx.addIssue({
        code: "custom",
        message: "optionReplacements no puede repetir el mismo groupId",
        path: [i, "groupId"]
      });
    }
    seen.add(items[i].groupId);
  }
});

export const PrerequisiteSchema: z.ZodType<Prerequisite> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("classLevel"),
      classId: z.string().regex(objectIdRegex, "classId debe ser un ObjectId válido de MongoDB").optional(),
      min: z.number().int().min(1)
    }).strict(),
    z.object({
      type: z.literal("characterLevel"),
      min: z.number().int().min(1)
    }).strict(),
    z.object({
      type: z.literal("trait"),
      traitId: z.string().regex(objectIdRegex, "traitId debe ser un ObjectId válido de MongoDB")
    }).strict(),
    z.object({
      type: z.literal("spell"),
      spellId: z.string().regex(objectIdRegex, "spellId debe ser un ObjectId válido de MongoDB")
    }).strict(),
    z.object({
      type: z.literal("attribute"),
      key: z.string().min(1),
      min: z.number()
    }).strict(),
    z.object({ all: z.array(PrerequisiteSchema).min(1) }).strict(),
    z.object({ any: z.array(PrerequisiteSchema).min(1) }).strict()
  ])
);

export const CreateGroupOptionSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  groupId: z.string().regex(objectIdRegex, "groupId debe ser un ObjectId válido de MongoDB"),
  traitId: z.string().regex(objectIdRegex, "traitId debe ser un ObjectId válido de MongoDB"),
  prerequisites: PrerequisiteSchema.optional(),
  repeatable: z.boolean().optional()
});

export const UpdateGroupOptionSchema = z.object({
  groupId: z.string().regex(objectIdRegex, "groupId debe ser un ObjectId válido de MongoDB").optional(),
  traitId: z.string().regex(objectIdRegex, "traitId debe ser un ObjectId válido de MongoDB").optional(),
  prerequisites: PrerequisiteSchema.nullable().optional(),
  repeatable: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
