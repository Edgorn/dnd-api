import { RasgoMongo } from "../../../../domain/types";

import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
const RasgoSchema = require('../schemas/Rasgo');

export default class RasgoRepository extends IRasgoRepository {
  rasgosMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string
    }
  }
  constructor() {
    super()
    this.rasgosMap = {}
    this.cargarRasgos();
  }

  async cargarRasgos() {
    const rasgos = await RasgoSchema.find();

    rasgos.forEach((rasgo: RasgoMongo) => {
      this.rasgosMap[rasgo.index] = {
        index: rasgo.index,
        name: rasgo.name,
        desc: rasgo?.desc?.join('\n'),
      };
    });
  }

  obtenerRasgoPorIndice(index: string) {
    if (index === 'rogue-expertise') {
      return {
        index: 'rogue-expertise',
        name: '',
        desc: ''
      }
    } else {
      return this.rasgosMap[index];
    }
  }

  obtenerRasgosPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerRasgoPorIndice(index));
  }
}
