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
