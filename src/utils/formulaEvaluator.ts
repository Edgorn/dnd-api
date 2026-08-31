import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { SkillPersonajeApi } from "../domain/types/skill.types";

export interface FormulaEvaluationContext {
  attributes: CharacterAttributeApi[];
  variables?: Record<string, number | string>;
  classVariables?: Record<string, number>;
  skills?: SkillPersonajeApi[];
}

const ALLOWED_EVALUATED_CHARS = /^[0-9+\-*/().\smaxin]+$/;

function replaceClassTokens(formula: string, classVariables?: Record<string, number>): string {
  return formula.replace(/@class\.(\w+)/g, (_match, prop: string) => {
    const val = classVariables?.[prop];
    return val !== undefined ? String(val) : "0";
  });
}

function replaceSkillTokens(formula: string, skills?: SkillPersonajeApi[]): string {
  return formula.replace(/@skills\.(\w+)\.totalModifier/g, (_match, key: string) => {
    const skill = skills?.find(s => s.key === key);
    return skill?.modifier !== undefined ? String(skill.modifier) : "0";
  });
}

function replaceAttributeTokens(formula: string, attributes: CharacterAttributeApi[]): string {
  return formula.replace(/@attributes\.(\w+)\.(modifier|value)/g, (_match, key: string, prop: string) => {
    const attr = attributes.find(a => a.key === key);
    if (!attr) return "0";
    const val = attr[prop as "modifier" | "value"];
    return val !== undefined ? String(val) : "0";
  });
}

function replaceFlatVariables(formula: string, variables?: Record<string, number | string>): string {
  let result = formula;
  if (variables) {
    Object.entries(variables).forEach(([key, val]) => {
      const regexVar = new RegExp(`@${key}\\b`, "g");
      result = result.replace(regexVar, String(val));
    });
  }
  return result;
}

function evaluateMathExpression(expression: string): number {
  if (!ALLOWED_EVALUATED_CHARS.test(expression)) {
    console.error("Fórmula insegura o no permitida detectada:", expression);
    return 0;
  }

  const withNativeMaxMin = expression
    .replace(/\bmax\s*\(/g, "Math.max(")
    .replace(/\bmin\s*\(/g, "Math.min(");

  try {
    const calcFunc = new Function(`"use strict"; return (${withNativeMaxMin});`);
    const result = calcFunc();
    return typeof result === "number" && Number.isFinite(result) ? result : 0;
  } catch (e) {
    console.error("Error al evaluar la fórmula matemática:", expression, e);
    return 0;
  }
}

/**
 * Evalúa una fórmula de bono de personaje resolviendo tokens de atributos, clase, skills y variables.
 */
export function evaluateFormula(
  formula: string,
  attributes: CharacterAttributeApi[],
  variables?: Record<string, number | string>,
  options?: {
    classVariables?: Record<string, number>;
    skills?: SkillPersonajeApi[];
  }
): number {
  if (!formula) return 0;

  let evaluatedFormula = formula;
  evaluatedFormula = replaceAttributeTokens(evaluatedFormula, attributes);
  evaluatedFormula = replaceClassTokens(evaluatedFormula, options?.classVariables);
  evaluatedFormula = replaceSkillTokens(evaluatedFormula, options?.skills);
  evaluatedFormula = replaceFlatVariables(evaluatedFormula, variables);

  return evaluateMathExpression(evaluatedFormula);
}

/**
 * Evalúa la plantilla de habilidad pasiva sustituyendo {skillName} por la key concreta.
 */
export function evaluatePassiveSkillFormula(
  formula: string,
  skillKey: string,
  context: FormulaEvaluationContext
): number {
  if (!formula) return 0;

  const resolvedFormula = formula.replace(/\{skillName\}/g, skillKey);
  return evaluateFormula(
    resolvedFormula,
    context.attributes,
    context.variables,
    {
      classVariables: context.classVariables,
      skills: context.skills,
    }
  );
}

export function buildPassiveSkillsMap(
  formula: string | undefined,
  skills: SkillPersonajeApi[],
  context: Omit<FormulaEvaluationContext, "skills">
): Record<string, number> {
  if (!formula) return {};

  const result: Record<string, number> = {};
  for (const skill of skills) {
    result[skill.key] = evaluatePassiveSkillFormula(formula, skill.key, {
      ...context,
      skills,
    });
  }
  return result;
}

/**
 * Evalúa de forma segura la fórmula de modificador de atributo global (ej. Math.floor((value - 10) / 2))
 */
export function evaluateAttributeModifier(
  formula: string,
  value: number
): number | undefined {
  if (!formula) return undefined;

  const evaluated = formula.replace(/valor/g, "value").replace(/value/g, String(value));

  const sanitized = evaluated
    .replace(/Math\.(floor|ceil|round|trunc|abs)/g, "")
    .replace(/[0-9+\-*/().\s]/g, "");

  if (sanitized === "") {
    try {
      const calcFunc = new Function(`"use strict"; return (${evaluated});`);
      return calcFunc();
    } catch (e) {
      console.error("Error al evaluar la fórmula de modificador global:", formula, e);
    }
  } else {
    console.error("Fórmula de modificador global insegura detectada:", formula);
  }

  return undefined;
}
