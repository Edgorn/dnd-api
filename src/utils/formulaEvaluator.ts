import { CharacterAttributeApi } from "../domain/types/attribute.types";

/**
 * Evalúa una fórmula de bono de personaje (como iniciativa o modificador de skill)
 * resolviendo las variables de características e inputs personalizados de forma segura.
 * 
 * @param formula Fórmula con variables tipo @attributes.key.modifier o @proficiency
 * @param attributes Listado de atributos del personaje ya calculados
 * @param variables Variables dinámicas adicionales (como bono de competencia)
 * @returns El resultado matemático redondeado o 0 en caso de error/fórmula inválida
 */
export function evaluateFormula(
  formula: string,
  attributes: CharacterAttributeApi[],
  variables?: Record<string, number | string>
): number {
  if (!formula) return 0;

  // Reemplazar atributos: @attributes.dex.modifier o @attributes.dex.value
  const regexFormula = /@attributes\.(\w+)\.(modifier|value)/g;
  let evaluatedFormula = formula.replace(regexFormula, (match, key, prop) => {
    const attr = attributes.find(a => a.key === key);
    if (!attr) return '0';
    const val = attr[prop as 'modifier' | 'value'];
    return val !== undefined ? String(val) : '0';
  });

  // Reemplazar variables personalizadas dinámicas (ej: @proficiency o @prof)
  if (variables) {
    Object.entries(variables).forEach(([key, val]) => {
      const regexVar = new RegExp(`@${key}\\b`, 'g');
      evaluatedFormula = evaluatedFormula.replace(regexVar, String(val));
    });
  }

  // Sanitizar y validar que la fórmula resultante solo contenga caracteres matemáticos permitidos
  if (/^[0-9+\-**/().\s]+$/.test(evaluatedFormula)) {
    try {
      const calcFunc = new Function(`return ${evaluatedFormula}`);
      return calcFunc();
    } catch (e) {
      console.error("Error al evaluar la fórmula matemática:", formula, "Fórmula evaluada:", evaluatedFormula, e);
    }
  } else {
    console.error("Fórmula insegura o no permitida detectada:", formula, "Fórmula evaluada:", evaluatedFormula);
  }

  return 0;
}

/**
 * Evalúa de forma segura la fórmula de modificador de atributo global (ej. Math.floor((value - 10) / 2))
 * 
 * @param formula Fórmula matemática con variable 'value' o 'valor'
 * @param value Valor numérico del atributo
 * @returns Modificador calculado o undefined en caso de error/fórmula insegura
 */
export function evaluateAttributeModifier(
  formula: string,
  value: number
): number | undefined {
  if (!formula) return undefined;

  const evaluated = formula.replace(/valor/g, 'value').replace(/value/g, String(value));

  // Sanitizar: verificar que solo contenga Math.floor/ceil/round/trunc/abs, números, espacios y operadores básicos
  const sanitized = evaluated
    .replace(/Math\.(floor|ceil|round|trunc|abs)/g, '')
    .replace(/[0-9+\-*/().\s]/g, '');

  if (sanitized === '') {
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
