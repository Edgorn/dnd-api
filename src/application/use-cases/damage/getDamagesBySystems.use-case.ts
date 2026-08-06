import DamageService from "../../../domain/services/damage.service";
import { Damage } from "../../../domain/types/damage.types";

export default class GetDamagesBySystems {
  constructor(private readonly damageService: DamageService) {}

  async execute(systems?: string[]): Promise<Omit<Damage, "deletedAt">[]> {
    const rulesets = systems ?? [];
    const damages = await this.damageService.getBySystems(rulesets);
    return damages.map(({ deletedAt, ...rest }) => rest);
  }
}
