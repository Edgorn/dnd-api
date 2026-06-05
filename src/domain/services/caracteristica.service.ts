import ICaracteristicaRepository from "../repositories/ICaracteristicaRepository";
import { CaracteristicaApi, InputCrearCaracteristica, InputModificarCaracteristica } from "../types/caracteristica.types";

export default class CaracteristicaService {
  constructor(private readonly caracteristicaRepository: ICaracteristicaRepository) { }

  crear(data: InputCrearCaracteristica): Promise<CaracteristicaApi> {
    return this.caracteristicaRepository.crear(data);
  }

  modificar(data: InputModificarCaracteristica): Promise<CaracteristicaApi> {
    return this.caracteristicaRepository.modificar(data);
  }

  añadirASistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    return this.caracteristicaRepository.añadirASistema(caracteristicaId, systemId);
  }

  eliminarDeSistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    return this.caracteristicaRepository.eliminarDeSistema(caracteristicaId, systemId);
  }

  obtenerPorSistemas(rulesets: string[]): Promise<CaracteristicaApi[]> {
    return this.caracteristicaRepository.obtenerPorSistemas(rulesets);
  }
}
