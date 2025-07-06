import INpcRepository from "../repositories/INpcRepository";

export default class NpcsService {
  private npcRepository: INpcRepository;

  constructor(npcRepository: INpcRepository) {
    this.npcRepository = npcRepository;
  }

  async obtenerTodosLosNpcs() {
    try {
      const npcs = await this.npcRepository.obtenerTodos();
      return { success: true, data: npcs };
    } catch (error) {
      return { success: false, message: 'Error al recuperar los npcs' };
    }
  }
}
