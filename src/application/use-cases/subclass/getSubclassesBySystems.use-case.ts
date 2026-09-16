import SubclassService from "../../../domain/services/subclass.service";
import { SubclassApi } from "../../../domain/types/subclass.types";

export default class GetSubclassesBySystems {
  constructor(private readonly subclassService: SubclassService) { }

  async execute(rulesets: string[], classId?: string): Promise<SubclassApi[]> {
    if (!rulesets.length) {
      return [];
    }
    return this.subclassService.getBySystems(rulesets, classId);
  }
}
