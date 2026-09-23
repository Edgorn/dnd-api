import { BackgroundOverlayField } from "../domain/types/background.types";

export const BACKGROUND_OVERLAY_FIELDS: readonly BackgroundOverlayField[] = [
  "name",
  "description",
  "img",
  "god",
  "traits",
  "traits_choices",
  "traits_data",
  "skills",
  "language_choices",
  "proficiencies",
  "proficiencies_choices",
  "personality_traits",
  "tables",
  "ideals",
  "bonds",
  "flaws",
  "money",
  "equipment",
  "equipment_choices"
];

export function isBackgroundOverlayField(key: string): key is BackgroundOverlayField {
  return (BACKGROUND_OVERLAY_FIELDS as readonly string[]).includes(key);
}

export function overlayFieldsPresent(overlay: object): BackgroundOverlayField[] {
  return BACKGROUND_OVERLAY_FIELDS.filter(key =>
    Object.prototype.hasOwnProperty.call(overlay, key)
    && (overlay as Record<string, unknown>)[key] !== undefined
  );
}

export function mergeBackgroundVariant<T extends object>(
  parent: T,
  overlay: object
): { merged: T; overriddenFields: BackgroundOverlayField[] } {
  const overriddenFields = overlayFieldsPresent(overlay);
  const merged = { ...parent };

  for (const key of overriddenFields) {
    (merged as Record<string, unknown>)[key] = (overlay as Record<string, unknown>)[key];
  }

  return { merged, overriddenFields };
}
