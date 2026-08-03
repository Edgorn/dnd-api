import MagicSchoolService from "../../../domain/services/magicSchool.service";
import { MagicSchoolApi } from "../../../domain/types/magicSchool.types";

export default class GetMagicSchoolsBySystems {
  constructor(
    private readonly magicSchoolService: MagicSchoolService
  ) {}

  async execute(rulesets?: string[]): Promise<MagicSchoolApi[]> {
    if (!rulesets || rulesets.length === 0) {
      return [];
    }
    return this.magicSchoolService.getBySystems(rulesets);
  }
}
