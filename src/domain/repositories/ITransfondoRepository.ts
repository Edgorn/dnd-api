import { TransfondoApi, TransfondoMongo, VarianteApi, VarianteMongo } from "../types/transfondos";

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

  formatearVariantes(variantes: VarianteMongo[]): VarianteApi[] {
    throw new Error('Método no implementado');
  }

  formatearVariante(variante: VarianteMongo): VarianteApi {
    throw new Error('Método no implementado');
  }
}