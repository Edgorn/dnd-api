import CharacterClassService from "../../../domain/services/characterClass.service";
import SubclassService from "../../../domain/services/subclass.service";
import { CharacterClassSummary, CharacterClassSummaryDraft } from "../../../domain/types/characterClass.types";
import { descriptionTeaser } from "../../../utils/descriptionTeaser";

export default class GetCharacterClassSummaries {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly subclassService: SubclassService
  ) { }

  async execute(rulesets?: string[]): Promise<CharacterClassSummary[]> {
    if (!rulesets || rulesets.length === 0) {
      return [];
    }

    const drafts = await this.characterClassService.getSummaries(rulesets);
    const counts = await this.subclassService.countByClassIds(
      drafts.map(draft => draft.id),
      rulesets
    );

    return drafts.map(draft => toCharacterClassSummary(draft, counts.get(draft.id) ?? 0));
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
