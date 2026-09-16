import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const uniqueLevelsRefinement = (
  levels: Array<{ level: number }> | undefined,
  ctx: z.RefinementCtx
) => {
  if (!levels) return;
  const seen = new Set<number>();
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i].level;
    if (seen.has(level)) {
      ctx.addIssue({
        code: "custom",
        message: `levels contiene el nivel duplicado ${level}`,
        path: ["levels", i, "level"]
      });
    }
    seen.add(level);
  }
};

const SubclassLevelInputSchema = z.object({
  level: z.number().int().min(1, "El nivel debe ser al menos 1"),
  traits: z.array(
    z.string().regex(objectIdRegex, "Cada trait debe ser un ObjectId válido de MongoDB")
  ).optional(),
  traits_data: z.record(z.string(), z.record(z.string(), z.string())).optional()
});

export const CreateSubclassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  classId: z.string().regex(objectIdRegex, "classId debe ser un ObjectId válido de MongoDB"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional(),
  img: z.string().optional(),
  levels: z.array(SubclassLevelInputSchema).optional()
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
});

export const UpdateSubclassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío").optional(),
  classId: z.string().regex(objectIdRegex, "classId debe ser un ObjectId válido de MongoDB").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  img: z.string().optional(),
  levels: z.array(SubclassLevelInputSchema).optional()
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
