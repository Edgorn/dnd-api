import { ObjectId } from "mongoose"
import { PendingCatalogChoice, PendingDamageChoice, SpellPrivilegeRule, TraitApi, TraitChoices, TraitDataMongo } from "./traits.types"
import { LevelSkillProficiencyValue, SpellChoiceApi } from "./classLevelChoices.types"

export interface CharacterSkillProficiencyOverlay {
  skillId: string;
  value: number;
}
import { SkillApi, SkillSheetApi } from "./skill.types"
import { CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceApi, Damage, Speed } from "."
import { CharacterEquipmentApi, CharacterEquipmentMongo as CatalogEquipmentMongo, WeaponBondOrigin } from "./equipment.types"
import { AttributeRequirements } from "./attributeRequirement.types"
import { SpellApi } from "./spell.types"
import { ConditionApi } from "./condition.types"
import { SpellcastingLevel, SubclassChoiceMenuApi } from "./characterClass.types"
import {
  CharacterOptionSelection,
  CharacterOptionSelectionApi,
  LevelUpOptionPick,
  PendingOptionChoice
} from "./optionGroup.types"
import { CharacterFormApi, CharacterFormMongo, CreatureFormPurpose } from "./creatureForm.types"
import { CharacterAttributeApi, AttributeApi } from "./attribute.types"
import { SpellSlotPool } from "./system.types"
import { Ideal } from "./background.types"
import { CoinApi } from "./coin.types"

export type CharacterEquipmentCustomization = Omit<
  CatalogEquipmentMongo,
  | "instanceId"
  | "equipmentId"
  | "id"
  | "quantity"
  | "equipped"
  | "isFavorite"
  | "isBond"
  | "isMagic"
  | "bondOrigin"
  | "bondStored"
  | "uniqueGranted"
  | "content"
>;

export interface CharacterEquipmentMongo {
  instanceId: string;
  equipmentId: string;
  quantity: number;
  equipped: boolean;
  isMagic: boolean;
  isBond: boolean;
  isFavorite: boolean;
  bondOrigin?: WeaponBondOrigin;
  bondStored?: boolean;
  uniqueGranted?: boolean;
  customization?: CharacterEquipmentCustomization;
}

export type CharacterStartingEquipmentInput = CatalogEquipmentMongo;

export interface CharacterTraitResource {
  traitId: string;
  spent: number;
}

export interface CharacterHitDiceSpent {
  classId: string;
  spent: number;
}

export interface CharacterHitDiceApi {
  classId: string;
  hitDie: number;
  total: number;
  spent: number;
  remaining: number;
  bonusPerDie: number;
}

export interface TypeSpendHitDice {
  id: string;
  classId: string;
  count: number;
  hpGained: number;
  userId: string;
}

export type CharacterHpChangeKind = "damage" | "heal";

export interface TypeApplyCharacterHp {
  id: string;
  amount: number;
  kind: CharacterHpChangeKind;
  userId: string;
}

export interface CharacterSpellSlotSpent {
  classId?: string;
  pool: SpellSlotPool;
  level: number;
  spent: number;
}

export interface CharacterSpellSlotApi {
  classId: string;
  pool: SpellSlotPool;
  level: number;
  total: number;
  spent: number;
  remaining: number;
}

export interface TypeSpendSpellSlot {
  id: string;
  classId: string;
  pool: SpellSlotPool;
  level: number;
  userId: string;
}

export interface CharacterActiveCondition {
  conditionId: string;
  level?: number;
}

export interface CharacterActiveConditionApi {
  conditionId: string;
  name: string;
  level?: number;
}

export interface TypeApplyCharacterCondition {
  id: string;
  conditionId: string;
  level?: number;
  userId: string;
}

export interface TypeUpdateCharacterCondition {
  id: string;
  conditionId: string;
  delta: number;
  userId: string;
}

export interface TypeRemoveCharacterCondition {
  id: string;
  conditionId: string;
  userId: string;
}

export interface GetCharacterOptions {
  applyActiveTraits?: boolean;
}

export interface CharacterCompanion {
  id: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
}

export interface CharacterCompanionInput {
  id?: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
}

export interface UpdateCharacterCompanionsResponse {
  companions: CharacterCompanion[];
}

export interface InputUpdateCharacterFlavor {
  id: string;
  userId: string;
  img?: string;
  appearance?: {
    age?: number;
    height?: number;
    weight?: number;
    eyes?: string;
    hair?: string;
    skin?: string;
  };
  background?: {
    history?: string | string[];
    alignment?: string;
    personality?: string[];
    ideals?: Ideal[];
    bonds?: string[];
    flaws?: string[];
    god?: string;
  };
}

export type UpdateCharacterFlavorResponse = Pick<CharacterApi, "img" | "appearance" | "background">;

export interface TypeCreateCharacter {
  name: string,
  user: string,
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string,
    alignment: string,
    personality: string[],
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: Speed,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  race: string,
  raceId: string,
  campaign: string | null,
  languages: CreatureLanguagesCreate,
  spells: {},
  skills: string[],
  classId: string,
  className: string,
  savingThrows: string[],
  proficiencies: string[],
  subclass: string,
  equipment: CharacterEquipmentMongo[];
  traits: string[],
  traitsData: TraitDataMongo,
  traitChoices?: TraitChoices,
  skillProficiencyPicks?: string[],
  money: {
    unit: string,
    quantity: number
  }[],
  hitDie: number,
  proficiencyBonus: number,
  companions?: CharacterCompanionInput[]
}

export interface TypePrepareSpells {
  id: string;
  classId: string;
  spells: string[];
  userId: string;
}

export interface TypeLearnSpells {
  id: string;
  classId: string;
  spells: string[];
  userId: string;
}

export interface TypeCopySpells {
  id: string;
  classId: string;
  spells: string[];
  traitId?: string;
  userId: string;
}

export interface TypeBindSpellPrivileges {
  id: string;
  traitId: string;
  classId: string;
  selections: string[][];
  userId: string;
}

export type CharacterRestType = string;

export interface TypeUseTrait {
  id: string;
  traitId: string;
  userId: string;
  equipmentId?: string;
}

export interface TypeHitDiceSpend {
  classId: string;
  count: number;
  hpGained: number;
}

export interface TypeRestCharacter {
  id: string;
  type: CharacterRestType;
  userId: string;
  traitChoices?: TraitChoices;
  hitDiceSpends?: TypeHitDiceSpend[];
}

export interface CharacterSpellPrivilegeMongo {
  traitId: string;
  classId: string;
  selections: string[][];
}

export interface CharacterSpellPrivilegeApi {
  traitId: string;
  classId: string;
  rules: SpellPrivilegeRule[];
  selections: SpellApi[][];
}

export interface AbilityScoreIncreaseInput {
  key: string;
  bonus: 1 | 2;
}

export interface TypeLevelUp {
  id: string;
  classId: string;
  hpIncrease: number;
  userId: string;
  spells?: string[][];
  subclass?: string;
  abilityScore?: { increases: AbilityScoreIncreaseInput[] };
  abilityScoreOption?: string;
  traitChoices?: TraitChoices;
  skillPicks?: string[];
  skillProficiencyPicks?: string[];
  proficiencyPicks?: string[][];
  spellReplacements?: { from: string; to: string }[];
  optionPicks?: LevelUpOptionPick[];
}

export interface TypeAddEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  isMagic: boolean;
}

export interface TypeDeleteEquipment {
  id: string;
  instanceId: string;
  quantity?: number;
}

export interface UpdateCharacterEquipmentResponse {
  equipment: CharacterEquipmentApi[];
}

export interface TypeEquipEquipment {
  id: string;
  instanceId: string;
  equipped: boolean;
}

export interface TypeToggleFavoriteEquipment {
  id: string;
  instanceId: string;
  isFavorite: boolean;
}

export interface ToggleFavoriteEquipmentResponse {
  id: string;
  instanceId: string;
  isFavorite: boolean;
}

export interface TypeBindWeaponBond {
  id: string;
  instanceId: string;
  isBond: boolean;
}

export type CharacterMoneyItem = { quantity: number } & CoinApi;

export interface UpdateCharacterMoneyResponse {
  money: CharacterMoneyItem[];
}

export interface CharacterCampaignLink {
  id: string
  userId: string
  campaign: string | null
}

export interface CharacterSubclassApi {
  class: string
  name: string
  id: string
}

export interface CharacterBasic {
  id: string,
  img: string,
  name: string,
  race: string,
  user: string,
  campaign: string | null,
  classes: {
    name: string,
    level: number
  }[],
  subclasses: CharacterSubclassApi[],
  ac: number,
  hpMax: number,
  hpCurrent: number,
  xp: number,
  xpMax: number,
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  speed: Speed,
}

export interface CharacterMongo {
  _id: ObjectId,
  name: string,
  user: string,
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string[],
    alignment: string,
    personality: string[],
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: Speed,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  race: string,
  raceId: string,
  campaign: string | null,
  languages: CreatureLanguagesCreate,
  spells: Record<string, string[]>,
  skills: string[],
  classes: { class: string, name: string, level: number, hitDie: number }[],
  savingThrows: string[],
  subclasses: string[],
  traits: string[],
  traitsData: TraitDataMongo,
  traitChoices?: TraitChoices,
  skillProficiencyOverlays?: CharacterSkillProficiencyOverlay[],
  extraSpells?: Record<string, string[]>,
  money: {
    quantity: number;
    unit: string;
  }[],
  proficiencyBonus: number,
  weaponProficiencies: string[],
  armorProficiencies: string[],
  proficiencies: string[],
  equipment: CharacterEquipmentMongo[];
  hpMax: number,
  hpCurrent: number,
  xp: number,
  optionSelections?: CharacterOptionSelection[],
  forms: CharacterFormMongo[],
  activeFormId?: string | null,
  preparedSpells?: Record<string, string[]>,
  spellPrivileges?: CharacterSpellPrivilegeMongo[],
  companions?: CharacterCompanion[],
  traitResources?: CharacterTraitResource[],
  activeTraitIds?: string[],
  hitDiceSpent?: CharacterHitDiceSpent[]
  spellSlotsSpent?: CharacterSpellSlotSpent[]
  activeConditions?: CharacterActiveCondition[]
}

export interface CharacterApi {
  id: string,
  img: string,
  name: string,
  race: string,
  size: string,
  classes: {
    class: string,
    level: number,
    name: string,
    hitDie: number
  }[],
  subclasses: CharacterSubclassApi[],
  campaign: {
    id: string,
    name: string | null | undefined
  } | null,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string[],
    alignment: string,
    personality: string[],
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string,
  },
  level: number,
  xp: number,
  xpMax: number,
  attributes: CharacterAttributeApi[],
  systems: string[],
  initiativeBonus: number,
  hpMax: number,
  hpCurrent: number,
  ac: number,
  speed: Speed,
  skills: SkillSheetApi[],
  languages: CreatureLanguages,
  proficiencies: ProficiencyApi[],
  traits: TraitApi[],
  traitsData: TraitDataMongo,
  resistances: Damage[],
  conditionalResistances: { name: string, resistances: Damage[] }[],
  conditionImmunities: { name: string, conditions: ConditionApi[] }[],
  conditionalConditionImmunities: { name: string, conditions: ConditionApi[] }[],
  proficiencyBonus: number,
  savingThrows: string[],
  equipment: CharacterEquipmentApi[],
  wearingArmorWithoutProficiency: boolean,
  money: ({
    quantity: number;
  } & CoinApi)[],
  spells: Record<string, {
    list: SpellApi[];
    extra?: SpellApi[];
    prepared?: SpellApi[];
    type?: AttributeApi;
    ritualOnlyExtraIds?: string[];
  }>,
  maxCarryingCapacity: number,
  spellcasting?: SpellcastingLevel[],
  optionSelections?: CharacterOptionSelectionApi[],
  forms?: CharacterFormApi[],
  activeFormId?: string | null,
  spellPrivileges?: CharacterSpellPrivilegeApi[],
  companions: CharacterCompanion[],
  traitResources: CharacterTraitResource[],
  activeTraitIds: string[],
  hitDice: CharacterHitDiceApi[]
  spellSlots: CharacterSpellSlotApi[]
  activeConditions: CharacterActiveConditionApi[]
}

export interface TypeAddCharacterForm {
  id: string;
  userId: string;
  creatureId: string;
  spellId: string;
}

export interface TypeSetCharacterFormActive {
  id: string;
  formId: string;
  userId: string;
}

export interface TypeAddCharacterFormPersist {
  id: string;
  userId: string;
  entry: {
    creatureId: string;
    spellId: string;
    purpose: CreatureFormPurpose;
  };
  choose: number;
  replaceOnRecast: boolean;
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Abilities = Record<AbilityKey, number>;

export interface LevelUpDipData {
  requirements?: AttributeRequirements;
  requirementsMet: boolean;
  proficiencies: ProficiencyApi[];
  skillChoices?: ChoiceApi<SkillApi>;
  proficiencyChoices?: ChoiceApi<ProficiencyApi>[];
}

export interface LevelUpSpellChanges {
  choose: number;
  from: SpellApi[];
  to: ChoiceApi<SpellApi>;
}

export interface PendingSkillProficiencyChoice {
  add: number;
  value: LevelSkillProficiencyValue;
  options: SkillApi[];
}

export interface LevelUpData {
  class: string;
  hitDie: number;
  proficiencyBonus: number;
  traits?: TraitApi[];
  traitsData?: TraitDataMongo;
  spellChoices?: SpellChoiceApi[];
  spellChanges?: LevelUpSpellChanges;
  subclassChoice?: SubclassChoiceMenuApi | null;
  abilityScore: boolean;
  abilityScoreAlternative?: PendingOptionChoice;
  catalogChoices?: PendingCatalogChoice[];
  damageChoices?: PendingDamageChoice[];
  skillProficiencyChoices?: PendingSkillProficiencyChoice[];
  skillChoices?: ChoiceApi<SkillApi>;
  newClass: boolean;
  requirementsMet?: boolean;
  dip?: LevelUpDipData;
  optionChoices?: PendingOptionChoice[];
}
