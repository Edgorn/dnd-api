import { z } from "zod";
import {
  LevelSkillProficiencyChoiceSchema,
  SpellChoiceMongoSchema
} from "./characterClass.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const ExpandedSpellIdsSchema = z.array(
  z.string().regex(objectIdRegex, "Cada conjuro ampliado debe ser un ObjectId válido de MongoDB")
);

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

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
  traits_data: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  skill_choices: ChoiceMongoSchema.nullable().optional(),
  skillProficiencyChoices: LevelSkillProficiencyChoiceSchema.nullable().optional(),
  spell_choices: z.array(SpellChoiceMongoSchema).nullable().optional()
});

export const CreateSubclassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  classId: z.string().regex(objectIdRegex, "classId debe ser un ObjectId válido de MongoDB"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.array(z.string()).optional(),
  img: z.string().optional(),
  levels: z.array(SubclassLevelInputSchema).optional(),
  expandedSpells: ExpandedSpellIdsSchema.optional()
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
});

export const UpdateSubclassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío").optional(),
  classId: z.string().regex(objectIdRegex, "classId debe ser un ObjectId válido de MongoDB").optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.array(z.string()).optional(),
  img: z.string().optional(),
  levels: z.array(SubclassLevelInputSchema).optional(),
  expandedSpells: ExpandedSpellIdsSchema.nullable().optional()
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar"
});
