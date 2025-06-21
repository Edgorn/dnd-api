import ICriaturaRepository from "../repositories/ICriaturaRepository";

export default class CriaturaService {
  private criaturaRepository: ICriaturaRepository;

  constructor(criaturaRepository: ICriaturaRepository) {
    this.criaturaRepository = criaturaRepository;
  }

  async obtenerTodasLasCriaturas() {
    try {
      const criaturas = await this.criaturaRepository.obtenerTodas();
      return { success: true, data: criaturas };
    } catch (error) {
      return { success: false, message: 'Error al recuperar las clases' };
    }
  }
}
