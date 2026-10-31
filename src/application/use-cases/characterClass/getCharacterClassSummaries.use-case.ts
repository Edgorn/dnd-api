import CharacterClassService from "../../../domain/services/characterClass.service";
import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { CharacterClassSummary, CharacterClassSummaryDraft } from "../../../domain/types/characterClass.types";
import { descriptionTeaser } from "../../../utils/descriptionTeaser";
import { filterExcludedById } from "../../../utils/catalogExclusions";

export default class GetCharacterClassSummaries {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService
  ) { }

  async execute(rulesets?: string[]): Promise<CharacterClassSummary[]> {
    if (!rulesets || rulesets.length === 0) {
      return [];
    }

    const drafts = await this.characterClassService.getSummaries(rulesets);
    const exclusions = await this.systemService.getResolvedCatalogExclusions(rulesets);
    const visible = filterExcludedById(drafts, exclusions.classIds);
    const counts = await this.subclassService.countByClassIds(
      visible.map(draft => draft.id),
      rulesets
    );

    return visible.map(draft => toCharacterClassSummary(draft, counts.get(draft.id) ?? 0));
  }
}

export function toCharacterClassSummary(
  draft: CharacterClassSummaryDraft,
  subclassCount: number
): CharacterClassSummary {
  return {
    id: draft.id,
    name: draft.name,
    img: draft.img,
    descriptionTeaser: descriptionTeaser(draft.description),
    ruleset: draft.ruleset,
    hit_die: draft.hit_die,
    hasSpellcasting: draft.hasSpellcasting,
    subclassChoice: draft.subclassChoice,
    subclassCount
  };
}
