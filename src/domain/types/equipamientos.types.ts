export * from "./equipment.types";

import {
  EquipmentMongo,
  EquipmentApi,
  CharacterEquipmentMongo,
  CharacterEquipmentApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentBasic,
  WeaponBasic,
  ArmorBasic
} from "./equipment.types";

export type EquipamientoMongo = EquipmentMongo;
export type EquipamientoApi = EquipmentApi;
export type EquipamientoPersonajeMongo = CharacterEquipmentMongo;
export type EquipamientoPersonajeApi = CharacterEquipmentApi;
export type EquipamientoOpcionesMongo = EquipmentOptionsMongo;
export type EquipamientoChoiceApi = EquipmentChoiceApi;
export type EquipamientoBasico = EquipmentBasic;
export type WeaponBasico = WeaponBasic;
export type ArmorBasico = ArmorBasic;