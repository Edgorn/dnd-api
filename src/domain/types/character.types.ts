import { ObjectId } from "mongoose"
import { PendingCatalogChoice, PendingDamageChoice, SpellPrivilegeRule, TraitApi, TraitChoices, TraitDataMongo } from "./traits.types"
import { LevelSkillProficiencyValue, SpellChoiceApi, SpellChoiceRefApi } from "./classLevelChoices.types"

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
import { SpellApi, SpellRef } from "./spell.types"
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
import { CreatureSize } from "./size.types"
import { CreatureApi } from "./creature.types"

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
  /** Companion id, vehicle/container instanceId, or omitted/null for the character. */
  holderId?: string | null;
  /** Companion ids hitched to this vehicle instance. */
  drawnBy?: string[];
  /** Current hit points of a vehicle instance. */
  hpCurrent?: number;
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

export const CHARACTER_VIEWS = ["full", "sheet", "combat"] as const;
export type CharacterView = (typeof CHARACTER_VIEWS)[number];

export const LEVEL_UP_DATA_VIEWS = ["full", "compact"] as const;
export type LevelUpDataView = (typeof LEVEL_UP_DATA_VIEWS)[number];

export interface GetCharacterOptions {
  applyActiveTraits?: boolean;
  view?: CharacterView;
  omitSpellHydration?: boolean;
}

export interface GetLevelUpDataOptions {
  view?: LevelUpDataView;
}

export interface GetCharactersByUserOptions {
  includeCombatSeed?: boolean;
}

export const COMPANION_KINDS = ["narrative", "mount", "animal", "hireling"] as const;
export type CompanionKind = (typeof COMPANION_KINDS)[number];
export const DEFAULT_COMPANION_KIND: CompanionKind = "narrative";

export const COMPANION_SOURCES = ["purchase", "trait", "spell"] as const;
export type CompanionSource = (typeof COMPANION_SOURCES)[number];

export interface CharacterCompanion {
  id: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
  kind?: CompanionKind;
  creatureId?: string;
  source?: CompanionSource;
  hpCurrent?: number;
  conditions?: string[];
}

export interface CharacterCompanionInput {
  id?: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
  kind?: CompanionKind;
  creatureId?: string;
  source?: CompanionSource;
  hpCurrent?: number;
  conditions?: string[];
}

export interface CharacterCompanionApi extends CharacterCompanion {
  creature?: CreatureApi;
  attributes?: CharacterAttributeApi[];
  speed?: Speed;
  size?: CreatureSize | string;
  hpMax?: number;
  carryingCapacity?: number | null;
  load?: number;
  capacity?: number | null;
  ac?: number;
  warnings?: string[];
}

export interface CharacterCompanionRoster {
  companions: CharacterCompanion[];
  systems: string[];
  inventory: CharacterEquipmentMongo[];
}

export interface UpdateCharacterCompanionsResponse {
  companions: CharacterCompanion[];
}

export interface AddCompanionInput {
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
  kind?: CompanionKind;
  creatureId?: string;
  source?: CompanionSource;
}

export interface UpdateCompanionInput {
  name?: string;
  role?: string;
  notes?: string;
  hpCurrent?: number;
  conditions?: string[];
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
  hpCurrent?: number;
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

export interface TypeMoveEquipment {
  id: string;
  instanceId: string;
  userId: string;
  holderId: string | null;
  quantity?: number;
}

export interface TypeSetVehicleDraft {
  id: string;
  instanceId: string;
  userId: string;
  companionIds: string[];
}

export interface TypeToggleFavoriteEquipment {
  id: string;
  instanceId: string;
  isFavorite: boolean;
}

export interface TypeUpdateEquipmentCustomization {
  id: string;
  instanceId: string;
  name?: string | null;
  description?: string | string[] | null;
}

export interface UpdateCharacterEquipmentCustomizationResponse extends UpdateCharacterEquipmentResponse {
  instanceId: string;
  splitFrom?: {
    instanceId: string;
    quantity: number;
  };
}

export interface ToggleFavoriteEquipmentResponse {
  id: string;
  instanceId: string;
  isFavorite: boolean;
  splitFrom?: {
    instanceId: string;
    quantity: number;
  };
}

export interface TypeBindWeaponBond {
  id: string;
  instanceId: string;
  isBond: boolean;
}

export interface CharacterEquipmentStateResponse {
  basic: CharacterBasic;
  equipment: CharacterEquipmentApi[];
  ac: number;
  speed: Speed;
  wearingArmorWithoutProficiency: boolean;
  disadvantageSkillKeys: string[];
  resistances: Damage[];
  conditionImmunities: CharacterApi["conditionImmunities"];
}

export interface CharacterSpellStateResponse {
  spells: Record<string, CharacterSheetSpellGroup>;
  spellsById: Record<string, SpellRef>;
  spellPrivileges?: CharacterSpellPrivilegeApi[];
}

export interface CharacterLevelUpResponse {
  full: CharacterSheetApi;
  basic: CharacterBasic;
}

export type CharacterMoneyItem = { quantity: number } & CoinApi;

export interface UpdateCharacterMoneyResponse {
  money: CharacterMoneyItem[];
}

export interface UpdateCharacterXpResponse {
  xp: number;
  xpMax: number;
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

export type CharacterListItem = Omit<CharacterBasic, "attributes" | "systems" | "speed"> &
  Partial<Pick<CharacterBasic, "attributes" | "systems" | "speed">>;

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
  ac?: number,
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
  size: CreatureSize | string,
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
  maxCarryingCapacity: number | null,
  load?: number,
  spellcasting?: SpellcastingLevel[],
  optionSelections?: CharacterOptionSelectionApi[],
  forms?: CharacterFormApi[],
  activeFormId?: string | null,
  spellPrivileges?: CharacterSpellPrivilegeApi[],
  companions: CharacterCompanionApi[],
  traitResources: CharacterTraitResource[],
  activeTraitIds: string[],
  hitDice: CharacterHitDiceApi[]
  spellSlots: CharacterSpellSlotApi[]
  activeConditions: CharacterActiveConditionApi[]
}

export interface CharacterCombatSpell {
  id: string;
  name: string;
  level: number;
}

export interface CharacterCombatTrait {
  id?: string;
  name: string;
  hidden?: boolean;
  description: string[];
  summary?: string;
}

export interface CharacterCombatAttribute {
  key: string;
  value: number;
  modifier?: number;
}

export interface CharacterCombatSkill {
  name: string;
  key: string;
  value: number;
  modifier: number;
  passive?: number;
  disadvantage?: boolean;
}

export interface CharacterCombatApi {
  id: string;
  name: string;
  race: string;
  size: CreatureSize | string;
  classes: CharacterApi["classes"];
  alignment?: string;
  ac: number;
  hpMax: number;
  hpCurrent: number;
  speed: Speed;
  initiativeBonus: number;
  attributes: CharacterCombatAttribute[];
  savingThrows: string[];
  skills: CharacterCombatSkill[];
  languages: CreatureLanguages;
  resistances: Damage[];
  conditionalResistances: CharacterApi["conditionalResistances"];
  conditionImmunities: CharacterApi["conditionImmunities"];
  conditionalConditionImmunities: CharacterApi["conditionalConditionImmunities"];
  traits: CharacterCombatTrait[];
  traitsData: TraitDataMongo;
  spellcasting?: SpellcastingLevel[];
  spells: Record<string, {
    list: CharacterCombatSpell[];
    extra?: CharacterCombatSpell[];
    prepared?: CharacterCombatSpell[];
  }>;
  activeTraitIds: string[];
}

export interface CharacterSheetSpellGroup {
  list: string[];
  extra?: string[];
  prepared?: string[];
  type?: AttributeApi;
  ritualOnlyExtraIds?: string[];
}

export type CharacterSheetTrait = Omit<TraitApi, "incompatible_traits">;

export interface CharacterSheetApi extends Omit<CharacterApi, "spells" | "traits"> {
  spells: Record<string, CharacterSheetSpellGroup>;
  spellsById: Record<string, SpellRef>;
  traits: CharacterSheetTrait[];
}

export interface CharacterStatePatch {
  basic?: CharacterBasic;
  hpCurrent?: number;
  hpMax?: number;
  hitDice?: CharacterHitDiceApi[];
  spellSlots?: CharacterSpellSlotApi[];
  traitResources?: CharacterTraitResource[];
  activeTraitIds?: string[];
  ac?: number;
  speed?: Speed;
  size?: CreatureSize | string;
  attributes?: CharacterAttributeApi[];
  initiativeBonus?: number;
  resistances?: Damage[];
  conditionImmunities?: CharacterApi["conditionImmunities"];
  activeConditions?: CharacterActiveConditionApi[];
  traits?: CharacterSheetTrait[];
  equipment?: CharacterEquipmentApi[];
  wearingArmorWithoutProficiency?: boolean;
  disadvantageSkillKeys?: string[];
  forms?: CharacterFormApi[];
  activeFormId?: string | null;
}

export type CharacterGetResult = CharacterApi | CharacterSheetApi | CharacterCombatApi;

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

export interface LevelUpDipDataCompact {
  requirements?: AttributeRequirements;
  requirementsMet: boolean;
  proficiencies: Array<{ id: string; name: string }>;
  skillChoices?: ChoiceApi<SkillApi>;
  proficiencyChoices?: ChoiceApi<ProficiencyApi>[];
}

export interface LevelUpSpellChanges {
  choose: number;
  from: SpellApi[];
  to: ChoiceApi<SpellApi>;
}

export interface LevelUpSpellChangesCompact {
  choose: number;
  from: SpellRef[];
  to: ChoiceApi<SpellRef>;
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
  spellChoices?: SpellChoiceApi[] | SpellChoiceRefApi[];
  spellChanges?: LevelUpSpellChanges | LevelUpSpellChangesCompact;
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

export interface LevelUpDataCompact extends Omit<LevelUpData, "spellChoices" | "spellChanges" | "dip"> {
  spellChoices?: SpellChoiceRefApi[];
  spellChanges?: LevelUpSpellChangesCompact;
  dip?: LevelUpDipDataCompact;
}

export type LevelUpDataResult = LevelUpData | LevelUpDataCompact;
