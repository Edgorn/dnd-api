import IMetamagiaRepository from "../../../../domain/repositories/IMetamagiaRepository";
const MetamagiaSchema = require('../schemas/Metamagia');

export default class MetamagiaRepository extends IMetamagiaRepository {
  private initialized = false;
  metamagiaMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string
    }
  }

  constructor() {
    super()
    this.metamagiaMap = {}
    this.cargar();
  } 

  async init() {
    if (!this.initialized) {
      await this.cargar();
      this.initialized = true;
    }
  }
 
  async cargar() {
    const disciplinas = await MetamagiaSchema.find();
    
    disciplinas.forEach((disciplina: any) => {
      this.metamagiaMap[disciplina.index] = {
        index: disciplina.index,
        name: disciplina.name,
        desc: disciplina?.desc?.join('\n')
      }; 
    });
  }

  obtenerMetamagiaPorIndice(index: string) {
    return this.metamagiaMap[index];
  }

  obtenerMetamagiasPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerMetamagiaPorIndice(index));
  }

  obtenerTodos() {
    const metamagia = Object.values(this.metamagiaMap);

    metamagia.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return metamagia
  }
}
