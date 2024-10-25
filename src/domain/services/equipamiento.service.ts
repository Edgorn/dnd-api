import IEquipamientoRepository from "../repositories/IEquipamientoRepository";

export default class EquipamientoService {
  private equipamientoRepository: IEquipamientoRepository;

  constructor(equipamientoRepository: IEquipamientoRepository) {
    this.equipamientoRepository = equipamientoRepository;
  }

  async obtenerEquipamientosPorTipo(data: any) {
    try {
      const equipamientos = await this.equipamientoRepository.obtenerEquipamientosPorTipo(data.type);

      return { success: true, data: equipamientos };
    } catch (error) {
      return { success: false, message: 'Error al recuperar los equipamientos' };
    }
  }
}
