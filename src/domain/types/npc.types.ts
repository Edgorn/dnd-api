import { Damage } from ".";
import { SpellApi } from "./spell.types";
import { EstadoApi } from "./estados.types";
import { LanguageApi } from "./language.types";

/** Legacy NPC documents. New creatures live in creature.types.ts. */
export interface LegacyCreatureMongo {
  index: string;
  name: string;
  type: string;
  subtype: string;
  alignment: string;
  size: string;
  armor_class: {
    type: string;
    value: number;
  };
  hit_points: number;
  hit_dice: string;
  speed: {
    walk?: number;
    fly?: number;
    climb?: number;
    swim?: number;
    burrow?: number;
    notes?: string;
  };
  abilities: {};
  saving: string;
  skills: string;
  senses: {
    passive_perception: number;
    darkvision: number;
    blindsight: number;
    tremorsense?: number;
    notes?: string;
  };
  languages: LegacyCreatureLanguagesMongo;
  challenge_rating: string;
  xp: number;
  damage_vulnerabilities: [];
  damage_immunities: [];
  damage_resistances: [];
  condition_immunities: [];
  special_abilities: [];
  actions: [];
  actions_aditional: [];
  actions_legendary: [];
  reactions: [];
  spell_slots: { [key: string]: string[] };
}

export interface LegacyCreatureLanguagesMongo {
  understands: string[];
  speaks: string[];
  notes?: string;
}

export interface LegacyCreatureApi {
  id: string;
  name: string;
  type: string;
  subtype: string;
  alignment: string;
  size: string;
  armor_class: {
    type: string;
    value: number;
  };
  hit_points: number;
  hit_dice: string;
  speed: {
    walk?: number;
    fly?: number;
    climb?: number;
    swim?: number;
    notes?: string;
  };
  abilities: {};
  saving: string;
  skills: string;
  senses: {};
  languages: LegacyCreatureLanguagesApi;
  challenge_rating: string;
  xp: number;
  damage_vulnerabilities: Damage[];
  damage_immunities: Damage[];
  damage_resistances: Damage[];
  condition_immunities: EstadoApi[];
  special_abilities: [];
  actions: [];
  actions_aditional: [];
  actions_legendary: [];
  reactions: [];
  spell_slots: { [key: string]: SpellApi[] };
}

export interface LegacyCreatureLanguagesApi {
  understands: LanguageApi[];
  speaks: LanguageApi[];
  notes?: string;
}
