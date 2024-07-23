class RazaService {
  constructor(razaRepository) {
    this.razaRepository = razaRepository;
  }

  async obtenerTodasLasRazas() {
    try {
      const razas = await this.razaRepository.obtenerTodas();
      return { success: true, data: razas };
    } catch (error) {
      return { success: false, message: 'Error al recuperar las razas' };
    }
  }
}

module.exports = RazaService;