import { Types } from 'mongoose';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { CrearIdioma, IdiomaApi, IdiomaMongo } from '../../../../domain/types/idiomas.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import IdiomaSchema from '../schemas/Idioma';

import ISystemRepository from '../../../../domain/repositories/ISystemRepository';

export default class IdiomaRepository implements IIdiomaRepository {
  private idiomasMap: Record<string, IdiomaMongo>
  private todosConsultados = false

  constructor(private readonly systemRepository?: ISystemRepository) {
    this.idiomasMap = {}
  }

  async obtenerIdiomasPorSistemas(ruleset: string[]): Promise<IdiomaApi[]> {
    const expandedRulesets = this.systemRepository
      ? await this.systemRepository.getSystemsAndAncestors(ruleset)
      : ruleset;
    const idiomas = await IdiomaSchema.find({ ruleset: { $in: expandedRulesets } })
    return this.formatearIdiomas(idiomas);
  }

  async crearIdioma(idioma: CrearIdioma): Promise<IdiomaApi> {
    const nuevoIdioma = new IdiomaSchema(idioma);
    await nuevoIdioma.save();

    this.idiomasMap[nuevoIdioma._id.toString()] = nuevoIdioma;

    return this.formatearIdioma(nuevoIdioma);
  }

  async modificarIdioma(idioma: CrearIdioma): Promise<IdiomaApi> {
    const idiomaModificado = await IdiomaSchema.findByIdAndUpdate(idioma.id, idioma, { new: true });

    if (!idiomaModificado) {
      throw new Error(`No se encontró ningún idioma con el identificador: ${idioma.id}`);
    }

    this.idiomasMap[idiomaModificado.id] = idiomaModificado;

    return this.formatearIdioma(idiomaModificado);
  }

  async obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]> {
    if (!indices.length) return [];
    
    const result: IdiomaMongo[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.idiomasMap[indice]) {
        result.push(this.idiomasMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const validMongoIds = missing.filter(item => Types.ObjectId.isValid(item));
      const stringIndexes = missing.filter(item => !Types.ObjectId.isValid(item));

      const idiomas = await IdiomaSchema.find({
        $or: [
          { _id: { $in: validMongoIds } as any },
          { index: { $in: stringIndexes } }
        ]
      });

      idiomas.forEach(idioma => (this.idiomasMap[idioma.id] = idioma));
      result.push(...idiomas);
    }

    return ordenarPorNombre(this.formatearIdiomas(result));
  }
  
  async formatearOpcionesDeIdioma(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<IdiomaApi> | undefined> {
    if (!opciones) return undefined

    if (Array.isArray(opciones.options)) {
      const idiomas = await this.obtenerIdiomasPorIndices(opciones.options);
      
      return {
        choose: opciones.choose,
        options: idiomas
      };
    }

    if (opciones.options === 'all') {
      const idiomas = await this.obtenerTodos()

      return {
        choose: opciones.choose,
        options: idiomas
      }
    }

    console.warn("Opciones de idioma no reconocidas:", opciones.options);
    return undefined;
  }

  private async obtenerTodos(): Promise<IdiomaApi[]> {
    if (!this.todosConsultados) {
      const idiomas = await IdiomaSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      idiomas.forEach(idioma => (this.idiomasMap[idioma.id] = idioma))
      this.todosConsultados = true
    }
    
    return ordenarPorNombre(this.formatearIdiomas(Object.values(this.idiomasMap)))
  }

  private formatearIdiomas(idiomas: IdiomaMongo[]): IdiomaApi[] {
    return idiomas.map(idioma => this.formatearIdioma(idioma));
  }

  private formatearIdioma(idioma: IdiomaMongo): IdiomaApi {
    return {
      id: idioma.index ?? idioma._id.toString(),
      name: idioma.name,
      type: idioma.type,
      description: idioma.description,
      script: idioma.script,
      ruleset: idioma.ruleset
    }
  }
}
