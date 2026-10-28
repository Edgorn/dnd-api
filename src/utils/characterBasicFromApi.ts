import { Speed } from "../domain/types";
import { CharacterApi, CharacterBasic } from "../domain/types/character.types";

export function toCharacterBasic(
  sheet: CharacterApi,
  extras?: {
    ac?: number;
    speed?: Speed;
  }
): CharacterBasic {
  return {
    id: sheet.id,
    img: sheet.img,
    name: sheet.name,
    race: sheet.race,
    user: sheet.user,
    userId: sheet.userId,
    campaign: sheet.campaign?.name ?? null,
    classes: (sheet.classes ?? []).map(entry => ({ name: entry.name, level: entry.level })),
    subclasses: sheet.subclasses ?? [],
    ac: extras?.ac ?? sheet.ac,
    hpMax: sheet.hpMax,
    hpCurrent: sheet.hpCurrent,
    xp: sheet.xp,
    xpMax: sheet.xpMax,
    attributes: (sheet.attributes ?? []).map(attr => ({ key: attr.key, value: attr.value })),
    systems: sheet.systems ?? [],
    speed: extras?.speed ?? sheet.speed,
  };
}
