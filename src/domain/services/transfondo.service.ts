import ITransfondoRepository from "../repositories/ITransfondoRepository";

export default class TransfondoService {
  private transfondoRepository: ITransfondoRepository;

  constructor(transfondoRepository: ITransfondoRepository) {
    this.transfondoRepository = transfondoRepository;
  }

  async obtenerTodosLosTransfondos(): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const transfondos = await this.transfondoRepository.obtenerTodos();
      return { success: true, data: transfondos };
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al recuperar los transfondos' };
    }
  }
}
