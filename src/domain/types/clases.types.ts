import { ChoiceApi, ChoiceMongo } from "."
import { CompetenciaApi } from "./competencias.types"
import { ChoiceSpell, ConjuroApi } from "./conjuros.types"
import { DoteApi } from "./dotes.types"
import { EquipamientoChoiceApi, EquipamientoOpcionesMongo, EquipamientoPersonajeApi, EquipamientoPersonajeMongo } from "./equipamientos.types"
import { SkillApi } from "./skill.types"
import { LanguageApi } from "./language.types"
import { InvocacionApi } from "./invocaciones.types"
import { TraitApi, TraitDataMongo } from "./traits.types"

export interface ClaseMongo {
  index: string,
  name: string,
  description: string[],
  img: string,
  hit_die: number,
  proficiencies: string[],
  proficiencies_choices?: ChoiceMongo[],
  skill_choices?: ChoiceMongo,
  saving_throws: string[],
  equipment: EquipamientoPersonajeMongo[],
  equipment_choices?: EquipamientoOpcionesMongo[][],
  levels: ClaseLevelMongo[],
  spellcasting: string
}

export interface ClaseLevelMongo {
  level: number,
  proficiencies: string[]
  traits: string[],
  traits_options?: {
    name: string,
    options: string[]
  },
  traits_data: TraitDataMongo,
  spell_choices?: ChoiceSpell[],
  mixed_spell_choices?: {
    number: number,
    options: ChoiceSpell[]
  },
  spell_changes?: {
    number: number,
    options: ChoiceSpell[]
  },
  spell_group: {
    level: number,
    class: string
  },
  subclasses_options: SubclasesOptionsMongo,
  subclasses: SubclasesMongo,
  ability_score: boolean,
  spellcasting?: Spellcasting,
  double_skills?: number,
  skill_choices?: ChoiceMongo,
  invocations?: number,
  invocations_change?: number
}

export interface Spellcasting {
  [key: string]: number | undefined;
}

export interface SpellcastingLevel {
  class: string,
  ability: string,
  spellcasting?: Spellcasting
}

export interface SubclasesOptionsMongo {
  name: String,
  desc: string,
  options: SubclasesOptionsMongoOption[]
}

export interface SubclasesOptionsMongoOption {
  index: string,
  name: string,
  img: string
}

export interface SubclasesMongo {
  [key: string]: SubclaseMongo
}

export interface SubclaseMongo {
  traits: string[],
  traits_data: TraitDataMongo,
  traits_options?: {
    name: string,
    options: string[]
  },
  mixed_spell_choices?: {
    number: number,
    options: ChoiceSpell[]
  },
  skill_choices?: ChoiceMongo,
  double_skill_choices?: ChoiceMongo,
  proficiencies?: string[],
  spells?: string[],
  spell_choices?: ChoiceSpell[],
  language_choices?: ChoiceMongo
}

export interface ClaseApi {
  index: string,
  name: string,
  description: string[],
  img: string,
  hit_die: number,
  proficiencies: CompetenciaApi[],
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  skill_choices?: ChoiceApi<SkillApi>,
  spells?: ConjuroApi[],
  spell_choices?: ChoiceApi<ConjuroApi>[],
  traits: TraitApi[],
  traits_data: TraitDataMongo,
  saving_throws: {
    index: string,
    name: string
  }[],
  equipment?: EquipamientoPersonajeApi[],
  equipment_choices?: EquipamientoChoiceApi[][],
  prof_bonus: number,
  subclasesData?: SubclasesOptionsApi
}

export interface SubclasesOptionsApi {
  name: String,
  desc: string,
  options: SubclaseOptionApi[]
}

export interface SubclaseOptionApi extends SubclaseApi {
  index: string,
  name: string,
  img: string
}

export interface SubclaseApi {
  traits: TraitApi[],
  traits_options?: {
    name: string,
    options: TraitApi[]
  },
  mixed_spell_choices?: ChoiceApi<ConjuroApi>[][],
  skill_choices?: ChoiceApi<SkillApi>,
  double_skill_choices?: ChoiceApi<SkillApi>,
  language_choices?: ChoiceApi<LanguageApi>,
  proficiencies?: CompetenciaApi[],
  spells?: ConjuroApi[],
  spell_choices?: ChoiceApi<ConjuroApi>[]
}

export interface ClaseLevelUp {
  hit_die: number,
  traits: TraitApi[],
  traits_data: TraitDataMongo,
  traits_options?: {
    name: string,
    options: TraitApi[]
  },
  ability_score: boolean,
  dotes: ChoiceApi<DoteApi> | undefined,
  subclasesData: SubclasesOptionsApi | null,
  double_skills?: number,
  spells?: ConjuroApi[],
  spell_choices?: ChoiceApi<ConjuroApi>[],
  mixed_spell_choices?: ChoiceApi<ConjuroApi>[][],
  spell_changes?: ChoiceApi<ConjuroApi>[][],
  skill_choices?: ChoiceApi<SkillApi>,
  invocations_choices?: ChoiceApi<InvocacionApi>,
  invocations_change?: ChoiceApi<InvocacionApi>
}