import { RasgoMongo } from "../../../../domain/types";

import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
const RasgoSchema = require('../schemas/Rasgo');

export default class RasgoRepository extends IRasgoRepository {
  rasgosMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string,
      discard?: string[],
      type?: string,
      spells?: any[],
      skills?: string[],
      proficiencies?: string[],
      proficiencies_weapon?: string[],
      proficiencies_armor?: string[],
      speed?: number,
      hidden?: boolean
    }
  }

  conjuroRepository: IConjuroRepository

  constructor(conjuroRepository: IConjuroRepository) {
    super()
    this.rasgosMap = {}
    this.conjuroRepository = conjuroRepository
    this.cargar();
  }

  async cargar() {
    const rasgos = await RasgoSchema.find();
    await this.conjuroRepository.init() 
  
    rasgos.forEach((rasgo: RasgoMongo) => {
      
      this.rasgosMap[rasgo.index] = {
        index: rasgo.index,
        name: rasgo.name,
        desc: rasgo?.desc?.join('\n'),
        discard: rasgo?.discard ?? [],
        type: rasgo?.type,
        spells: this.conjuroRepository.obtenerConjurosPorIndices(rasgo.spells ?? []),
        skills: rasgo?.skills ?? [],
        proficiencies: rasgo?.proficiencies ?? [],
        proficiencies_weapon: rasgo?.proficiencies_weapon ?? [],
        proficiencies_armor: rasgo?.proficiencies_armor ?? [],
        speed: rasgo?.speed ?? undefined,
        hidden: rasgo?.hidden
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
    console.info('obtenerRasgosPorIndices...')
    console.info(indices)
    return indices.map(index => this.obtenerRasgoPorIndice(index));
  }
}
