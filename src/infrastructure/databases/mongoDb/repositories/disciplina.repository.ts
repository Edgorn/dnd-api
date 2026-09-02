import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import IDisciplinaRepository from "../../../../domain/repositories/IDisciplinaRepository";
const DisciplinaSchema = require('../schemas/Disciplina');

export default class DisciplinaRepository extends IDisciplinaRepository {
  private initialized = false;
  disciplinasMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string,
      spells: any[],
      level: number
    }
  } 
 
  spellRepository: ISpellRepository

  constructor(spellRepository: ISpellRepository) {
    super()
    this.disciplinasMap = {}
    this.spellRepository = spellRepository
    this.cargar();
  } 

  async init() {
    if (!this.initialized) {
      await this.cargar();
      this.initialized = true;
    }
  }
 
  async cargar() {
    const disciplinas = await DisciplinaSchema.find();
    
    disciplinas.forEach(async (disciplina: any) => {
    /*const spells = await this.spellRepository.getSpellsByIndexes(disciplina?.spells ?? [])
      this.disciplinasMap[disciplina.index] = {
        index: disciplina.index,
        name: disciplina.name,
        desc: disciplina?.desc?.join('\n'),
         spells,
        level: disciplina?.level ?? 0
      }; */
    });
  }

  obtenerDisciplinaPorIndice(index: string) {
    return this.disciplinasMap[index];
  }

  obtenerDisciplinasPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerDisciplinaPorIndice(index));
  }

  obtenerTodos() {
    const disciplinas = Object.values(this.disciplinasMap);

    disciplinas.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return disciplinas
  }
}
