import { ChoiceMongo, ChoiceApi } from "../types";
import { CaracteristicaApi, InputCrearCaracteristica, InputModificarCaracteristica, CaracteristicaBonus, CaracteristicaBonusCreate, AtributoPersonajeApi } from "../types/caracteristica.types";

export default interface ICaracteristicaRepository {
  crear(data: InputCrearCaracteristica): Promise<CaracteristicaApi>;
  modificar(data: InputModificarCaracteristica): Promise<CaracteristicaApi>;
  añadirASistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi>;
  eliminarDeSistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi>;
  obtenerPorSistemas(rulesets: string[]): Promise<CaracteristicaApi[]>;
  formatearAbilityBonuses(
    ability_bonuses: CaracteristicaBonusCreate[] | CaracteristicaBonus[], 
    ruleset: string
  ): Promise<CaracteristicaBonus[]>;
  formatearAbilityBonusChoices(
    ability_bonus_choices: ChoiceMongo | undefined, 
    ruleset: string
  ): Promise<ChoiceApi<CaracteristicaBonus> | undefined>;
  formatearAtributos(attributes: {key: string, value: number}[], systems: string[]): Promise<AtributoPersonajeApi[]>;
}
