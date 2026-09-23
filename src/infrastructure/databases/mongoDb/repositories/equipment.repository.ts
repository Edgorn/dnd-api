import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import IPropertyRepository from "../../../../domain/repositories/IPropertyRepository";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import ICoinRepository from "../../../../domain/repositories/ICoinRepository";
import IArmorTypeRepository from "../../../../domain/repositories/IArmorTypeRepository";
import { Types } from "mongoose";
import {
  EquipmentApi,
  EquipmentCost,
  EquipmentCostApi,
  EquipmentMongo,
  InputCreateEquipment,
  InputUpdateEquipment,
  CharacterEquipmentMongo,
  EquipmentInstanceApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentChoiceMongo,
  EquipmentChoiceBranchMongo,
  EquipmentChoiceBranchApi,
  EquipmentChoiceLeafMongo,
  EquipmentChoiceLeafApi,
  ResolvedEquipmentChoiceApi,
  EquipmentChoiceFilter,
  EquipmentBasic,
  WeaponMongo,
  WeaponApi,
  WeaponDamageMongo,
  WeaponDamageApi,
  WeaponBasic,
  ArmorMongo,
  ArmorApi,
  ArmorBasic,
  BODY_EQUIP_SLOTS
} from "../../../../domain/types/equipment.types";
import { CoinApi } from "../../../../domain/types/coin.types";
import { Damage } from "../../../../domain/types/damage.types";
import { Property } from "../../../../domain/types/property.types";
import { ProficiencyApi } from "../../../../domain/types/proficiencies.types";
import { ArmorType } from "../../../../domain/types/armorType.types";
import { NotFoundError } from "../../../../domain/errors/AppError";
import EquipmentModel from "../schemas/Equipment";
import DamageRepository from "./damage.repository";
import PropertyRepository from "./property.repository";
import ProficiencyRepository from "./proficiency.repository";
import CoinRepository from "./coin.repository";
import { ordenarPorNombre, ordenarPorFavoritoYNombre } from "../../../../utils/formatters";

type EquipmentLookups = {
  coins: Map<string, CoinApi>;
  damages: Map<string, Damage>;
  properties: Map<string, Property>;
  proficiencies: Map<string, ProficiencyApi>;
  armorTypes: Map<string, ArmorType>;
  equipments: Map<string, EquipmentMongo>;
};

type IdBuckets = {
  coins: Set<string>;
  damages: Set<string>;
  properties: Set<string>;
  proficiencies: Set<string>;
  armorTypes: Set<string>;
  contentRefs: Set<string>;
};

export default class EquipmentRepository implements IEquipmentRepository {
  private static readonly MAX_CONTENT_DEPTH = 5;

  private readonly systemRepository?: ISystemRepository;
  private readonly damageRepository: IDamageRepository;
  private readonly propertyRepository: IPropertyRepository;
  private readonly proficiencyRepository: IProficiencyRepository;
  private readonly coinRepository: ICoinRepository;
  private readonly armorTypeRepository?: IArmorTypeRepository;

  constructor(
    systemRepository?: ISystemRepository,
    damageRepository?: IDamageRepository,
    propertyRepository?: IPropertyRepository,
    proficiencyRepository?: IProficiencyRepository,
    coinRepository?: ICoinRepository,
    armorTypeRepository?: IArmorTypeRepository
  ) {
    this.systemRepository = systemRepository;
    this.damageRepository = damageRepository ?? new DamageRepository();
    this.propertyRepository = propertyRepository ?? new PropertyRepository();
    this.proficiencyRepository = proficiencyRepository ?? new ProficiencyRepository(systemRepository as any);
    this.coinRepository = coinRepository ?? new CoinRepository(systemRepository);
    this.armorTypeRepository = armorTypeRepository;
  }

  async create(data: InputCreateEquipment): Promise<EquipmentApi> {
    const newEquipment = new EquipmentModel({
      ruleset: data.ruleset,
      name: data.name,
      description: data.description,
      cost: data.cost,
      weight: data.weight,
      category: data.category,
      subcategory: data.subcategory,
      equipSlot: data.equipSlot ?? null,
      storageTags: data.storageTags,
      materials: data.materials,
      containerStats: data.containerStats,
      proficiencies: data.proficiencies,
      weapon: data.weapon,
      armor: data.armor,
      content: data.content,
      deletedAt: null
    });

    await newEquipment.save();
    return await this.formatEquipment(newEquipment);
  }

  async update(data: InputUpdateEquipment): Promise<EquipmentApi> {
    const { id, ...updateFields } = data;
    const updated = await EquipmentModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    ).lean();

    if (!updated) {
      throw new NotFoundError(`No se encontró el equipamiento con id: ${id}`);
    }

    return await this.formatEquipment(updated);
  }

  async getById(id: string): Promise<EquipmentApi | null> {
    const equipment = await EquipmentModel.findOne({ _id: id } as any).lean();
    if (!equipment) return null;
    return await this.formatEquipment(equipment);
  }

  async getBySystems(rulesets: string[]): Promise<EquipmentApi[]> {
    let filter: any = { deletedAt: null };

    if (rulesets && rulesets.length > 0) {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors(rulesets)
        : rulesets;
      filter.ruleset = { $in: expandedRulesets };
    }

    const equipments = await EquipmentModel.find(filter).lean();
    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return ordenarPorNombre(equipments.map(e => this.formatEquipmentSync(e, lookups)));
  }

  async softDelete(id: string): Promise<void> {
    await EquipmentModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await EquipmentModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await EquipmentModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await EquipmentModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  async getCharacterEquipmentsByIds(
    equipments: CharacterEquipmentMongo[] | Array<string | CharacterEquipmentMongo> | undefined
  ): Promise<EquipmentInstanceApi[] | undefined> {
    if (!equipments) return undefined;
    if (!equipments.length) return [];

    const normalized = equipments.map(item =>
      typeof item === "string" ? { id: item, quantity: 1 } : item
    );
    const lookups = await this.buildLookups(normalized);
    return ordenarPorFavoritoYNombre(
      normalized.map(item => this.formatCharacterEquipmentSync(item, lookups, new Set()))
    );
  }

  async formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined> {
    if (!choices) return undefined;

    return Promise.all(
      choices.map(choiceGroup =>
        Promise.all(choiceGroup.map(choice => this.formatEquipmentChoice(choice)))
      )
    );
  }

  async formatEquipmentItemChoices(
    choices: EquipmentChoiceMongo[] | undefined,
    ruleset?: string
  ): Promise<ResolvedEquipmentChoiceApi[] | undefined> {
    if (!choices) return undefined;
    return Promise.all(choices.map(choice => this.formatEquipmentItemChoice(choice, ruleset)));
  }

  async getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]> {
    const equipments = await EquipmentModel.find({
      category: { $in: types },
      deletedAt: null
    }).lean();

    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return ordenarPorNombre(equipments.map(e => this.formatEquipmentBasicSync(e, lookups)));
  }

  async getWeapons(rulesets: string[] = []): Promise<EquipmentBasic[]> {
    const query: Record<string, unknown> = {
      weapon: { $exists: true, $ne: null },
      deletedAt: null
    };

    if (rulesets.length > 0) {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors(rulesets)
        : rulesets;
      query.ruleset = { $in: expandedRulesets };
    }

    const equipments = await EquipmentModel.find(query).lean();
    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return ordenarPorNombre(equipments.map(e => this.formatEquipmentBasicSync(e, lookups)));
  }

  async getArmor(rulesets: string[] = []): Promise<EquipmentBasic[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
      $or: [
        { equipSlot: { $in: [...BODY_EQUIP_SLOTS] } },
        {
          equipSlot: "off_hand",
          "armor.class": { $exists: true, $ne: null }
        }
      ]
    };

    if (rulesets.length > 0) {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors(rulesets)
        : rulesets;
      query.ruleset = { $in: expandedRulesets };
    }

    const equipments = await EquipmentModel.find(query).lean();
    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return ordenarPorNombre(equipments.map(e => this.formatEquipmentBasicSync(e, lookups)));
  }

  // Formatting helpers
  private emptyIdBuckets(): IdBuckets {
    return {
      coins: new Set(),
      damages: new Set(),
      properties: new Set(),
      proficiencies: new Set(),
      armorTypes: new Set(),
      contentRefs: new Set()
    };
  }

  private extractCostUnitId(cost?: EquipmentCost | { quantity?: number; unit?: unknown }): string {
    if (!cost?.unit) return "";
    if (typeof cost.unit === "object" && cost.unit !== null && (cost.unit as { _id?: unknown })._id) {
      return String((cost.unit as { _id: unknown })._id);
    }
    return String(cost.unit);
  }

  private collectRefs(
    node: EquipmentMongo | CharacterEquipmentMongo | Record<string, any>,
    buckets: IdBuckets,
    visited: WeakSet<object> = new WeakSet()
  ): void {
    if (!node || typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);

    const unitId = this.extractCostUnitId(node.cost);
    if (unitId) buckets.coins.add(unitId);

    for (const proficiencyId of node.proficiencies ?? []) {
      if (proficiencyId) buckets.proficiencies.add(proficiencyId);
    }

    if (node.armor?.typeId) buckets.armorTypes.add(node.armor.typeId);

    for (const damage of node.weapon?.damage ?? []) {
      if (damage?.type) buckets.damages.add(damage.type);
    }
    for (const damage of node.weapon?.two_handed_damage ?? []) {
      if (damage?.type) buckets.damages.add(damage.type);
    }
    for (const propertyId of node.weapon?.properties ?? []) {
      if (propertyId) buckets.properties.add(propertyId);
    }

    for (const child of node.content ?? []) {
      if (child?.id) buckets.contentRefs.add(child.id);
      if (child?.equipmentId) buckets.contentRefs.add(child.equipmentId);
      this.collectRefs(child, buckets, visited);
    }
  }

  private async buildLookups(
    roots: Array<EquipmentMongo | CharacterEquipmentMongo | Record<string, any>>
  ): Promise<EquipmentLookups> {
    const buckets = this.emptyIdBuckets();
    const equipments = new Map<string, EquipmentMongo>();
    const visited = new WeakSet<object>();

    for (const root of roots) {
      const instance = root as CharacterEquipmentMongo;
      const isInstance = Boolean(instance.equipmentId)
        || (instance.quantity !== undefined && Boolean(instance.id));

      if (isInstance) {
        const catalogId = instance.equipmentId ?? instance.id;
        if (catalogId && Types.ObjectId.isValid(catalogId)) {
          buckets.contentRefs.add(catalogId);
        }
      } else {
        const rootId = (root as { _id?: { toString(): string } })._id?.toString();
        if (rootId) {
          equipments.set(rootId, root as EquipmentMongo);
        }
      }
      this.collectRefs(root, buckets, visited);
    }

    let frontier = [...buckets.contentRefs].filter(
      id => Types.ObjectId.isValid(id) && !equipments.has(id)
    );

    for (
      let depth = 0;
      depth < EquipmentRepository.MAX_CONTENT_DEPTH && frontier.length > 0;
      depth++
    ) {
      const docs = await EquipmentModel.find({ _id: { $in: frontier } } as any).lean<EquipmentMongo[]>();
      const nextContentRefs = new Set<string>();
      const nestedBuckets: IdBuckets = {
        coins: buckets.coins,
        damages: buckets.damages,
        properties: buckets.properties,
        proficiencies: buckets.proficiencies,
        armorTypes: buckets.armorTypes,
        contentRefs: nextContentRefs
      };

      for (const doc of docs) {
        const id = doc._id.toString();
        if (equipments.has(id)) continue;
        equipments.set(id, doc);
        this.collectRefs(doc, nestedBuckets, visited);
      }

      frontier = [...nextContentRefs].filter(
        id => Types.ObjectId.isValid(id) && !equipments.has(id)
      );
    }

    const [coins, damages, properties, proficiencies, armorTypes] = await Promise.all([
      this.coinRepository.getCoinsByIds([...buckets.coins]),
      this.damageRepository.getByIds([...buckets.damages], true),
      this.propertyRepository.getByIds([...buckets.properties]),
      this.proficiencyRepository.getProficienciesByIndices([...buckets.proficiencies]),
      this.armorTypeRepository?.getByIds([...buckets.armorTypes]) ?? Promise.resolve([])
    ]);

    return {
      coins: new Map(coins.map(coin => [coin.id, coin])),
      damages: new Map(
        damages.flatMap(damage => (damage.id ? [[damage.id, damage] as [string, Damage]] : []))
      ),
      properties: new Map(
        properties.flatMap(property => (property.id ? [[property.id, property] as [string, Property]] : []))
      ),
      proficiencies: new Map(proficiencies.map(proficiency => [proficiency.id, proficiency])),
      armorTypes: new Map(armorTypes.map(armorType => [armorType.id, armorType])),
      equipments
    };
  }

  private async formatEquipment(equipment: any): Promise<EquipmentApi> {
    const lookups = await this.buildLookups([equipment]);
    return this.formatEquipmentSync(equipment, lookups);
  }

  private formatEquipmentSync(
    equipment: any,
    lookups: EquipmentLookups,
    ancestry: Set<string> = new Set(),
    includeContent = true
  ): EquipmentApi {
    const idStr = equipment._id ? equipment._id.toString() : equipment.id || "";
    const nextAncestry = new Set(ancestry);
    if (idStr) nextAncestry.add(idStr);

    const isCycle = Boolean(idStr && ancestry.has(idStr));
    const canExpandContent =
      includeContent && !isCycle && nextAncestry.size <= EquipmentRepository.MAX_CONTENT_DEPTH;

    return {
      id: idStr,
      ruleset: equipment.ruleset || "",
      name: equipment.name || "",
      description: this.formatCharacterDescription(equipment.description),
      cost: this.formatEquipmentCostSync(equipment.cost, lookups),
      weight: equipment.weight ?? 0,
      category: equipment.category || "",
      subcategory: equipment.subcategory || "",
      equipSlot: equipment.equipSlot ?? null,
      storageTags: equipment.storageTags,
      materials: equipment.materials,
      containerStats: equipment.containerStats,
      isMagic: equipment.isMagic ?? false,
      proficiencies: this.resolveProficiencies(equipment.proficiencies ?? [], lookups),
      content: canExpandContent
        ? this.formatContentSync(equipment.content ?? [], lookups, nextAncestry)
        : [],
      weapon: this.formatWeaponSync(equipment.weapon, lookups),
      armor: this.formatArmorSync(equipment.armor, lookups),
      bonuses: equipment.bonuses,
      deletedAt: equipment.deletedAt ?? null
    };
  }

  private formatEquipmentCostSync(
    cost: EquipmentCost | { quantity?: number; unit?: unknown } | undefined,
    lookups: EquipmentLookups
  ): EquipmentCostApi {
    const quantity = cost?.quantity ?? 0;
    const unitId = this.extractCostUnitId(cost);
    const coin = unitId ? lookups.coins.get(unitId) : undefined;

    if (coin) {
      return {
        quantity,
        ...coin
      };
    }

    return {
      quantity,
      id: unitId,
      ruleset: "",
      name: "",
      abbreviation: "",
      isBase: false,
      multiplier: 1,
      weight: 0,
      color: ""
    };
  }

  private formatEquipmentBasicSync(equipment: any, lookups: EquipmentLookups): EquipmentBasic {
    return {
      id: equipment._id.toString(),
      name: equipment.name || "",
      category: equipment.category || "",
      subcategory: equipment.subcategory || "",
      equipSlot: equipment.equipSlot ?? null,
      weapon: this.formatWeaponBasic(equipment.weapon),
      armor: this.formatArmorBasicSync(equipment.armor, lookups)
    };
  }

  private formatWeaponBasic(weapon?: WeaponMongo): WeaponBasic | undefined {
    if (!weapon) return undefined;
    return {
      category: weapon.category,
      range: weapon.range
    };
  }

  private formatArmorBasicSync(armor: ArmorMongo | undefined, lookups: EquipmentLookups): ArmorBasic | undefined {
    if (!armor) return undefined;
    const formatted = this.formatArmorSync(armor, lookups);
    if (!formatted) return undefined;
    return {
      typeId: formatted.type?.id ?? armor.typeId,
      typeName: formatted.type?.name
    };
  }

  private mergeWeapon(base?: WeaponMongo, override?: WeaponMongo): WeaponMongo | undefined {
    if (!base && !override) return undefined;
    if (!base) return override;
    if (!override) return base;

    return {
      ...base,
      ...override,
      damage: override.damage ?? base.damage,
      two_handed_damage: override.two_handed_damage ?? base.two_handed_damage,
      properties: override.properties ?? base.properties
    };
  }

  private mergeArmor(base?: ArmorMongo, override?: ArmorMongo): ArmorMongo | undefined {
    if (!base && !override) return undefined;
    if (!base) return override;
    if (!override) return base;

    return {
      ...base,
      ...override,
      class: override.class ?? base.class,
      attributeMinimum: override.attributeMinimum ?? base.attributeMinimum,
      disadvantageSkillKeys: override.disadvantageSkillKeys ?? base.disadvantageSkillKeys
    };
  }

  private formatCharacterDescription(description?: string | string[]): string {
    if (!description) return "";
    return Array.isArray(description) ? description.join("\n") : description;
  }

  private formatContentSync(
    content: CharacterEquipmentMongo[],
    lookups: EquipmentLookups,
    ancestry: Set<string>
  ): EquipmentInstanceApi[] {
    return ordenarPorFavoritoYNombre(
      content.map(child => this.formatCharacterEquipmentSync(child, lookups, ancestry))
    );
  }

  private formatCharacterEquipmentSync(
    charEquipment: CharacterEquipmentMongo,
    lookups: EquipmentLookups,
    ancestry: Set<string>
  ): EquipmentInstanceApi {
    const quantity = charEquipment.quantity ?? 1;
    const catalogId = charEquipment.equipmentId ?? charEquipment.id;
    const matched = catalogId ? lookups.equipments.get(catalogId) : undefined;
    const idStr = catalogId || (matched?._id ? matched._id.toString() : "");
    const isCycle = Boolean(idStr && ancestry.has(idStr));
    const nextAncestry = new Set(ancestry);
    if (idStr) nextAncestry.add(idStr);
    const canExpandContent = !isCycle && nextAncestry.size <= EquipmentRepository.MAX_CONTENT_DEPTH;

    if (!matched) {
      return {
        id: idStr,
        instanceId: charEquipment.instanceId,
        ruleset: "",
        name: charEquipment.name ?? idStr,
        description: this.formatCharacterDescription(charEquipment.description),
        quantity,
        content: canExpandContent
          ? this.formatContentSync(charEquipment.content ?? [], lookups, nextAncestry)
          : [],
        cost: this.formatEquipmentCostSync(charEquipment.cost, lookups),
        weight: charEquipment.weight ?? 0,
        category: charEquipment.category ?? "",
        subcategory: charEquipment.subcategory ?? "",
        equipSlot: charEquipment.equipSlot ?? null,
        storageTags: charEquipment.storageTags ?? undefined,
        materials: charEquipment.materials ?? undefined,
        containerStats: charEquipment.containerStats ?? undefined,
        bonuses: charEquipment.bonuses,
        proficiencies: this.resolveProficiencies(charEquipment.proficiencies ?? [], lookups),
        weapon: this.formatWeaponSync(charEquipment.weapon, lookups),
        armor: this.formatArmorSync(charEquipment.armor, lookups),
        isMagic: charEquipment.isMagic ?? false,
        isBond: charEquipment.isBond ?? false,
        isFavorite: charEquipment.isFavorite ?? false,
        equipped: charEquipment.equipped ?? false,
        deletedAt: null
      };
    }

    const formattedEq = this.formatEquipmentSync(
      matched,
      lookups,
      ancestry,
      canExpandContent && charEquipment.content === undefined
    );

    return {
      ...formattedEq,
      instanceId: charEquipment.instanceId,
      name: charEquipment.name ?? formattedEq.name,
      description: charEquipment.description
        ? this.formatCharacterDescription(charEquipment.description)
        : formattedEq.description,
      quantity,
      category: charEquipment.category ?? formattedEq.category,
      subcategory: charEquipment.subcategory ?? formattedEq.subcategory,
      weight: charEquipment.weight ?? formattedEq.weight,
      equipSlot: charEquipment.equipSlot !== undefined ? charEquipment.equipSlot : formattedEq.equipSlot,
      storageTags: charEquipment.storageTags ?? formattedEq.storageTags,
      materials: charEquipment.materials ?? formattedEq.materials,
      containerStats: charEquipment.containerStats ?? formattedEq.containerStats,
      bonuses: charEquipment.bonuses ?? formattedEq.bonuses,
      content: charEquipment.content !== undefined
        ? (canExpandContent ? this.formatContentSync(charEquipment.content, lookups, nextAncestry) : [])
        : formattedEq.content,
      proficiencies: charEquipment.proficiencies !== undefined
        ? this.resolveProficiencies(charEquipment.proficiencies, lookups)
        : formattedEq.proficiencies,
      weapon: charEquipment.weapon
        ? this.formatWeaponSync(this.mergeWeapon(matched.weapon, charEquipment.weapon), lookups)
        : formattedEq.weapon,
      armor: charEquipment.armor
        ? this.formatArmorSync(this.mergeArmor(matched.armor, charEquipment.armor), lookups)
        : formattedEq.armor,
      isMagic: charEquipment.isMagic ?? formattedEq.isMagic ?? false,
      isBond: charEquipment.isBond ?? false,
      isFavorite: charEquipment.isFavorite ?? false,
      equipped: charEquipment.equipped ?? false,
      cost: charEquipment.cost
        ? this.formatEquipmentCostSync(charEquipment.cost, lookups)
        : formattedEq.cost
    };
  }

  private formatArmorSync(armor: ArmorMongo | undefined, lookups: EquipmentLookups): ArmorApi | undefined {
    if (!armor) return undefined;

    let type = null;
    if (armor.typeId) {
      const found = lookups.armorTypes.get(armor.typeId);
      type = found && !found.deletedAt ? found : null;
    }

    return {
      type,
      class: armor.class
        ? {
            base: armor.class.base,
            ...(armor.class.attributeBonus ? { attributeBonus: armor.class.attributeBonus } : {})
          }
        : undefined,
      attributeMinimum: armor.attributeMinimum,
      disadvantageSkillKeys: armor.disadvantageSkillKeys
    };
  }

  private formatWeaponSync(weapon: WeaponMongo | undefined, lookups: EquipmentLookups): WeaponApi | undefined {
    if (!weapon) return undefined;

    return {
      category: weapon.category,
      damage: this.formatDamagesSync(weapon.damage ?? [], lookups),
      two_handed_damage: this.formatDamagesSync(weapon.two_handed_damage ?? [], lookups),
      properties: this.resolveProperties(weapon.properties ?? [], lookups),
      range: weapon.range,
      range_throw: weapon.range_throw
    };
  }

  private formatDamagesSync(damages: WeaponDamageMongo[], lookups: EquipmentLookups): WeaponDamageApi[] {
    return damages.map(damage => this.formatDamageSync(damage, lookups));
  }

  private formatDamageSync(damage: WeaponDamageMongo, lookups: EquipmentLookups): WeaponDamageApi {
    const foundDamage = lookups.damages.get(damage?.type ?? "");

    return {
      dice: damage.dice,
      name: foundDamage?.name ?? "",
      desc: foundDamage?.description ?? ""
    };
  }

  private resolveProficiencies(ids: string[], lookups: EquipmentLookups): ProficiencyApi[] {
    return ordenarPorNombre(
      ids
        .map(id => lookups.proficiencies.get(id))
        .filter((proficiency): proficiency is ProficiencyApi => Boolean(proficiency))
    );
  }

  private resolveProperties(ids: string[], lookups: EquipmentLookups): Property[] {
    return ordenarPorNombre(
      ids
        .map(id => lookups.properties.get(id))
        .filter((property): property is Property => Boolean(property))
    );
  }

  private async formatEquipmentChoice(choice: EquipmentOptionsMongo): Promise<EquipmentChoiceApi> {
    if (Array.isArray(choice.options)) {
      const options = await this.getCharacterEquipmentsByIds(
        choice.options.map(option => {
          if (typeof option === "string") {
            return {
              id: option,
              quantity: choice.quantity
            };
          } else {
            return {
              id: option.id,
              quantity: option.quantity ?? 1
            };
          }
        })
      );

      const name = options?.length === choice.choose
        ? options.map(option => `${option.quantity}x ${option.name}`).join(", ")
        : "Objeto";

      return {
        name,
        choose: choice.choose,
        options: options?.map(option => ({ ...option, name: `${option.quantity}x ${option.name}` })) ?? []
      };
    }

    const optionsStr = typeof choice.options === "string" ? choice.options : "";
    const optionsParts = optionsStr.split("-");
    const options = await this.getEquipmentsByCategory(optionsParts[0], optionsParts[1], optionsParts[2]);

    let name = optionsStr.replace(/-/g, " ");
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return {
      name,
      choose: choice.choose,
      options: options?.map(option => ({ ...option, name: `${option.quantity}x ${option.name}` })) ?? []
    };
  }

  private async formatEquipmentItemChoice(
    choice: EquipmentChoiceMongo,
    ruleset?: string
  ): Promise<ResolvedEquipmentChoiceApi> {
    if (choice.alternatives && choice.alternatives.length > 0) {
      const branches = await Promise.all(
        choice.alternatives.map(branch => this.formatEquipmentChoiceBranch(branch, ruleset))
      );

      return {
        choose: choice.choose,
        query_type: "mixed",
        options: branches.filter((b): b is EquipmentChoiceBranchApi => b !== null)
      };
    }

    return this.formatFlatEquipmentChoice(choice, ruleset);
  }

  private async formatEquipmentChoiceBranch(
    branch: EquipmentChoiceBranchMongo,
    ruleset?: string
  ): Promise<EquipmentChoiceBranchApi | null> {
    if (branch.type === "bundle") {
      const leaves = await Promise.all(
        branch.items.map(leaf => this.formatEquipmentChoiceLeaf(leaf, ruleset))
      );
      const items = leaves.filter((leaf): leaf is EquipmentChoiceLeafApi => leaf !== null);
      if (items.length === 0) return null;
      return { type: "bundle", items };
    }

    return this.formatEquipmentChoiceLeaf(branch, ruleset);
  }

  private async formatEquipmentChoiceLeaf(
    leaf: EquipmentChoiceLeafMongo,
    ruleset?: string
  ): Promise<EquipmentChoiceLeafApi | null> {
    if (leaf.type === "item") {
      const [equipment] = await this.hydrateManualChoiceOptions([leaf]);
      if (!equipment) return null;
      return {
        type: "item",
        value: equipment,
        quantity: leaf.quantity ?? 1
      };
    }

    const nested = await this.formatFlatEquipmentChoice(
      {
        choose: leaf.choose,
        options: leaf.options,
        filter: leaf.filter
      },
      ruleset
    );

    return {
      type: "choice",
      value: nested
    };
  }

  private async formatFlatEquipmentChoice(
    choice: {
      choose: number;
      options?: Array<string | CharacterEquipmentMongo>;
      filter?: EquipmentChoiceFilter;
    },
    ruleset?: string
  ): Promise<Extract<ResolvedEquipmentChoiceApi, { query_type: "options" | "filter" | "all" }>> {
    if (choice.options && Array.isArray(choice.options) && choice.options.length > 0) {
      const equipments = await this.hydrateManualChoiceOptions(choice.options);
      return {
        choose: choice.choose,
        options: equipments,
        query_type: "options"
      };
    }

    if (choice.filter) {
      const equipments = await this.getEquipmentsByFilter(choice.filter, ruleset);
      return {
        choose: choice.choose,
        options: equipments,
        query_type: "filter",
        query_filter: choice.filter
      };
    }

    return {
      choose: choice.choose,
      options: [],
      query_type: "options"
    };
  }

  private isCatalogObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  private async hydrateManualChoiceOptions(
    options: Array<string | CharacterEquipmentMongo>
  ): Promise<EquipmentApi[]> {
    const entries = options.map(option =>
      typeof option === "string"
        ? { id: option, override: undefined as CharacterEquipmentMongo | undefined }
        : { id: option.id ?? "", override: option }
    );

    const invalidIds = entries
      .map(entry => entry.id)
      .filter(id => id && !this.isCatalogObjectId(id));

    if (invalidIds.length > 0) {
      console.error(`[EquipmentRepository] Equipamiento ignorado por tener IDs inválidos (índices antiguos): ${invalidIds.join(", ")}`);
    }

    const objectIds = [...new Set(entries.map(entry => entry.id).filter(id => this.isCatalogObjectId(id)))];
    if (objectIds.length === 0) return [];

    const docs = await EquipmentModel.find({
      _id: { $in: objectIds },
      deletedAt: null
    } as any).lean();

    if (!docs.length) return [];

    const overrides = entries.flatMap(entry => entry.override ? [entry.override] : []);
    const lookups = await this.buildLookups([...docs, ...overrides]);
    const byId = new Map(docs.map(doc => [String(doc._id), doc]));
    const hydrated: EquipmentApi[] = [];

    for (const entry of entries) {
      if (!this.isCatalogObjectId(entry.id)) continue;
      const doc = byId.get(entry.id);
      if (!doc) continue;
      const formatted = this.formatEquipmentSync(doc, lookups);
      hydrated.push(
        entry.override ? this.applyChoiceOverride(formatted, doc, entry.override, lookups) : formatted
      );
    }

    return hydrated;
  }

  private applyChoiceOverride(
    base: EquipmentApi,
    catalog: EquipmentMongo,
    override: CharacterEquipmentMongo,
    lookups: EquipmentLookups
  ): EquipmentApi {
    return {
      ...base,
      name: override.name ?? base.name,
      description: override.description
        ? this.formatCharacterDescription(override.description)
        : base.description,
      category: override.category ?? base.category,
      subcategory: override.subcategory ?? base.subcategory,
      weight: override.weight ?? base.weight,
      equipSlot: override.equipSlot !== undefined ? override.equipSlot : base.equipSlot,
      storageTags: override.storageTags ?? base.storageTags,
      materials: override.materials ?? base.materials,
      containerStats: override.containerStats ?? base.containerStats,
      bonuses: override.bonuses ?? base.bonuses,
      content: override.content !== undefined
        ? this.formatContentSync(override.content, lookups, new Set(base.id ? [base.id] : []))
        : base.content,
      proficiencies: override.proficiencies !== undefined
        ? this.resolveProficiencies(override.proficiencies, lookups)
        : base.proficiencies,
      weapon: override.weapon
        ? this.formatWeaponSync(this.mergeWeapon(catalog.weapon, override.weapon), lookups)
        : base.weapon,
      armor: override.armor
        ? this.formatArmorSync(this.mergeArmor(catalog.armor, override.armor), lookups)
        : base.armor,
      isMagic: override.isMagic ?? base.isMagic,
      isBond: override.isBond !== undefined ? override.isBond : base.isBond,
      cost: override.cost
        ? this.formatEquipmentCostSync(override.cost, lookups)
        : base.cost
    };
  }

  private async getEquipmentsByFilter(
    filter: Record<string, string | number | (string | number)[]>,
    ruleset?: string
  ): Promise<EquipmentApi[]> {
    const query: any = { deletedAt: null };
    const getFilterVal = (val: string | number | (string | number)[] | undefined) =>
      val !== undefined ? (Array.isArray(val) ? val[0] : val) : undefined;

    if (ruleset) {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors([ruleset])
        : [ruleset];
      query.ruleset = { $in: expandedRulesets };
    }

    const category = getFilterVal(filter.category);
    const subcategory = getFilterVal(filter.subcategory);
    const weaponCategory = getFilterVal(filter["weapon.category"] ?? filter.weaponCategory);
    const weaponRange = getFilterVal(filter["weapon.range"] ?? filter.weaponRange);

    if (category) query.category = String(category);
    if (subcategory) query.subcategory = String(subcategory);
    if (weaponCategory) query["weapon.category"] = String(weaponCategory);
    if (weaponRange) query["weapon.range"] = String(weaponRange);

    const equipments = await EquipmentModel.find(query)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean();

    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return equipments.map(e => this.formatEquipmentSync(e, lookups));
  }

  private async getEquipmentsByCategory(
    category: string,
    weaponCategory?: string,
    weaponRange?: string
  ): Promise<EquipmentInstanceApi[]> {
    const query: any = { deletedAt: null };

    if (category) query.category = category;
    if (weaponCategory) query["weapon.category"] = weaponCategory;
    if (weaponRange) query["weapon.range"] = weaponRange;

    const equipments = await EquipmentModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean();

    if (!equipments.length) return [];
    const lookups = await this.buildLookups(equipments);
    return equipments.map(item =>
      this.formatCharacterEquipmentSync(
        { id: item._id.toString(), quantity: 1 },
        lookups,
        new Set()
      )
    );
  }
}
