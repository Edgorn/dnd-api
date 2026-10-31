import CharacterClassService from "../../../domain/services/characterClass.service";
import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { NotFoundError } from "../../../domain/errors/AppError";
import { CharacterClassDetailApi } from "../../../domain/types/characterClass.types";
import { SubclassSummary, SubclassSummaryDraft } from "../../../domain/types/subclass.types";
import { descriptionTeaser } from "../../../utils/descriptionTeaser";

export default class GetCharacterClassById {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, ruleset?: string): Promise<CharacterClassDetailApi> {
    const characterClass = await this.characterClassService.getById(id);
    if (!characterClass || characterClass.deletedAt) {
      throw new NotFoundError("Clase no encontrada");
    }

    let hydrationRulesets: string[];
    if (ruleset) {
      hydrationRulesets = await this.systemService.getSystemsAndAncestors([ruleset]);
      if (!hydrationRulesets.includes(characterClass.ruleset)) {
        throw new NotFoundError("Clase no encontrada");
      }
      const exclusions = await this.systemService.getResolvedCatalogExclusions([ruleset]);
      if (exclusions.classIds.has(id)) {
        throw new NotFoundError("Clase no encontrada");
      }
    } else {
      hydrationRulesets = characterClass.ruleset
        ? await this.systemService.getSystemsAndAncestors([characterClass.ruleset])
        : [];
    }

    const drafts = await this.subclassService.getSummariesByClassAndSystems(id, hydrationRulesets);
    const { subclasses: _ignored, ...rest } = characterClass;
    return {
      ...rest,
      ...(drafts.length ? { subclasses: drafts.map(toSubclassSummary) } : {})
    };
  }
}

export function toSubclassSummary(draft: SubclassSummaryDraft): SubclassSummary {
  return {
    id: draft.id,
    name: draft.name,
    img: draft.img,
    descriptionTeaser: descriptionTeaser(draft.description),
    ruleset: draft.ruleset,
    classId: draft.classId
  };
}
