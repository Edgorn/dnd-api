const ClaseService = require('../../domain/services/clase.service');

class ObtenerTodasLasClases {
  constructor(claseService) {
    this.claseService = claseService;
  }

  async execute() {
    return await this.claseService.obtenerTodasLasClases();
  }
}

module.exports = ObtenerTodasLasClases;