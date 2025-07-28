import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import ConjuroRepository from "./conjuros.repository";
import IInvocacionRepository from "../../../../domain/repositories/IInvocacionRepository";
import IRasgoRepository from "../../../../domain/repositories/IRasgoRepository";
import RasgoRepository from "./rasgo.repository";
import IdiomaRepository from "./idioma.repository";
import IIdiomaRepository from "../../../../domain/repositories/IIdiomaRepository";
import IDañoRepository from "../../../../domain/repositories/IDañoRepository";
import DañoRepository from "./daño.repository";
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
  rasgoRepository: IRasgoRepository
  idiomaRepository: IIdiomaRepository
  dañoRepository: IDañoRepository

  constructor() {
    super()
    this.invocacionesMap = {}
    this.conjuroRepository = new ConjuroRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.dañoRepository = new DañoRepository()
    this.rasgoRepository = new RasgoRepository(/*this.conjuroRepository,*/ this.dañoRepository)
    //this.cargarInvocaciones();
  } 

  async inicializar() {
    await this.cargarInvocaciones();
  } 

  async cargarInvocaciones() {
    const invocaciones = await InvocacionSchema.find(); 
    
    invocaciones.forEach(async (invocacion: any) => {
      const traits = await this.rasgoRepository.obtenerRasgosPorIndices(invocacion?.requirements?.traits ?? []) 
      const conjuros = await this.conjuroRepository.obtenerConjurosPorIndices(invocacion?.spells ?? []) 
      const conjuros_required = await this.conjuroRepository.obtenerConjurosPorIndices(invocacion?.requirements?.spells ?? []) 

      this.invocacionesMap[invocacion.index] = {
        index: invocacion.index,
        name: invocacion.name,
        desc: invocacion?.desc?.join('\n'),
        spells: conjuros,
        skills: invocacion?.skills ?? [],
        requirements: {
          spells: conjuros_required
            .map(spell => {
              return {
                index: spell.index,
                name: spell.name
              } 
            }),
          traits: traits.map(trait => {
              return {
                index: trait.index,
                name: trait.name
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
