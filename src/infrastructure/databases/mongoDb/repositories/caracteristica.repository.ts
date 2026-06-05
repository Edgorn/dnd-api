import ICaracteristicaRepository from "../../../../domain/repositories/ICaracteristicaRepository";
import { CaracteristicaApi, CaracteristicaMongo, InputCrearCaracteristica, InputModificarCaracteristica } from "../../../../domain/types/caracteristica.types";
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

    return this.formatearCaracteristica(caracteristica);
  }

  async obtenerPorSistemas(rulesets: string[]): Promise<CaracteristicaApi[]> {
    const caracteristicas = await CaracteristicaSchema.find({ ruleset: { $in: rulesets } });
    return caracteristicas.map(c => this.formatearCaracteristica(c));
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
