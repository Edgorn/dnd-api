import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import IPropiedadArmaRepository from "../../../../domain/repositories/IPropiedadesArmas";
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
  WeaponBasic
} from "../../../../domain/types/equipment.types";
import { NotFoundError } from "../../../../domain/errors/AppError";
import EquipmentModel from "../schemas/Equipment";
import DamageRepository from "./damage.repository";
import PropiedadArmaRepository from "./propiedadesArmas.repository";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class EquipmentRepository implements IEquipmentRepository {
  private readonly systemRepository?: ISystemRepository;
  private readonly damageRepository: IDamageRepository;
  private readonly propiedadesRepository: IPropiedadArmaRepository;

  constructor(
    systemRepository?: ISystemRepository,
    damageRepository?: IDamageRepository,
    propiedadesRepository?: IPropiedadArmaRepository
  ) {
    this.systemRepository = systemRepository;
    this.damageRepository = damageRepository ?? new DamageRepository();
    this.propiedadesRepository = propiedadesRepository ?? new PropiedadArmaRepository();
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
      storageTags: data.storageTags,
      containerStats: data.containerStats,
      deletedAt: null
    });

    await newEquipment.save();
    return this.formatEquipment(newEquipment);
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

    return this.formatEquipment(updated);
  }

  async getById(id: string): Promise<EquipmentApi | null> {
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { $or: [{ _id: id }, { index: id }] };

    const equipment = await EquipmentModel.findOne(query).lean();
    if (!equipment) return null;
    return this.formatEquipment(equipment);
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
    const formatted = equipments.map(e => this.formatEquipment(e));
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

    const ids = equipments.map(e => e.id || e.index).filter((id): id is string => Boolean(id));
    const objectIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));

    const dbEquipments = await EquipmentModel.find({
      $or: [
        { _id: { $in: objectIds } },
        { index: { $in: ids } }
      ]
    }).lean();

    const formatted = await this.formatCharacterEquipments(equipments, dbEquipments);
    return ordenarPorNombre(formatted);
  }

  async formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined> {
    if (!choices) return undefined;

    return Promise.all(
      choices.map(choiceGroup =>
        Promise.all(choiceGroup.map(choice => this.formatEquipmentChoice(choice)))
      )
    );
  }

  async getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]> {
    const equipments = await EquipmentModel.find({
      category: { $in: types },
      deletedAt: null
    }).lean();

    const basic = equipments.map(e => this.formatEquipmentBasic(e));
    return ordenarPorNombre(basic);
  }

  // Legacy aliases
  async obtenerEquipamientosPersonajePorIndices(equipments: CharacterEquipmentMongo[]): Promise<CharacterEquipmentApi[] | undefined> {
    return this.getCharacterEquipmentsByIds(equipments);
  }

  async formatearOpcionesDeEquipamientos(equipmentsOptions: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined> {
    return this.formatEquipmentChoices(equipmentsOptions);
  }

  async obtenerEquipamientosPorTipos(types: string[]): Promise<EquipmentBasic[]> {
    return this.getEquipmentsByTypes(types);
  }

  // Formatting helpers
  private formatEquipment(equipment: any): EquipmentApi {
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

    return {
      id: idStr,
      index: equipment.index || idStr,
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
      storageTags: equipment.storageTags,
      containerStats: equipment.containerStats,
      isMagic: equipment.isMagic ?? false,
      weapon: equipment.weapon,
      armor: equipment.armor,
      bonuses: equipment.bonuses,
      deletedAt: equipment.deletedAt ?? null
    };
  }

  private formatEquipmentBasic(equipment: any): EquipmentBasic {
    const idStr = equipment._id ? equipment._id.toString() : (equipment.id || equipment.index || "");
    return {
      id: idStr,
      index: equipment.index || idStr,
      name: equipment.name || "",
      category: equipment.category || "",
      subcategory: equipment.subcategory || "",
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

  private async formatCharacterEquipment(
    charEquipment: CharacterEquipmentMongo,
    dbEquipments: any[]
  ): Promise<CharacterEquipmentApi> {
    const matched = dbEquipments.find(
      e => (e._id && e._id.toString() === charEquipment.id) ||
           (e._id && e._id.toString() === charEquipment.index) ||
           (e.index && e.index === charEquipment.index) ||
           (e.index && e.index === charEquipment.id)
    );

    if (matched) {
      const weapon = await this.formatWeapon(matched.weapon);
      const content = await this.getCharacterEquipmentsByIds(matched.content ?? []);
      const formattedEq = this.formatEquipment(matched);

      let customDesc = formattedEq.description;
      if (charEquipment.description) {
        customDesc = Array.isArray(charEquipment.description)
          ? charEquipment.description.join("\n")
          : charEquipment.description;
      }

      return {
        ...formattedEq,
        name: charEquipment.name ?? formattedEq.name,
        description: customDesc,
        quantity: charEquipment.quantity,
        content,
        weapon,
        armor: matched.armor,
        isMagic: charEquipment.isMagic ?? matched.isMagic ?? false,
        isBond: charEquipment.isBond ?? false,
        equipped: charEquipment.equipped ?? false,
        cost: charEquipment.cost ?? formattedEq.cost
      };
    } else {
      let desc = "";
      if (charEquipment.description) {
        desc = Array.isArray(charEquipment.description)
          ? charEquipment.description.join("\n")
          : charEquipment.description;
      }

      const idStr = charEquipment.id || charEquipment.index || "";

      return {
        id: idStr,
        index: charEquipment.index || idStr,
        ruleset: "",
        name: charEquipment.name ?? idStr,
        description: desc,
        quantity: charEquipment.quantity,
        content: [],
        cost: charEquipment.cost ?? { quantity: 0, unit: "" },
        weight: 0,
        category: "",
        subcategory: "",
        isMagic: charEquipment.isMagic ?? false,
        isBond: charEquipment.isBond ?? false,
        equipped: charEquipment.equipped ?? false,
        deletedAt: null
      };
    }
  }

  private async formatWeapon(weapon: WeaponMongo | undefined): Promise<WeaponApi | undefined> {
    if (!weapon) return undefined;

    const damage = await this.formatDamages(weapon.damage ?? []);
    const properties = await this.propiedadesRepository.obtenerPropiedadesPorIndices(weapon.properties ?? []);
    const two_handed_damage = await this.formatDamages(weapon.two_handed_damage ?? []);

    return {
      damage,
      two_handed_damage,
      properties,
      range: weapon.range,
      range_throw: weapon.range_throw,
      competency: weapon.competency
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
              index: option,
              quantity: choice.quantity
            };
          } else {
            return {
              id: option.id || option.index,
              index: option.index || option.id,
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
