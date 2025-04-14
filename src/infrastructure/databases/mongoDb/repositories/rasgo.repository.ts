import { RasgoMongo } from "../../../../domain/types";

import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IIdiomaRepository from "../../../../domain/repositories/IIdiomaRepository";
const RasgoSchema = require('../schemas/Rasgo');

export default class RasgoRepository extends IRasgoRepository {
  private initialized = false;
  rasgosMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string,
      discard?: string[],
      type?: string,
      languages: string[],
      spells?: any[],
      skills?: string[],
      proficiencies?: string[],
      proficiencies_weapon?: string[],
      proficiencies_armor?: string[],
      speed?: number,
      hidden?: boolean,
      tables?: {
        title: string,
        data: {
          titles: string[],
          rows: string[][]
        }
      }[]
    }
  }

  conjuroRepository: IConjuroRepository

  constructor(conjuroRepository: IConjuroRepository) {
    super()
    this.rasgosMap = {}
    this.conjuroRepository = conjuroRepository
  }
  
  async init() {
    if (!this.initialized) {
      await this.cargar();
      this.initialized = true;
    }
  }

  async cargar() {
    console.log('Cargando rasgos...')
    const rasgos = await RasgoSchema.find();
    await this.conjuroRepository.init() 
     
    rasgos.forEach((rasgo: RasgoMongo) => {
      this.rasgosMap[rasgo.index] = {
        index: rasgo.index,
        name: rasgo.name,
        desc: rasgo?.desc?.join('\n'),
        discard: rasgo?.discard ?? [],
        type: rasgo?.type,
        languages: rasgo?.languages ?? [],
        spells: this.conjuroRepository.obtenerConjurosPorIndices(rasgo.spells ?? []),
        skills: rasgo?.skills ?? [],
        proficiencies: rasgo?.proficiencies ?? [],
        proficiencies_weapon: rasgo?.proficiencies_weapon ?? [],
        proficiencies_armor: rasgo?.proficiencies_armor ?? [],
        speed: rasgo?.speed ?? undefined,
        hidden: rasgo?.hidden,
        tables: rasgo?.tables ?? []
      };
    });
    
    this.initialized = true;
    console.log('Rasgos cargados')
  }
 
  obtenerRasgoPorIndice(index: string) {
    if (index) {
      return this.rasgosMap[index];
    } else {
      return null
    }
  }

  obtenerRasgosPorIndices(indices: string[]) {
    return indices
      .map(index => this.obtenerRasgoPorIndice(index))
      .filter(index => index !== null && index !== undefined);
  }
}
