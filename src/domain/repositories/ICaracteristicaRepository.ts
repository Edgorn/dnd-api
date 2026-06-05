import { CaracteristicaApi, InputCrearCaracteristica, InputModificarCaracteristica } from "../types/caracteristica.types";

export default interface ICaracteristicaRepository {
  crear(data: InputCrearCaracteristica): Promise<CaracteristicaApi>;
  modificar(data: InputModificarCaracteristica): Promise<CaracteristicaApi>;
  añadirASistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi>;
  eliminarDeSistema(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi>;
  obtenerPorSistemas(rulesets: string[]): Promise<CaracteristicaApi[]>;
}
