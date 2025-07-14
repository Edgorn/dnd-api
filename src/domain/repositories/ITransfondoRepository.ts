import { TransfondoApi, TransfondoMongo } from "../types/transfondos";

export default class ITransfondoRepository {
  async obtenerTodos(): Promise<TransfondoApi[]> {
    throw new Error('Método no implementado');
  }

  formatearTransfondos(transfondos: TransfondoMongo[]): TransfondoApi[] {
    throw new Error('Método no implementado');
  }

  formatearTransfondo(transfondo: TransfondoMongo): TransfondoApi {
    throw new Error('Método no implementado');
  }
}