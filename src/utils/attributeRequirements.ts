export interface AttributeRequirementCheck {
  attributeMode?: "all" | "any";
  attributes?: { key: string; min: number }[];
}

export function meetsAttributeRequirements(
  requirements: AttributeRequirementCheck | undefined,
  attributes: { key: string; value: number }[]
): boolean {
  const requiredAttributes = requirements?.attributes ?? [];
  if (requiredAttributes.length === 0) return true;

  const values = new Map(attributes.map(attribute => [attribute.key, attribute.value]));
  const checks = requiredAttributes.map(requirement => (values.get(requirement.key) ?? 0) >= requirement.min);

  if (requirements?.attributeMode === "any") {
    return checks.some(Boolean);
  }

  return checks.every(Boolean);
}
