import { ChoiceApi, ChoiceMongo } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceSpell, SpellApi } from "./spell.types"
import { DoteApi } from "./dotes.types"
import { EquipmentInstanceApi, CharacterEquipmentMongo, EquipmentChoiceMongo, ResolvedEquipmentChoiceApi } from "./equipment.types"
import { SkillApi } from "./skill.types"
import { LanguageApi } from "./language.types"
import { InvocacionApi } from "./invocaciones.types"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { AttributeApi } from "./attribute.types"

export interface InputCreateCharacterClass {
  ruleset: string;
  name: string;
  description?: string[];
  img?: string;
  hit_die?: number;
  proficiencies?: string[];
  saving_throws?: string[];
  skill_choices?: ChoiceMongo | null;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
}

export interface InputUpdateCharacterClass {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  img?: string;
  hit_die?: number;
  proficiencies?: string[];
  saving_throws?: string[];
  skill_choices?: ChoiceMongo | null;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
}

export interface CharacterClassMongo {
  _id?: any;
  ruleset?: string;
  deletedAt?: Date | null;
  name: string;
  description: string[];
  img: string;
  hit_die: number;
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  skill_choices?: ChoiceMongo;
  saving_throws: string[];
  equipment: CharacterEquipmentMongo[];
  equipment_choices?: EquipmentChoiceMongo[];
  levels: CharacterClassLevelMongo[];
  spellcasting?: string;
}

export interface CharacterClassLevelMongo {
  level: number;
  proficiencies: string[];
  traits: string[];
  traits_options?: {
    name: string;
    options: string[];
  };
  traits_data: TraitDataMongo;
  spell_choices?: ChoiceSpell[];
  mixed_spell_choices?: {
    number: number;
    options: ChoiceSpell[];
  };
  spell_changes?: {
    number: number;
    options: ChoiceSpell[];
  };
  spell_group?: {
    level: number;
    class: string;
  };
  subclasses_options?: SubclassesOptionsMongo;
  subclasses?: SubclassesMongo;
  ability_score?: boolean;
  spellcasting?: Spellcasting;
  double_skills?: number;
  skill_choices?: ChoiceMongo;
  invocations?: number;
  invocations_change?: number;
}

export interface Spellcasting {
  [key: string]: number | undefined;
}

export interface SpellcastingLevel {
  class: string;
  ability: string;
  spellcasting?: Spellcasting;
}

export interface SubclassesOptionsMongo {
  name: string;
  desc: string;
  options: SubclassesOptionsMongoOption[];
}

export interface SubclassesOptionsMongoOption {
  id: string;
  name: string;
  img: string;
}

export interface SubclassesMongo {
  [key: string]: SubclassMongo;
}

export interface SubclassMongo {
  traits: string[];
  traits_data: TraitDataMongo;
  traits_options?: {
    name: string;
    options: string[];
  };
  mixed_spell_choices?: {
    number: number;
    options: ChoiceSpell[];
  };
  skill_choices?: ChoiceMongo;
  double_skill_choices?: ChoiceMongo;
  proficiencies?: string[];
  spells?: string[];
  spell_choices?: ChoiceSpell[];
  language_choices?: ChoiceMongo;
}

export interface CharacterClassApi {
  id: string;
  ruleset: string;
  name: string;
  description: string[];
  img: string;
  hit_die: number;
  proficiencies: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  skill_choices?: ChoiceApi<SkillApi>;
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  saving_throws: AttributeApi[];
  equipment?: EquipmentInstanceApi[];
  equipment_choices?: ResolvedEquipmentChoiceApi[];
  prof_bonus: number;
  spellcasting?: string;
  subclasesData?: SubclassesOptionsApi;
  deletedAt?: Date | null;
}

export interface SubclassesOptionsApi {
  name: string;
  desc: string;
  options: SubclassOptionApi[];
}

export interface SubclassOptionApi extends SubclassApi {
  id: string;
  name: string;
  img: string;
}

export interface SubclassApi {
  traits: TraitApi[];
  traits_options?: {
    name: string;
    options: TraitApi[];
  };
  mixed_spell_choices?: ChoiceApi<SpellApi>[][];
  skill_choices?: ChoiceApi<SkillApi>;
  double_skill_choices?: ChoiceApi<SkillApi>;
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies?: ProficiencyApi[];
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
}

export interface ClaseLevelUp {
  hit_die: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  traits_options?: {
    name: string;
    options: TraitApi[];
  };
  ability_score?: boolean;
  dotes?: ChoiceApi<DoteApi>;
  subclasesData?: SubclassesOptionsApi | null;
  double_skills?: number;
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
  mixed_spell_choices?: ChoiceApi<SpellApi>[][];
  spell_changes?: ChoiceApi<SpellApi>[][];
  skill_choices?: ChoiceApi<SkillApi>;
  invocations_choices?: ChoiceApi<InvocacionApi>;
  invocations_change?: ChoiceApi<InvocacionApi>;
}

// Aliases for legacy compatibility
export type ClaseMongo = CharacterClassMongo;
export type ClaseApi = CharacterClassApi;
export type SubclaseApi = SubclassApi;
export type SubclaseOptionApi = SubclassOptionApi;
export type SubclasesOptionsApi = SubclassesOptionsApi;
export type SubclaseMongo = SubclassMongo;
export type SubclasesMongo = SubclassesMongo;
export type SubclasesOptionsMongo = SubclassesOptionsMongo;
export type SubclasesOptionsMongoOption = SubclassesOptionsMongoOption;
