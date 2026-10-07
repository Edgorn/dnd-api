import SystemService from "../../../domain/services/system.service";
import UserService from "../../../domain/services/user.service";
import IRaceRepository from "../../../domain/repositories/IRaceRepository";
import { isRulesetSystem, resolveSystemKind, System, SystemApi } from "../../../domain/types/system.types";
import { AppError } from "../../../domain/errors/AppError";
import { mergeRulesFromAncestry } from "../../../utils/systemRulesMerge";

export default class GetSystemApi {
  constructor(
    private readonly systemService: SystemService,
    private readonly userService: UserService,
    private readonly raceRepository: IRaceRepository
  ) {}

  async execute(sysOrId: System | string, userId?: string): Promise<SystemApi> {
    let sys: System | null = null;
    if (typeof sysOrId === "string") {
      sys = await this.systemService.getById(sysOrId);
    } else {
      sys = sysOrId;
    }

    if (!sys) {
      throw new AppError("Sistema no encontrado", 404);
    }

    const ancestry = await this.systemService.getAncestry(sys._id.toString());
    const resolvedAncestry = ancestry.length > 0 ? ancestry : [sys];

    let publisherName = sys.publisher;
    if (sys.publisher) {
      const user = await this.userService.getUserById(sys.publisher);
      if (user) {
        publisherName = user.name;
      }
    }

    const isPublisher = userId ? sys.publisher === userId : false;

    const ancestryRulesets: string[] = [];
    for (const ancestor of resolvedAncestry) {
      ancestryRulesets.push(ancestor._id.toString());
      if (ancestor.name) {
        ancestryRulesets.push(ancestor.name);
      }
    }

    const raceCounts = await this.raceRepository.countRootRacesByRulesets(ancestryRulesets);

    let racesCount = 0;
    for (const key of new Set(ancestryRulesets)) {
      racesCount += raceCounts.get(key) ?? 0;
    }

    const mergedRules = mergeRulesFromAncestry(resolvedAncestry);

    const getMergedScalar = <T>(key: keyof System, defaultValue?: T): T | undefined => {
      for (const ancestor of resolvedAncestry) {
        if (!isRulesetSystem(ancestor)) continue;
        const val = ancestor[key];
        if (val !== undefined && val !== null && val !== '') {
          return val as unknown as T;
        }
      }
      return defaultValue;
    };

    return {
      id: sys._id.toString(),
      name: sys.name || '',
      description: sys.description || '',
      publisher: publisherName,
      isOpen: !!sys.isOpen,
      isBase: !!sys.isBase,
      kind: resolveSystemKind(sys.kind),
      parentIds: (sys.parentIds ?? []).map((id) => id.toString()),
      canEdit: isPublisher,
      racesCount,
      globalModifierFormula: mergedRules.globalModifierFormula,
      initiativeBonusFormula: mergedRules.initiativeBonusFormula,
      maxAttributeValue: getMergedScalar<number>('maxAttributeValue'),
      defaultMinAttributeValue: mergedRules.defaultMinAttributeValue,
      defaultMaxAttributeValue: mergedRules.defaultMaxAttributeValue,
      creationMinAttributeValue: mergedRules.creationMinAttributeValue,
      creationMaxAttributeValue: mergedRules.creationMaxAttributeValue,
      maxLevel: mergedRules.maxLevel,
      maxSpellLevel: mergedRules.maxSpellLevel,
      xpProgression: mergedRules.xpProgression,
      proficiencyProgression: mergedRules.proficiencyProgression,
      abilityScoreProgression: mergedRules.abilityScoreProgression,
      hpInitialFormula: mergedRules.hpInitialFormula,
      hpLevelUpFormula: mergedRules.hpLevelUpFormula,
      baseAcFormula: mergedRules.baseAcFormula,
      passiveSkillFormula: mergedRules.passiveSkillFormula,
      carryingCapacityFormula: mergedRules.carryingCapacityFormula,
      attackBonusFormula: mergedRules.attackBonusFormula,
      damageBonusFormula: mergedRules.damageBonusFormula,
      meleeAttackAttributes: mergedRules.meleeAttackAttributes,
      rangedAttackAttributes: mergedRules.rangedAttackAttributes,
    };
  }
}
