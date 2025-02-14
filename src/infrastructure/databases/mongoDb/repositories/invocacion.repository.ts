import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import ConjuroRepository from "./conjuros.repository";
import IInvocacionRepository from "../../../../domain/repositories/IInvocacionRepository";
const InvocacionSchema = require('../schemas/Invocacion');

export default class InvocacionRepository extends IInvocacionRepository {
  invocacionesMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string,
      spells: any[],
      skills: string[],
      requirements: any
    }
  }
  
  conjuroRepository: IConjuroRepository

  constructor() {
    super()
    this.invocacionesMap = {}
    this.conjuroRepository = new ConjuroRepository()
    //this.cargarInvocaciones();
  } 

  async inicializar() {
    await this.conjuroRepository.cargar(); // Esperar a que los conjuros se carguen
    await this.cargarInvocaciones();
  } 

  async cargarInvocaciones() {
    const invocaciones = await InvocacionSchema.find(); 

    invocaciones.forEach((invocacion: any) => {
      this.invocacionesMap[invocacion.index] = {
        index: invocacion.index,
        name: invocacion.name,
        desc: invocacion?.desc?.join('\n'),
        spells: this.conjuroRepository.obtenerConjurosPorIndices(invocacion?.spells ?? []),
        skills: invocacion?.skills ?? [],
        requirements: {
          spells: this.conjuroRepository
            .obtenerConjurosPorIndices(invocacion?.requirements?.spells ?? []) 
            .map(spell => {
              return {
                index: spell.index,
                name: spell.name
              } 
            }),
          level: invocacion?.requirements?.level ?? 0
        }
      };
    });
  }

  obtenerInvocacionPorIndice(index: string) {
    return this.invocacionesMap[index];
  }

  obtenerInvocacionesPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerInvocacionPorIndice(index));
  }

  obtenerTodos() {
    const invocaciones = Object.values(this.invocacionesMap);

    invocaciones.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return invocaciones
  }
}
