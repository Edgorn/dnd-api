import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import IPropertyRepository from "../../../../domain/repositories/IPropertyRepository";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import {
  EquipmentApi,
  InputCreateEquipment,
  InputUpdateEquipment,
  CharacterEquipmentMongo,
  CharacterEquipmentApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentBasic,
  WeaponMongo,
  WeaponApi,
  WeaponDamageMongo,
  WeaponDamageApi,
  WeaponBasic,
  BODY_EQUIP_SLOTS
} from "../../../../domain/types/equipment.types";
import { ChoiceApi, ChoiceMongo } from "../../../../domain/types";
import { NotFoundError } from "../../../../domain/errors/AppError";
import EquipmentModel from "../schemas/Equipment";
import DamageRepository from "./damage.repository";
import PropertyRepository from "./property.repository";
import ProficiencyRepository from "./proficiency.repository";
import { ordenarPorNombre, ordenarPorFavoritoYNombre } from "../../../../utils/formatters";

export default class EquipmentRepository implements IEquipmentRepository {
  private readonly systemRepository?: ISystemRepository;
  private readonly damageRepository: IDamageRepository;
  private readonly propertyRepository: IPropertyRepository;
  private readonly proficiencyRepository: IProficiencyRepository;

  constructor(
    systemRepository?: ISystemRepository,
    damageRepository?: IDamageRepository,
    propertyRepository?: IPropertyRepository,
    proficiencyRepository?: IProficiencyRepository
  ) {
    this.systemRepository = systemRepository;
    this.damageRepository = damageRepository ?? new DamageRepository();
    this.propertyRepository = propertyRepository ?? new PropertyRepository();
    this.proficiencyRepository = proficiencyRepository ?? new ProficiencyRepository(systemRepository as any);
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
      containerStats: data.containerStats,
      proficiencies: data.proficiencies,
      weapon: data.weapon,
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
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { $or: [{ _id: id }, { index: id }] };

    const equipment = await EquipmentModel.findOne(query).lean();
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
    const formatted = await Promise.all(equipments.map(e => this.formatEquipment(e)));
    return ordenarPorNombre(formatted);
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

  async getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<CharacterEquipmentApi[] | undefined> {
    if (!equipments) return undefined;
    if (!equipments.length) return [];

    const ids = equipments.map(e => e.id || (e as any).index).filter((id): id is string => Boolean(id));
    const objectIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));

    const dbEquipments = await EquipmentModel.find({
      $or: [
        { _id: { $in: objectIds } },
        { index: { $in: ids } }
      ]
    }).lean();

    const formatted = await this.formatCharacterEquipments(equipments, dbEquipments);
    return ordenarPorFavoritoYNombre(formatted);
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
    choices: ChoiceMongo[] | undefined,
    ruleset?: string
  ): Promise<ChoiceApi<EquipmentApi>[] | undefined> {
    if (!choices) return undefined;
    return Promise.all(choices.map(choice => this.formatEquipmentItemChoice(choice, ruleset)));
  }

  async getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]> {
    const equipments = await EquipmentModel.find({
      category: { $in: types },
      deletedAt: null
    }).lean();

    const basic = equipments.map(e => this.formatEquipmentBasic(e));
    return ordenarPorNombre(basic);
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
    const basic = equipments.map(e => this.formatEquipmentBasic(e));
    return ordenarPorNombre(basic);
  }

  async getArmor(rulesets: string[] = []): Promise<EquipmentBasic[]> {
    const query: Record<string, unknown> = {
      equipSlot: { $in: [...BODY_EQUIP_SLOTS] },
      deletedAt: null
    };

    if (rulesets.length > 0) {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors(rulesets)
        : rulesets;
      query.ruleset = { $in: expandedRulesets };
    }

    const equipments = await EquipmentModel.find(query).lean();
    const basic = equipments.map(e => this.formatEquipmentBasic(e));
    return ordenarPorNombre(basic);
  }

  // Formatting helpers
  private async formatEquipment(equipment: any): Promise<EquipmentApi> {
    let description = "";
    if (Array.isArray(equipment.description)) {
      description = equipment.description.join("\n");
    } else if (typeof equipment.description === "string") {
      description = equipment.description;
    }

    let costUnit = "";
    if (equipment.cost?.unit) {
      if (typeof equipment.cost.unit === "object" && equipment.cost.unit !== null && equipment.cost.unit._id) {
        costUnit = equipment.cost.unit._id.toString();
      } else {
        costUnit = equipment.cost.unit.toString();
      }
    }

    const idStr = equipment._id ? equipment._id.toString() : (equipment.id || equipment.index || "");
    const weapon = await this.formatWeapon(equipment.weapon);
    const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(equipment.proficiencies ?? []);

    return {
      id: idStr,
      ruleset: equipment.ruleset || "",
      name: equipment.name || "",
      description,
      cost: {
        quantity: equipment.cost?.quantity ?? 0,
        unit: costUnit
      },
      weight: equipment.weight ?? 0,
      category: equipment.category || "",
      subcategory: equipment.subcategory || "",
      equipSlot: equipment.equipSlot ?? null,
      storageTags: equipment.storageTags,
      containerStats: equipment.containerStats,
      isMagic: equipment.isMagic ?? false,
      proficiencies,
      weapon,
      armor: equipment.armor,
      bonuses: equipment.bonuses,
      deletedAt: equipment.deletedAt ?? null
    };
  }

  private formatEquipmentBasic(equipment: any): EquipmentBasic {
    const idStr = equipment._id ? equipment._id.toString() : (equipment.id || equipment.index || "");
    return {
      id: idStr,
      name: equipment.name || "",
      category: equipment.category || "",
      subcategory: equipment.subcategory || "",
      equipSlot: equipment.equipSlot ?? null,
      weapon: this.formatWeaponBasic(equipment.weapon),
      armor: equipment.armor
    };
  }

  private formatWeaponBasic(weapon?: WeaponMongo): WeaponBasic | undefined {
    if (!weapon) return undefined;
    return {
      category: weapon.category,
      range: weapon.range
    };
  }

  private async formatCharacterEquipments(
    characterEquipments: CharacterEquipmentMongo[],
    dbEquipments: any[]
  ): Promise<CharacterEquipmentApi[]> {
    return Promise.all(
      characterEquipments.map(charEq => this.formatCharacterEquipment(charEq, dbEquipments))
    );
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

  private formatCharacterDescription(description?: string | string[]): string {
    if (!description) return "";
    return Array.isArray(description) ? description.join("\n") : description;
  }

  private async formatCharacterEquipment(
    charEquipment: CharacterEquipmentMongo,
    dbEquipments: any[]
  ): Promise<CharacterEquipmentApi> {
    const quantity = charEquipment.quantity ?? 1;
    const matched = dbEquipments.find(
      e => (e._id && e._id.toString() === charEquipment.id) ||
           (e._id && e._id.toString() === (charEquipment as any).index) ||
           (e.index && e.index === (charEquipment as any).index) ||
           (e.index && e.index === charEquipment.id)
    );

    if (matched) {
      const mergedWeapon = this.mergeWeapon(matched.weapon, charEquipment.weapon);
      const weapon = await this.formatWeapon(mergedWeapon);
      const proficienciesIds = charEquipment.proficiencies ?? matched.proficiencies ?? [];
      const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(proficienciesIds);
      const contentSource = charEquipment.content ?? matched.content ?? [];
      const content = await this.getCharacterEquipmentsByIds(contentSource);
      const formattedEq = await this.formatEquipment(matched);
      const customDesc = charEquipment.description
        ? this.formatCharacterDescription(charEquipment.description)
        : formattedEq.description;

      return {
        ...formattedEq,
        name: charEquipment.name ?? formattedEq.name,
        description: customDesc,
        quantity,
        category: charEquipment.category ?? formattedEq.category,
        subcategory: charEquipment.subcategory ?? formattedEq.subcategory,
        weight: charEquipment.weight ?? formattedEq.weight,
        equipSlot: charEquipment.equipSlot !== undefined ? charEquipment.equipSlot : formattedEq.equipSlot,
        storageTags: charEquipment.storageTags ?? formattedEq.storageTags,
        containerStats: charEquipment.containerStats ?? formattedEq.containerStats,
        bonuses: charEquipment.bonuses ?? formattedEq.bonuses,
        content,
        proficiencies,
        weapon,
        armor: charEquipment.armor ?? matched.armor,
        isMagic: charEquipment.isMagic ?? matched.isMagic ?? false,
        isBond: charEquipment.isBond ?? false,
        isFavorite: charEquipment.isFavorite ?? false,
        equipped: charEquipment.equipped ?? false,
        cost: charEquipment.cost ?? formattedEq.cost
      };
    }

    const idStr = charEquipment.id || (charEquipment as any).index || "";
    const weapon = await this.formatWeapon(charEquipment.weapon);
    const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(charEquipment.proficiencies ?? []);
    const content = await this.getCharacterEquipmentsByIds(charEquipment.content ?? []);

    return {
      id: idStr,
      ruleset: "",
      name: charEquipment.name ?? idStr,
      description: this.formatCharacterDescription(charEquipment.description),
      quantity,
      content: content ?? [],
      cost: charEquipment.cost ?? { quantity: 0, unit: "" },
      weight: charEquipment.weight ?? 0,
      category: charEquipment.category ?? "",
      subcategory: charEquipment.subcategory ?? "",
      equipSlot: charEquipment.equipSlot ?? null,
      storageTags: charEquipment.storageTags ?? undefined,
      containerStats: charEquipment.containerStats ?? undefined,
      bonuses: charEquipment.bonuses,
      proficiencies,
      weapon,
      armor: charEquipment.armor,
      isMagic: charEquipment.isMagic ?? false,
      isBond: charEquipment.isBond ?? false,
      isFavorite: charEquipment.isFavorite ?? false,
      equipped: charEquipment.equipped ?? false,
      deletedAt: null
    };
  }

  private async formatWeapon(weapon: WeaponMongo | undefined): Promise<WeaponApi | undefined> {
    if (!weapon) return undefined;

    const damage = await this.formatDamages(weapon.damage ?? []);
    const properties = await this.propertyRepository.getByIds(weapon.properties ?? []);
    const two_handed_damage = await this.formatDamages(weapon.two_handed_damage ?? []);

    return {
      category: weapon.category,
      damage,
      two_handed_damage,
      properties,
      range: weapon.range,
      range_throw: weapon.range_throw
    };
  }

  private async formatDamages(damages: WeaponDamageMongo[]): Promise<WeaponDamageApi[]> {
    return Promise.all(damages.map(damage => this.formatDamage(damage)));
  }

  private async formatDamage(damage: WeaponDamageMongo): Promise<WeaponDamageApi> {
    const foundDamage = await this.damageRepository.getById(damage?.type ?? "");

    return {
      dice: damage.dice,
      name: foundDamage?.name ?? "",
      desc: foundDamage?.description ?? ""
    };
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
              id: option.id || (option as any).index,
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

  private async formatEquipmentItemChoice(choice: ChoiceMongo, ruleset?: string): Promise<ChoiceApi<EquipmentApi>> {
    if (choice.options && Array.isArray(choice.options) && choice.options.length > 0) {
      const equipments = await this.getEquipmentsByIds(choice.options);
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
      options: []
    };
  }

  private async getEquipmentsByIds(ids: string[]): Promise<EquipmentApi[]> {
    if (!ids.length) return [];

    const objectIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
    const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));

    if (invalidIds.length > 0) {
      console.error(`[EquipmentRepository] Equipamiento ignorado por tener IDs inválidos (índices antiguos): ${invalidIds.join(", ")}`);
    }

    if (objectIds.length === 0) return [];

    const equipments = await EquipmentModel.find({
      _id: { $in: objectIds },
      deletedAt: null
    }).lean();

    const formatted = await Promise.all(equipments.map(e => this.formatEquipment(e)));
    return ordenarPorNombre(formatted);
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

    const formatted = await Promise.all(equipments.map(e => this.formatEquipment(e)));
    return ordenarPorNombre(formatted);
  }

  private async getEquipmentsByCategory(
    category: string,
    weaponCategory?: string,
    weaponRange?: string
  ): Promise<CharacterEquipmentApi[]> {
    const query: any = { deletedAt: null };

    if (category) query.category = category;
    if (weaponCategory) query["weapon.category"] = weaponCategory;
    if (weaponRange) query["weapon.range"] = weaponRange;

    const equipments = await EquipmentModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean();

    return this.formatCharacterEquipments(
      equipments.map(e => ({ id: e._id.toString(), index: e._id.toString(), quantity: 1 })),
      equipments
    );
  }
}
