import { describe, it, expect, vi, beforeEach } from "vitest";
import EquipmentRepository from "./equipment.repository";
import EquipmentModel from "../schemas/Equipment";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import IPropertyRepository from "../../../../domain/repositories/IPropertyRepository";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import ICoinRepository from "../../../../domain/repositories/ICoinRepository";
import IArmorTypeRepository from "../../../../domain/repositories/IArmorTypeRepository";
import { CoinApi } from "../../../../domain/types/coin.types";
import { Damage } from "../../../../domain/types/damage.types";
import { Property } from "../../../../domain/types/property.types";
import { ProficiencyApi } from "../../../../domain/types/proficiencies.types";
import { ArmorType } from "../../../../domain/types/armorType.types";

vi.mock("../schemas/Equipment", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn()
  }
}));

const RULESET = "507f1f77bcf86cd799439011";
const COIN_ID = "507f1f77bcf86cd799439021";
const DAMAGE_PIERCE = "507f1f77bcf86cd799439031";
const DAMAGE_SLASH = "507f1f77bcf86cd799439032";
const PROP_FINESSE = "507f1f77bcf86cd799439041";
const PROF_SIMPLE = "507f1f77bcf86cd799439051";
const ARMOR_TYPE_ID = "507f1f77bcf86cd799439061";
const DAGGER_ID = "507f1f77bcf86cd799439071";
const LEATHER_ID = "507f1f77bcf86cd799439072";
const ROPE_ID = "507f1f77bcf86cd799439073";
const RATION_ID = "507f1f77bcf86cd799439074";
const PACK_ID = "507f1f77bcf86cd799439075";

const gold: CoinApi = {
  id: COIN_ID,
  ruleset: RULESET,
  name: "Gold",
  abbreviation: "gp",
  isBase: true,
  multiplier: 1,
  weight: 0.02,
  color: "#ffd700",
  deletedAt: null
};

const piercing: Damage = {
  id: DAMAGE_PIERCE,
  name: "Piercing",
  description: "A puncture",
  color: "#aaaaaa",
  ruleset: RULESET,
  deletedAt: null
};

const slashing: Damage = {
  id: DAMAGE_SLASH,
  name: "Slashing",
  description: "A cut",
  color: "#cccccc",
  ruleset: RULESET,
  deletedAt: null
};

const finesse: Property = {
  id: PROP_FINESSE,
  name: "Finesse",
  description: "Use Dexterity",
  ruleset: RULESET,
  deletedAt: null
};

const simpleWeapons: ProficiencyApi = {
  id: PROF_SIMPLE,
  name: "Simple weapons",
  type: "weapons",
  parentProficiencyId: null,
  ruleset: RULESET,
  deletedAt: null
};

const lightArmor: ArmorType = {
  id: ARMOR_TYPE_ID,
  ruleset: RULESET,
  name: "Light",
  description: "Light armor",
  don: { value: 1, unit: "minute" },
  doff: { value: 1, unit: "minute" },
  deletedAt: null
};

const goldCost = {
  quantity: 2,
  ...gold
};

const emptyCost = {
  quantity: 0,
  id: "",
  ruleset: "",
  name: "",
  abbreviation: "",
  isBase: false,
  multiplier: 1,
  weight: 0,
  color: ""
};

function baseDoc(overrides: Record<string, unknown>) {
  return {
    ruleset: RULESET,
    description: "",
    cost: { quantity: 0, unit: "" },
    weight: 0,
    category: "",
    subcategory: "",
    equipSlot: null,
    deletedAt: null,
    ...overrides
  };
}

const dagger = baseDoc({
  _id: DAGGER_ID,
  name: "Dagger",
  description: "A small blade",
  cost: { quantity: 2, unit: COIN_ID },
  weight: 1,
  category: "Weapon",
  subcategory: "Simple",
  proficiencies: [PROF_SIMPLE],
  weapon: {
    category: "Simple Melee",
    damage: [
      { dice: "1d4", type: DAMAGE_PIERCE },
      { dice: "1d4", type: DAMAGE_SLASH }
    ],
    two_handed_damage: [{ dice: "1d6", type: DAMAGE_SLASH }],
    properties: [PROP_FINESSE],
    range: "Melee"
  }
});

const leather = baseDoc({
  _id: LEATHER_ID,
  name: "Leather Armor",
  category: "Armor",
  subcategory: "Light",
  equipSlot: "armor",
  armor: {
    typeId: ARMOR_TYPE_ID,
    class: { base: 11, attributeBonus: { key: "dex", max: 2 } }
  }
});

const rope = baseDoc({
  _id: ROPE_ID,
  name: "Rope",
  category: "Adventuring Gear",
  subcategory: "Standard"
});

const ration = baseDoc({
  _id: RATION_ID,
  name: "Ration",
  category: "Adventuring Gear",
  subcategory: "Food"
});

const pack = baseDoc({
  _id: PACK_ID,
  name: "Explorer Pack",
  category: "Adventuring Gear",
  subcategory: "Pack",
  content: [
    { id: RATION_ID, quantity: 5 },
    { id: ROPE_ID, quantity: 1 }
  ]
});

function mockFindLean(docs: unknown[]) {
  vi.mocked(EquipmentModel.find).mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(docs)
  } as never);
}

function mockFindOneLean(doc: unknown) {
  vi.mocked(EquipmentModel.findOne).mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(doc)
  } as never);
}

function stubById<T extends { id: string }>(items: T[]) {
  return vi.fn(async (ids: string[] = []) => items.filter(item => item.id && ids.includes(item.id)));
}

describe("EquipmentRepository lookup batching", () => {
  let systemRepository: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };
  let damageRepository: { getByIds: ReturnType<typeof vi.fn> };
  let propertyRepository: { getByIds: ReturnType<typeof vi.fn> };
  let proficiencyRepository: { getProficienciesByIndices: ReturnType<typeof vi.fn> };
  let coinRepository: { getCoinsByIds: ReturnType<typeof vi.fn> };
  let armorTypeRepository: { getByIds: ReturnType<typeof vi.fn> };
  let repository: EquipmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([RULESET])
    };
    damageRepository = { getByIds: stubById([piercing, slashing]) };
    propertyRepository = { getByIds: stubById([finesse]) };
    proficiencyRepository = { getProficienciesByIndices: stubById([simpleWeapons]) };
    coinRepository = { getCoinsByIds: stubById([gold]) };
    armorTypeRepository = { getByIds: stubById([lightArmor]) };

    repository = new EquipmentRepository(
      systemRepository as unknown as ISystemRepository,
      damageRepository as unknown as IDamageRepository,
      propertyRepository as unknown as IPropertyRepository,
      proficiencyRepository as unknown as IProficiencyRepository,
      coinRepository as unknown as ICoinRepository,
      armorTypeRepository as unknown as IArmorTypeRepository
    );
  });

  describe("output equivalence", () => {
    it("formats a weapon, armor, pack and plain item from a single catalog lookup", async () => {
      mockFindLean([dagger, leather, rope, ration, pack]);

      const result = await repository.getBySystems([RULESET]);
      const byId = Object.fromEntries(result.map(item => [item.id, item]));

      expect(byId[DAGGER_ID]).toEqual({
        id: DAGGER_ID,
        ruleset: RULESET,
        name: "Dagger",
        description: "A small blade",
        cost: goldCost,
        weight: 1,
        category: "Weapon",
        subcategory: "Simple",
        equipSlot: null,
        storageTags: undefined,
        containerStats: undefined,
        isMagic: false,
        proficiencies: [simpleWeapons],
        content: [],
        weapon: {
          category: "Simple Melee",
          damage: [
            { dice: "1d4", name: "Piercing", desc: "A puncture" },
            { dice: "1d4", name: "Slashing", desc: "A cut" }
          ],
          two_handed_damage: [{ dice: "1d6", name: "Slashing", desc: "A cut" }],
          properties: [finesse],
          range: "Melee",
          range_throw: undefined
        },
        armor: undefined,
        bonuses: undefined,
        deletedAt: null
      });

      expect(byId[LEATHER_ID]).toEqual({
        id: LEATHER_ID,
        ruleset: RULESET,
        name: "Leather Armor",
        description: "",
        cost: emptyCost,
        weight: 0,
        category: "Armor",
        subcategory: "Light",
        equipSlot: "armor",
        storageTags: undefined,
        containerStats: undefined,
        isMagic: false,
        proficiencies: [],
        content: [],
        weapon: undefined,
        armor: {
          type: lightArmor,
          class: { base: 11, attributeBonus: { key: "dex", max: 2 } },
          attributeMinimum: undefined,
          disadvantageSkillKeys: undefined
        },
        bonuses: undefined,
        deletedAt: null
      });

      expect(byId[ROPE_ID]).toEqual({
        id: ROPE_ID,
        ruleset: RULESET,
        name: "Rope",
        description: "",
        cost: emptyCost,
        weight: 0,
        category: "Adventuring Gear",
        subcategory: "Standard",
        equipSlot: null,
        storageTags: undefined,
        containerStats: undefined,
        isMagic: false,
        proficiencies: [],
        content: [],
        weapon: undefined,
        armor: undefined,
        bonuses: undefined,
        deletedAt: null
      });

      expect(byId[PACK_ID]?.content?.map(item => ({ id: item.id, quantity: item.quantity, name: item.name }))).toEqual([
        { id: RATION_ID, quantity: 5, name: "Ration" },
        { id: ROPE_ID, quantity: 1, name: "Rope" }
      ]);
      expect(byId[PACK_ID]?.content?.[0]).toMatchObject({
        isFavorite: false,
        equipped: false,
        isBond: false
      });
    });
  });

  describe("query count", () => {
    it("loads a catalog pack and its content with one batch per reference collection", async () => {
      mockFindLean([pack]);
      mockFindLean([ration, rope]);

      await repository.getBySystems([RULESET]);

      expect(EquipmentModel.find).toHaveBeenCalledTimes(2);
      expect(damageRepository.getByIds).toHaveBeenCalledTimes(1);
      expect(damageRepository.getByIds).toHaveBeenCalledWith(expect.any(Array), true);
      expect(coinRepository.getCoinsByIds).toHaveBeenCalledTimes(1);
      expect(propertyRepository.getByIds).toHaveBeenCalledTimes(1);
      expect(proficiencyRepository.getProficienciesByIndices).toHaveBeenCalledTimes(1);
      expect(armorTypeRepository.getByIds).toHaveBeenCalledTimes(1);
    });

    it("loads character equipment instances with a single nested find", async () => {
      mockFindLean([dagger, leather]);

      await repository.getCharacterEquipmentsByIds([
        { id: DAGGER_ID, quantity: 1 },
        { id: LEATHER_ID, quantity: 1, isFavorite: true }
      ]);

      expect(EquipmentModel.find).toHaveBeenCalledTimes(1);
      expect(damageRepository.getByIds).toHaveBeenCalledTimes(1);
      expect(coinRepository.getCoinsByIds).toHaveBeenCalledTimes(1);
      expect(armorTypeRepository.getByIds).toHaveBeenCalledTimes(1);
    });
  });

  describe("cyclic content", () => {
    it("stops expanding a container that references itself", async () => {
      const cyclicPack = baseDoc({
        _id: PACK_ID,
        name: "Cursed Bag",
        content: [{ id: PACK_ID, quantity: 1 }]
      });
      mockFindOneLean(cyclicPack);

      const result = await repository.getById(PACK_ID);

      expect(result).not.toBeNull();
      expect(result?.content).toHaveLength(1);
      expect(result?.content?.[0].id).toBe(PACK_ID);
      expect(result?.content?.[0].content).toEqual([]);
      expect(EquipmentModel.find).not.toHaveBeenCalled();
    });
  });
});
