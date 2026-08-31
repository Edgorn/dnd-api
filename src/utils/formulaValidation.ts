const ALLOWED_ATTRIBUTE_TOKEN = /@attributes\.\w+\.(modifier|value)/g;
const ALLOWED_CLASS_TOKEN = /@class\.\w+/g;
const ALLOWED_SKILL_TOKEN = /@skills\.(\{skillName\}|\w+)\.totalModifier/g;
const ALLOWED_SKILL_PLACEHOLDER = /\{skillName\}/g;
const ALLOWED_FLAT_VARIABLE = /@\w+/g;
const ALLOWED_MATH_FUNCTIONS = /\b(max|min|Math\.(floor|ceil|round|trunc|abs))\b/g;

/**
 * Valida fórmulas de modificador global de atributo (usa value/valor y Math.*).
 */
export function validateAttributeModifierFormula(formula: string): string | undefined {
  if (!formula.trim()) {
    return "La fórmula no puede estar vacía";
  }

  let sanitized = formula.replace(/\b(valor|value)\b/g, "0");
  sanitized = sanitized.replace(ALLOWED_MATH_FUNCTIONS, "");

  if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
    return "La fórmula contiene tokens o caracteres no permitidos";
  }

  return undefined;
}

/**
 * Valida la sintaxis de una fórmula de sistema antes de persistirla.
 */
export function validateSystemFormula(
  formula: string,
  options?: { allowSkillNamePlaceholder?: boolean }
): string | undefined {
  if (!formula.trim()) {
    return "La fórmula no puede estar vacía";
  }

  let sanitized = formula;

  sanitized = sanitized.replace(ALLOWED_ATTRIBUTE_TOKEN, "0");
  sanitized = sanitized.replace(ALLOWED_CLASS_TOKEN, "0");

  if (options?.allowSkillNamePlaceholder) {
    sanitized = sanitized.replace(ALLOWED_SKILL_TOKEN, "0");
  } else {
    sanitized = sanitized.replace(/@skills\.\w+\.totalModifier/g, "0");
    if (formula.includes("{skillName}")) {
      return "El placeholder {skillName} solo está permitido en passiveSkillFormula";
    }
  }

  sanitized = sanitized.replace(ALLOWED_FLAT_VARIABLE, "0");
  sanitized = sanitized.replace(ALLOWED_MATH_FUNCTIONS, "");

  if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
    return "La fórmula contiene tokens o caracteres no permitidos";
  }

  return undefined;
}
