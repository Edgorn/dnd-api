class ClaseService {
  constructor(claseRepository) {
    this.claseRepository = claseRepository;
  }

  async obtenerTodasLasClases() {
    try {
      const clases = await this.claseRepository.obtenerTodas();
      return { success: true, data: clases };
    } catch (error) {
      return { success: false, message: 'Error al recuperar las clases' };
    }
  }
}

module.exports = ClaseService;