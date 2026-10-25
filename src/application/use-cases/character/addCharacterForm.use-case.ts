import CharacterService from "../../../domain/services/character.service";
import SpellService from "../../../domain/services/spell.service";
import CreatureService from "../../../domain/services/creature.service";
import SystemService from "../../../domain/services/system.service";
import TraitService from "../../../domain/services/trait.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { CharacterApi, TypeAddCharacterForm } from "../../../domain/types/character.types";
import { creatureMatchesAnyFormPool, formPoolsForSpell } from "../../../utils/creatureFormPool";

export default class AddCharacterForm {
  constructor(
    private readonly characterService: CharacterService,
    private readonly spellService: SpellService,
    private readonly creatureService: CreatureService,
    private readonly systemService: SystemService,
    private readonly traitService: TraitService
  ) { }

  async execute(data: TypeAddCharacterForm): Promise<CharacterApi> {
    const spell = await this.spellService.getById(data.spellId);
    if (!spell || spell.deletedAt) {
      throw new NotFoundError("Conjuro no encontrado");
    }
    if (!spell.creatureForm) {
      throw new AppError("El conjuro no define formas de criatura", 400);
    }

    const creature = await this.creatureService.getById(data.creatureId);
    if (!creature || creature.deletedAt) {
      throw new NotFoundError("Criatura no encontrada");
    }

    const traitIds = await this.characterService.getOwnedTraitIds(data.id, data.userId);
    const traits = traitIds.length ? await this.traitService.getTraitsByIndexes(traitIds) : [];
    const pools = formPoolsForSpell(spell, traits);

    if (!creatureMatchesAnyFormPool(pools, {
      id: creature.id,
      creatureTypeId: creature.creatureType?.id,
      creatureType: creature.creatureType,
      challenge_rating: creature.challenge_rating,
      size: creature.size,
      tags: creature.tags
    })) {
      throw new AppError("La criatura no está permitida por este conjuro", 400);
    }

    const allowedRulesets = await this.systemService.getSystemsAndAncestors([spell.ruleset]);
    if (!allowedRulesets.includes(creature.ruleset)) {
      throw new AppError("La criatura no pertenece a este sistema ni a sus ancestros", 400);
    }

    return this.characterService.addForm({
      id: data.id,
      userId: data.userId,
      entry: {
        creatureId: creature.id,
        spellId: spell.id ?? data.spellId,
        purpose: spell.creatureForm.purpose
      },
      choose: spell.creatureForm.choose,
      replaceOnRecast: spell.creatureForm.replaceOnRecast
    });
  }
}
