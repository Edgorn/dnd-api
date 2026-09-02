const ALLOWED_ATTRIBUTE_TOKEN = /@attributes\.\w+\.(modifier|value)/g;
const ALLOWED_CLASS_TOKEN = /@class\.\w+/g;
const ALLOWED_SKILL_TOKEN = /@skills\.(\{skillName\}|[\w-]+)\.totalModifier/g;
const ALLOWED_WEAPON_TOKEN =
  /@weapon\.(attributeModifier|attributeValue|isProficient|isMagic|isRanged|isTwoHanded)/g;
const ALLOWED_WEAPON_PROPERTY_TOKEN = /@weapon\.hasProperty\.\w+/g;
const ALLOWED_MATH_FUNCTIONS = /\b(max|min|Math\.(floor|ceil|round|trunc|abs))\b/g;

const BASIC_FORMULA_CHARS = /^[0-9+\-*/().\s]+$/;
const WEAPON_FORMULA_CHARS = /^[0-9+\-*/().\s?:<>=!&|]+$/;

/**
 * Valida fórmulas de modificador global de atributo (usa value/valor y Math.*).
 */
export function validateAttributeModifierFormula(formula: string): string | undefined {
  if (!formula.trim()) {
    return "La fórmula no puede estar vacía";
  }

  let sanitized = formula.replace(/\b(valor|value)\b/g, "0");
  sanitized = sanitized.replace(ALLOWED_MATH_FUNCTIONS, "");

  if (!BASIC_FORMULA_CHARS.test(sanitized)) {
    return "La fórmula contiene tokens o caracteres no permitidos";
  }

  return undefined;
}

/**
 * Valida la sintaxis de una fórmula de sistema antes de persistirla.
 */
export function validateSystemFormula(
  formula: string,
  options?: { allowSkillNamePlaceholder?: boolean; allowWeaponTokens?: boolean }
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
    sanitized = sanitized.replace(/@skills\.[\w-]+\.totalModifier/g, "0");
    if (formula.includes("{skillName}")) {
      return "El placeholder {skillName} solo está permitido en passiveSkillFormula";
    }
  }

  if (options?.allowWeaponTokens) {
    sanitized = sanitized.replace(ALLOWED_WEAPON_TOKEN, "0");
    sanitized = sanitized.replace(ALLOWED_WEAPON_PROPERTY_TOKEN, "0");
  } else if (/@weapon\./.test(formula)) {
    return "Los tokens @weapon.* solo están permitidos en attackBonusFormula y damageBonusFormula";
  }

  sanitized = sanitized.replace(/@\w+/g, "0");
  sanitized = sanitized.replace(ALLOWED_MATH_FUNCTIONS, "");

  const allowedChars = options?.allowWeaponTokens ? WEAPON_FORMULA_CHARS : BASIC_FORMULA_CHARS;
  if (!allowedChars.test(sanitized)) {
    return "La fórmula contiene tokens o caracteres no permitidos";
  }

  return undefined;
}
