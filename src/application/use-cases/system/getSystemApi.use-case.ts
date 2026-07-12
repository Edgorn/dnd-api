import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import IRazaRepository from "../../../domain/repositories/IRazaRepository";
import IAttributeRepository from "../../../domain/repositories/IAttributeRepository";
import ISkillRepository from "../../../domain/repositories/ISkillRepository";
import { System, SystemApi } from "../../../domain/types/system.types";
import { AttributeApi } from "../../../domain/types/attribute.types";
import { SkillApi } from "../../../domain/types/skill.types";

export default class GetSystemApi {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly userRepository: IUserRepository,
    private readonly razaRepository: IRazaRepository,
    private readonly attributeRepository: IAttributeRepository,
    private readonly skillRepository: ISkillRepository
  ) {}

  async execute(sys: System, userId?: string): Promise<SystemApi> {
    // 1. Get Ancestry
    const ancestry: System[] = [sys];
    let currentId = sys.parentId ? sys.parentId.toString() : '';
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parent = await this.systemRepository.obtenerPorId(currentId);
      if (!parent) break;
      ancestry.push(parent);
      currentId = parent.parentId ? parent.parentId.toString() : '';
    }

    // 2. Publisher Name
    let publisherName = sys.publisher;
    if (sys.publisher) {
      const user = await this.userRepository.getUserById(sys.publisher);
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
    const races = await this.razaRepository.obtenerPorSistema(sys._id.toString());
    const racesCount = races.length;

    // 5. Attributes (handling ancestry override and deleted status)
    const attributesMap = new Map<string, AttributeApi>();
    for (let i = ancestry.length - 1; i >= 0; i--) {
      const ancestor = ancestry[i];
      const isAncestorPublisher = userId ? ancestor.publisher === userId : false;
      const sysAttrs = await this.attributeRepository.getBySystems([ancestor._id.toString(), ancestor.name]);
      for (const attr of sysAttrs) {
        if (!attr.deletedAt || isAncestorPublisher) {
          attributesMap.set(attr.key, attr);
        }
      }
    }
    const attributes = Array.from(attributesMap.values());

    // 6. Skills (handling ancestry override)
    const skillsMap = new Map<string, SkillApi>();
    for (let i = ancestry.length - 1; i >= 0; i--) {
      const ancestor = ancestry[i];
      const isAncestorPublisher = userId ? ancestor.publisher === userId : false;
      const sysSkills = await this.skillRepository.getBySystems([ancestor._id.toString(), ancestor.name], isAncestorPublisher);
      for (const skill of sysSkills) {
        skillsMap.set(skill.key, skill);
      }
    }
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
      defaultMinAttributeValue: getMergedScalar<number>('defaultMinAttributeValue'),
      defaultMaxAttributeValue: getMergedScalar<number>('defaultMaxAttributeValue'),
      creationMinAttributeValue: getMergedScalar<number>('creationMinAttributeValue'),
      creationMaxAttributeValue: getMergedScalar<number>('creationMaxAttributeValue'),
      maxLevel: getMergedScalar<number>('maxLevel'),
      maxSpellLevel: getMergedScalar<number>('maxSpellLevel'),
      attributes,
      skills,
      deletedAt: sys.deletedAt
    };
  }
}
