import ICaracteristicaRepository from "../../../../domain/repositories/ICaracteristicaRepository";
import { CaracteristicaApi, CaracteristicaMongo, InputCrearCaracteristica, InputModificarCaracteristica, CaracteristicaBonus, CaracteristicaBonusCreate } from "../../../../domain/types/caracteristica.types";
import { ChoiceMongo, ChoiceApi } from "../../../../domain/types";
import CaracteristicaSchema from "../schemas/Caracteristica";

export default class CaracteristicaRepository implements ICaracteristicaRepository {
  async crear(data: InputCrearCaracteristica): Promise<CaracteristicaApi> {
    const nuevaCaracteristica = new CaracteristicaSchema({
      ruleset: [data.ruleset], // Al crear se pasa ruleset como string y se almacena en el array
      name: data.name,
      description: data.description,
      key: data.key,
      abbreviation: data.abbreviation
    });

    await nuevaCaracteristica.save();
    return this.formatearCaracteristica(nuevaCaracteristica);
  }

  async modificar(data: InputModificarCaracteristica): Promise<CaracteristicaApi> {
    const { id, ...updateFields } = data;
    const caracteristicaModificada = await CaracteristicaSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!caracteristicaModificada) {
      throw new Error(`No se encontró ninguna característica con el id: ${id}`);
    }

    return this.formatearCaracteristica(caracteristicaModificada);
  }

  async añadirASistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    const caracteristica = await CaracteristicaSchema.findByIdAndUpdate(
      caracteristicaId,
      { $addToSet: { ruleset: systemId } },
      { new: true }
    );

    if (!caracteristica) {
      throw new Error(`No se encontró ninguna característica con el id: ${caracteristicaId}`);
    }

    return this.formatearCaracteristica(caracteristica);
  }

  async eliminarDeSistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    const caracteristica = await CaracteristicaSchema.findByIdAndUpdate(
      caracteristicaId,
      { $pull: { ruleset: systemId } },
      { new: true }
    );

    if (!caracteristica) {
      throw new Error(`No se encontró ninguna característica con el id: ${caracteristicaId}`);
    }

    if (!caracteristica.ruleset || caracteristica.ruleset.length === 0) {
      await CaracteristicaSchema.findByIdAndDelete(caracteristicaId);
    }

    return this.formatearCaracteristica(caracteristica);
  }

  async obtenerPorSistemas(rulesets: string[]): Promise<CaracteristicaApi[]> {
    const caracteristicas = await CaracteristicaSchema.find({ ruleset: { $in: rulesets } });
    return caracteristicas.map(c => this.formatearCaracteristica(c));
  }

  async formatearAbilityBonuses(
    ability_bonuses: CaracteristicaBonusCreate[], 
    ruleset: string
  ): Promise<CaracteristicaBonus[]> {
    if (!ability_bonuses || ability_bonuses.length === 0) return [];

    const caracteristicas = await this.obtenerPorSistemas([ruleset]);
    const caracteristicasMap = new Map<string, string>();
    caracteristicas.forEach(c => {
      caracteristicasMap.set(c.key, c.name);
    });

    return ability_bonuses.map(ab => {
      const key = ab.key || '';
      return {
        key,
        name: caracteristicasMap.get(key) || key,
        bonus: ab.bonus
      };
    });
  }
 
  async formatearAbilityBonusChoices(
    ability_bonus_choices: ChoiceMongo | undefined, 
    ruleset: string
  ): Promise<ChoiceApi<CaracteristicaBonus> | undefined> {
    if (!ability_bonus_choices) return undefined;

    if (Array.isArray(ability_bonus_choices.options)) {
      const caracteristicas = await this.obtenerPorSistemas([ruleset]);
      const caracteristicasMap = new Map<string, string>();
      caracteristicas.forEach(c => {
        caracteristicasMap.set(c.key, c.name);
      });

      const options = ability_bonus_choices.options.map(option => {
        return {
          key: option,
          name: caracteristicasMap.get(option) ?? option,
          bonus: 1
        }
      });
      
      return {
        choose: ability_bonus_choices.choose,
        options
      };
    }

    return undefined;
  }

  private formatearCaracteristica(caracteristica: CaracteristicaMongo): CaracteristicaApi {
    return {
      id: caracteristica._id.toString(),
      ruleset: caracteristica.ruleset || [],
      name: caracteristica.name,
      description: caracteristica.description,
      key: caracteristica.key,
      abbreviation: caracteristica.abbreviation
    };
  }
}
