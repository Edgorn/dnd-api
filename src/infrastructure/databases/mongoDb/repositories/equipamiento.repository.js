const IEquipamientoRepository = require('../../../../domain/repositories/IEquipamientoRepository');
const EquipamientoSchema = require('../schemas/Equipamiento');

class EquipamientoRepository extends IEquipamientoRepository {

  constructor() {
    super()
    this.equipamientosMap = {}
    this.cargarEquipamientos();
  }

  async cargarEquipamientos() {
    const equipamientos = await EquipamientoSchema.find();

    equipamientos.forEach(equipamiento => {
      this.equipamientosMap[equipamiento.index] = {
        index: equipamiento.index,
        name: equipamiento.name,
        category: equipamiento.category,
        weapon: equipamiento.weapon
      };
    });
  }

  obtenerEquipamientoPorIndice(index) {
    return this.equipamientosMap[index];
  }

  obtenerEquipamientosPorIndices(indices) {
    return indices.map(index => this.obtenerEquipamientoPorIndice(index));
  }

  obtenerEquipamientosPorTipos(categoria, tipo, rango) {
    const equipamientos = Object.values(this.equipamientosMap)

    return equipamientos
      .filter(eq => !categoria || eq?.category?.toLowerCase() === categoria)
      .filter(eq => !tipo || eq?.weapon?.category?.toLowerCase() === tipo)
      .filter(eq => !rango || eq?.weapon?.range?.toLowerCase() === rango)
  }
}

module.exports = EquipamientoRepository;