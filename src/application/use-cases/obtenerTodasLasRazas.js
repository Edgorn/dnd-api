const RazaService = require('../../domain/services/raza.service');

class ObtenerTodasLasRazas {
  constructor(razaService) {
    this.razaService = razaService;
  }

  async execute() {
    return await this.razaService.obtenerTodasLasRazas();
  }
}

module.exports = ObtenerTodasLasRazas;