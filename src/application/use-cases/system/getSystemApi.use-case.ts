import SystemService from "../../../domain/services/system.service";
import UserService from "../../../domain/services/user.service";
import AttributeService from "../../../domain/services/attribute.service";
import SkillService from "../../../domain/services/skill.service";
import IRaceRepository from "../../../domain/repositories/IRaceRepository";
import { System, SystemApi } from "../../../domain/types/system.types";
import { AttributeApi } from "../../../domain/types/attribute.types";
import { SkillApi } from "../../../domain/types/skill.types";
import { AppError } from "../../../domain/errors/AppError";

export default class GetSystemApi {
  constructor(
    private readonly systemService: SystemService,
    private readonly userService: UserService,
    private readonly raceRepository: IRaceRepository,
    private readonly attributeService: AttributeService,
    private readonly skillService: SkillService
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

    // 1. Get Ancestry
    const ancestry: System[] = [sys];
    let currentId = sys.parentId ? sys.parentId.toString() : '';
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parent = await this.systemService.getById(currentId);
      if (!parent) break;
      ancestry.push(parent);
      currentId = parent.parentId ? parent.parentId.toString() : '';
    }

    // 2. Publisher Name
    let publisherName = sys.publisher;
    if (sys.publisher) {
      const user = await this.userService.getUserById(sys.publisher);
      if (user) {
        publisherName = user.name;
      }
    }

    const isPublisher = userId ? sys.publisher === userId : false;

    // 3. Ancestry Rulesets
    const ancestryRulesets: string[] = [];
    for (const ancestor of ancestry) {
      ancestryRulesets.push(ancestor._id.toString());
      if (ancestor.name) {
        ancestryRulesets.push(ancestor.name);
      }
    }

    // 4. Statistics Counts
    const races = await this.raceRepository.obtenerPorSistema(sys._id.toString());
    const racesCount = races.length;

    // 5 & 6. Attributes and Skills (batch query to avoid N+1)
    const [allAttrs, allSkills] = await Promise.all([
      this.attributeService.getBySystems(ancestryRulesets),
      this.skillService.getBySystems(ancestryRulesets, true)
    ]);

    const attributesMap = new Map<string, AttributeApi>();
    const skillsMap = new Map<string, SkillApi>();

    for (let i = ancestry.length - 1; i >= 0; i--) {
      const ancestor = ancestry[i];
      const ancestorRulesets = [ancestor._id.toString(), ancestor.name].filter(Boolean);

      // Attributes for this ancestor
      const sysAttrs = allAttrs.filter(attr => ancestorRulesets.includes(attr.ruleset));
      for (const attr of sysAttrs) {
        attributesMap.set(attr.key, attr);
      }

      // Skills for this ancestor
      const sysSkills = allSkills.filter(skill => ancestorRulesets.includes(skill.ruleset));
      for (const skill of sysSkills) {
        skillsMap.set(skill.key, skill);
      }
    }

    const attributes = Array.from(attributesMap.values());
    const skills = Array.from(skillsMap.values());

    const getMergedScalar = <T>(key: keyof System, defaultValue?: T): T | undefined => {
      for (const ancestor of ancestry) {
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
      parentId: sys.parentId ? sys.parentId.toString() : undefined,
      canEdit: isPublisher,
      racesCount,
      globalModifierFormula: getMergedScalar<string>('globalModifierFormula'),
      initiativeBonusFormula: getMergedScalar<string>('initiativeBonusFormula'),
      maxAttributeValue: getMergedScalar<number>('maxAttributeValue'),
      defaultMinAttributeValue: getMergedScalar<number>('defaultMinAttributeValue'),
      defaultMaxAttributeValue: getMergedScalar<number>('defaultMaxAttributeValue'),
      creationMinAttributeValue: getMergedScalar<number>('creationMinAttributeValue'),
      creationMaxAttributeValue: getMergedScalar<number>('creationMaxAttributeValue'),
      maxLevel: getMergedScalar<number>('maxLevel'),
      maxSpellLevel: getMergedScalar<number>('maxSpellLevel'),
      attributes,
      skills
    };
  }
}
