import { TransfondoApi, TransfondoMongo, VarianteApi, VarianteMongo } from "../types/transfondos";

export default class ITransfondoRepository {
  async obtenerTodos(): Promise<TransfondoApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearTransfondos(transfondos: TransfondoMongo[]): Promise<TransfondoApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearTransfondo(transfondo: TransfondoMongo): Promise<TransfondoApi> {
    throw new Error('Método no implementado');
  }

  async formatearVariantes(variantes: VarianteMongo[]): Promise<VarianteApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearVariante(variante: VarianteMongo): Promise<VarianteApi> {
    throw new Error('Método no implementado');
  }
}