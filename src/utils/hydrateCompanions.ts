import { CharacterCompanion, CharacterCompanionApi } from "../domain/types/character.types";
import { CreatureApi } from "../domain/types/creature.types";

function creatureLookupKey(id: string | undefined): string | undefined {
  const trimmed = id?.trim();
  return trimmed ? trimmed : undefined;
}

export function hydrateCompanions(
  companions: CharacterCompanion[],
  creatures: CreatureApi[]
): CharacterCompanionApi[] {
  const creatureById = new Map<string, CreatureApi>();
  for (const creature of creatures) {
    const key = creatureLookupKey(creature.id);
    if (key) creatureById.set(key, creature);
  }

  return companions.map(companion => {
    const hydrated: CharacterCompanionApi = { ...companion };
    const creatureId = creatureLookupKey(companion.creatureId);
    if (!creatureId) return hydrated;

    const creature = creatureById.get(creatureId);
    if (!creature) return hydrated;

    hydrated.creature = creature;
    hydrated.hpMax = creature.HPMax;
    hydrated.ac = creature.CA;
    if (creature.attributes?.length) {
      hydrated.attributes = creature.attributes;
    }
    if (creature.speed) {
      hydrated.speed = creature.speed;
    }
    if (creature.size) {
      hydrated.size = creature.size;
    }
    if (typeof creature.carryingCapacity === "number") {
      hydrated.carryingCapacity = creature.carryingCapacity;
    }
    return hydrated;
  });
}
