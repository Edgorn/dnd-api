import { z } from "zod";
import { SYSTEM_KINDS, SYSTEM_MAX_PARENTS } from "../../../domain/types/system.types";
import { validateSystemFormula, validateAttributeModifierFormula } from "../../../utils/formulaValidation";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, "Cada padre debe ser un ObjectId válido de MongoDB");

const parentIdsSchema = z
  .array(objectIdSchema)
  .max(SYSTEM_MAX_PARENTS, `Un sistema no puede tener más de ${SYSTEM_MAX_PARENTS} padres`)
  .superRefine((ids, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < ids.length; i++) {
      if (seen.has(ids[i])) {
        ctx.addIssue({
          code: "custom",
          message: "parentIds no puede contener duplicados",
          path: [i],
        });
      }
      seen.add(ids[i]);
    }
  });

export const systemKindSchema = z.enum(SYSTEM_KINDS, {
  error: "kind debe ser ruleset, setting o campaign",
});

const systemFormulaSchema = (fieldLabel: string) =>
  z.string().optional().superRefine((val, ctx) => {
    if (val === undefined) return;
    const error = validateSystemFormula(val);
    if (error) {
      ctx.addIssue({ code: "custom", message: `${fieldLabel}: ${error}` });
    }
  });

const attributeModifierFormulaSchema = z.string().optional().superRefine((val, ctx) => {
  if (val === undefined) return;
  const error = validateAttributeModifierFormula(val);
  if (error) {
    ctx.addIssue({ code: "custom", message: `globalModifierFormula: ${error}` });
  }
});

const passiveSkillFormulaSchema = z.string().optional().superRefine((val, ctx) => {
  if (val === undefined) return;
  const error = validateSystemFormula(val, { allowSkillNamePlaceholder: true });
  if (error) {
    ctx.addIssue({ code: "custom", message: `passiveSkillFormula: ${error}` });
  }
});

const weaponFormulaSchema = (fieldLabel: string) =>
  z.string().optional().superRefine((val, ctx) => {
    if (val === undefined) return;
    const error = validateSystemFormula(val, { allowWeaponTokens: true });
    if (error) {
      ctx.addIssue({ code: "custom", message: `${fieldLabel}: ${error}` });
    }
  });

export const abilityScoreProgressionSchema = z
  .array(z.number().int().min(1, "Cada nivel de mejora de característica debe ser al menos 1"))
  .superRefine((values, ctx) => {
    const seen = new Set<number>();
    for (let i = 0; i < values.length; i++) {
      if (seen.has(values[i])) {
        ctx.addIssue({
          code: "custom",
          message: `abilityScoreProgression contiene el nivel duplicado ${values[i]}`,
          path: [i],
        });
      }
      seen.add(values[i]);
    }
  });

const progressionArrayRefinement = (
  data: {
    maxLevel?: number;
    xpProgression?: number[];
    proficiencyProgression?: number[];
    abilityScoreProgression?: number[];
  },
  ctx: z.RefinementCtx
) => {
  const validateProgression = (
    field: "xpProgression" | "proficiencyProgression",
    values?: number[]
  ) => {
    if (values === undefined) return;
    if (values.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: `${field} debe contener al menos un elemento`,
        path: [field],
      });
      return;
    }
    if (data.maxLevel !== undefined && values.length !== data.maxLevel) {
      ctx.addIssue({
        code: "custom",
        message: `${field} debe tener exactamente ${data.maxLevel} elementos (maxLevel)`,
        path: [field],
      });
    }
  };

  validateProgression("xpProgression", data.xpProgression);
  validateProgression("proficiencyProgression", data.proficiencyProgression);

  if (data.abilityScoreProgression === undefined || data.maxLevel === undefined) return;
  for (let i = 0; i < data.abilityScoreProgression.length; i++) {
    if (data.abilityScoreProgression[i] > data.maxLevel) {
      ctx.addIssue({
        code: "custom",
        message: `abilityScoreProgression no puede contener niveles mayores que maxLevel (${data.maxLevel})`,
        path: ["abilityScoreProgression", i],
      });
    }
  }
};

const rejectContentLayerRules = (
  data: {
    kind?: "ruleset" | "setting" | "campaign";
    parentIds?: string[];
    isBase?: boolean;
  } & Record<string, unknown>,
  ctx: z.RefinementCtx,
  options: { requireParentIds: boolean }
) => {
  const kind = data.kind ?? "ruleset";
  if (kind === "ruleset") return;

  if (options.requireParentIds && (!data.parentIds || data.parentIds.length === 0)) {
    ctx.addIssue({
      code: "custom",
      message: "parentIds es obligatorio para setting y campaign",
      path: ["parentIds"],
    });
  }

  if (data.isBase === true) {
    ctx.addIssue({
      code: "custom",
      message: "isBase solo está permitido en ruleset",
      path: ["isBase"],
    });
  }

  for (const key of Object.keys(systemRulesFields)) {
    if (data[key] !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `${key} no está permitido en sistemas de tipo ${kind}`,
        path: [key],
      });
    }
  }
};

export const systemRulesFields = {
  globalModifierFormula: attributeModifierFormulaSchema,
  initiativeBonusFormula: systemFormulaSchema("initiativeBonusFormula"),
  maxAttributeValue: z.number().optional(),
  defaultMinAttributeValue: z.number().optional(),
  defaultMaxAttributeValue: z.number().optional(),
  creationMinAttributeValue: z.number().optional(),
  creationMaxAttributeValue: z.number().optional(),
  maxLevel: z.number().int().min(1).optional(),
  maxSpellLevel: z.number().int().min(0).optional(),
  xpProgression: z.array(z.number().int().min(0)).optional(),
  proficiencyProgression: z.array(z.number().int()).optional(),
  abilityScoreProgression: abilityScoreProgressionSchema.optional(),
  hpInitialFormula: systemFormulaSchema("hpInitialFormula"),
  hpLevelUpFormula: systemFormulaSchema("hpLevelUpFormula"),
  baseAcFormula: systemFormulaSchema("baseAcFormula"),
  passiveSkillFormula: passiveSkillFormulaSchema,
  carryingCapacityFormula: systemFormulaSchema("carryingCapacityFormula"),
  attackBonusFormula: weaponFormulaSchema("attackBonusFormula"),
  damageBonusFormula: weaponFormulaSchema("damageBonusFormula"),
  meleeAttackAttributes: z.array(z.string()).optional(),
  rangedAttackAttributes: z.array(z.string()).optional(),
};

export const CreateSystemSchema = z
  .object({
    name: z.string().min(1, "El nombre del sistema es obligatorio"),
    description: z.string().optional(),
    isOpen: z.boolean().optional(),
    isBase: z.boolean().optional(),
    kind: systemKindSchema.default("ruleset"),
    parentIds: parentIdsSchema.default([]),
    ...systemRulesFields,
  })
  .superRefine(progressionArrayRefinement)
  .superRefine((data, ctx) => rejectContentLayerRules(data, ctx, { requireParentIds: true }));

export const UpdateSystemSchema = z
  .object({
    name: z.string().min(1, "El nombre del sistema no puede estar vacío").optional(),
    description: z.string().optional(),
    isOpen: z.boolean().optional(),
    isBase: z.boolean().optional(),
    kind: systemKindSchema.optional(),
    parentIds: parentIdsSchema.optional(),
    ...systemRulesFields,
  })
  .superRefine(progressionArrayRefinement)
  .superRefine((data, ctx) => {
    if (data.kind === undefined) return;
    rejectContentLayerRules(data, ctx, { requireParentIds: true });
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para modificar",
  });

export const ListSystemsQuerySchema = z.object({
  kind: systemKindSchema.optional(),
});
