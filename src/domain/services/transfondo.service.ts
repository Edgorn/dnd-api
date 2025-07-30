import ITransfondoRepository from "../repositories/ITransfondoRepository";
import { TransfondoApi } from "../types/transfondos.types";

export default class TransfondoService {
  constructor(private readonly transfondoRepository: ITransfondoRepository) { }

  obtenerTodos(): Promise<TransfondoApi[]> {
    return this.transfondoRepository.obtenerTodos();
  }
}
