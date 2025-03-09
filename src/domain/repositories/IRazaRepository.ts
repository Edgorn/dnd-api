import { RaceApi } from "../types/razas";

export default class IRazaRepository {
  async obtenerTodas(): Promise<RaceApi[]> {
    throw new Error('Método no implementado');
  }

  async getRaza(index: string): Promise<any> {
    throw new Error('Método no implementado');
  }
}
