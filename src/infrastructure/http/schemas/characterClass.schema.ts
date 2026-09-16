import { z } from "zod";
import { CharacterEquipmentSchema, CostSchema, EquipmentChoiceMongoSchema } from "./equipment.schema";
import { validateSystemFormula } from "../../../utils/formulaValidation";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
  spellsLearned: z.number().int().min(0).optional(),
  slots: z.record(z.string(), z.number().int().min(0)).optional()
}).optional();

const CharacterClassLevelInputSchema = z.object({
  level: z.number().int().min(1, "El nivel debe ser al menos 1"),
  spellcasting: ClassSpellSlotsSchema,
  spell_choices: z.array(ChoiceMongoSchema).optional(),
  traits: z.array(
    z.string().regex(objectIdRegex, "Cada trait debe ser un ObjectId válido de MongoDB")
  ).optional()
});

const SpellCopyCostSchema = z.object({
  hoursPerSpellLevel: z.number().min(0, "Las horas por nivel de conjuro no pueden ser negativas"),
  costPerSpellLevel: CostSchema
});

const SpellRepositoryConfigSchema = z.object({
  name: z.string().min(1, "El nombre del repositorio de conjuros no puede estar vacío"),
  equipmentId: z.string().regex(objectIdRegex, "equipmentId debe ser un ObjectId válido de MongoDB").optional(),
  includesCantrips: z.boolean(),
  copy: SpellCopyCostSchema,
  duplicate: SpellCopyCostSchema,
  recoverPreparedOnLoss: z.boolean()
});

const PreparedFromSchema = z.enum(["known", "classList"]);

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

const spellPreparationPairRefinement = (
  data: { spellsPreparedFormula?: string; preparedFrom?: "known" | "classList" },
  ctx: z.RefinementCtx
) => {
  const hasFormula = data.spellsPreparedFormula !== undefined;
  const hasFrom = data.preparedFrom !== undefined;
  if (hasFormula === hasFrom) return;

  ctx.addIssue({
    code: "custom",
    message: "spellsPreparedFormula y preparedFrom deben indicarse juntos",
    path: hasFormula ? ["preparedFrom"] : ["spellsPreparedFormula"]
  });
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
  spellsPreparedFormula: classFormulaSchema("spellsPreparedFormula"),
  preparedFrom: PreparedFromSchema.optional(),
  spellRepository: SpellRepositoryConfigSchema.nullable().optional(),
  levels: z.array(CharacterClassLevelInputSchema).optional(),
  subclassChoice: z.object({
    name: z.string().min(1, "El nombre del tipo de subclase no puede estar vacío"),
    description: z.array(z.string()).default([]),
    level: z.number().int().min(1, "El nivel de elección de subclase debe ser al menos 1")
  }).nullable().optional()
};

export const CreateCharacterClassSchema = z.object({
  ruleset: z.string().min(1, "El sistema (ruleset) no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
  spellPreparationPairRefinement(data, ctx);
});

export const UpdateCharacterClassSchema = z.object({
  ruleset: z.string().optional(),
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  img: z.string().optional(),
  ...characterClassFields
}).superRefine((data, ctx) => {
  uniqueLevelsRefinement(data.levels, ctx);
  spellPreparationPairRefinement(data, ctx);
})
  .refine(data => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar"
  });
