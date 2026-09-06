import { z } from "zod";
import { CharacterEquipmentSchema, EquipmentChoiceMongoSchema } from "./equipment.schema";
import { validateSystemFormula } from "../../../utils/formulaValidation";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])).optional()
});

const classFormulaSchema = (fieldLabel: string) =>
  z.string().optional().superRefine((val, ctx) => {
    if (val === undefined) return;
    const error = validateSystemFormula(val);
    if (error) {
      ctx.addIssue({ code: "custom", message: `${fieldLabel}: ${error}` });
    }
  });

const ClassSpellSlotsSchema = z.object({
  cantrips: z.number().int().min(0).optional(),
  slots: z.record(z.string(), z.number().int().min(0)).optional()
}).optional();

const CharacterClassLevelInputSchema = z.object({
  level: z.number().int().min(1, "El nivel debe ser al menos 1"),
  spellcasting: ClassSpellSlotsSchema
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

const characterClassFields = {
  hit_die: z.number().int().min(1).optional(),
  proficiencies: z.array(z.string()).optional(),
  saving_throws: z.array(z.string().min(1)).optional(),
  skill_choices: ChoiceMongoSchema.nullable().optional(),
  equipment: z.array(CharacterEquipmentSchema).nullable().optional(),
  equipment_choices: z.array(EquipmentChoiceMongoSchema).nullable().optional(),
  spellcasting: z.string().min(1).nullable().optional(),
  spellSaveDcFormula: classFormulaSchema("spellSaveDcFormula"),
  spellAttackBonusFormula: classFormulaSchema("spellAttackBonusFormula"),
  levels: z.array(CharacterClassLevelInputSchema).optional()
};

export const CreateCharacterClassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
}).superRefine((data, ctx) => uniqueLevelsRefinement(data.levels, ctx));

export const UpdateCharacterClassSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
}).superRefine((data, ctx) => uniqueLevelsRefinement(data.levels, ctx))
  .refine(data => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar"
  });
