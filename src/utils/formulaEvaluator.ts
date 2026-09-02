import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { SkillPersonajeApi } from "../domain/types/skill.types";

export interface FormulaEvaluationContext {
  attributes: CharacterAttributeApi[];
  variables?: Record<string, number | string>;
  classVariables?: Record<string, number>;
  skills?: SkillPersonajeApi[];
}

export interface WeaponFormulaContext {
  attributeModifier: number;
  attributeValue: number;
  isProficient: number;
  isMagic: number;
  isRanged: number;
  isTwoHanded: number;
  propertyIds?: string[];
}

const ALLOWED_EVALUATED_CHARS = /^[0-9+\-*/().\s?:<>=!&|maxin]+$/;

function replaceClassTokens(formula: string, classVariables?: Record<string, number>): string {
  return formula.replace(/@class\.(\w+)/g, (_match, prop: string) => {
    const val = classVariables?.[prop];
    return val !== undefined ? String(val) : "0";
  });
}

function replaceSkillTokens(formula: string, skills?: SkillPersonajeApi[]): string {
  return formula.replace(/@skills\.([\w-]+)\.totalModifier/g, (_match, key: string) => {
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

function replaceWeaponTokens(formula: string, weapon?: WeaponFormulaContext): string {
  if (!weapon) return formula;

  let result = formula;
  result = result.replace(/@weapon\.attributeModifier\b/g, String(weapon.attributeModifier));
  result = result.replace(/@weapon\.attributeValue\b/g, String(weapon.attributeValue));
  result = result.replace(/@weapon\.isProficient\b/g, String(weapon.isProficient));
  result = result.replace(/@weapon\.isMagic\b/g, String(weapon.isMagic));
  result = result.replace(/@weapon\.isRanged\b/g, String(weapon.isRanged));
  result = result.replace(/@weapon\.isTwoHanded\b/g, String(weapon.isTwoHanded));

  result = result.replace(/@weapon\.hasProperty\.(\w+)/g, (_match, propertyId: string) => {
    const hasProperty = weapon.propertyIds?.includes(propertyId) ?? false;
    return hasProperty ? "1" : "0";
  });

  return result;
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
 * Evalúa una fórmula de bono de personaje resolviendo tokens de atributos, clase, skills, arma y variables.
 */
export function evaluateFormula(
  formula: string,
  attributes: CharacterAttributeApi[],
  variables?: Record<string, number | string>,
  options?: {
    classVariables?: Record<string, number>;
    skills?: SkillPersonajeApi[];
    weapon?: WeaponFormulaContext;
  }
): number {
  if (!formula) return 0;

  let evaluatedFormula = formula;
  evaluatedFormula = replaceAttributeTokens(evaluatedFormula, attributes);
  evaluatedFormula = replaceClassTokens(evaluatedFormula, options?.classVariables);
  evaluatedFormula = replaceSkillTokens(evaluatedFormula, options?.skills);
  evaluatedFormula = replaceWeaponTokens(evaluatedFormula, options?.weapon);
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

export function enrichSkillsWithPassive(
  formula: string | undefined,
  skills: SkillPersonajeApi[],
  context: Omit<FormulaEvaluationContext, "skills">
): SkillPersonajeApi[] {
  if (!formula) return skills;

  return skills.map(skill => ({
    ...skill,
    passive: evaluatePassiveSkillFormula(formula, skill.key, { ...context, skills }),
  }));
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
