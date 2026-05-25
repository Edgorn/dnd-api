import mongoose from 'mongoose';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import SistemasModel from '../schemas/System';
import { System, SystemApi, TypeCrearSystem, TypeModificarSystem } from '../../../../domain/types/system.types';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import RaceModel from '../schemas/Raza';
import IdiomaModel from '../schemas/Idioma';
import RasgoModel from '../schemas/Rasgo';

export default class SystemRepository implements ISystemRepository {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository
  ) {}

  private async obtenerEstadisticasSistema(sysId: string, sysName: string) {
    const rulesetQuery = {
      $or: [
        { ruleset: sysId },
        { ruleset: sysName }
      ]
    };

    const [racesCount, languagesCount, traitsCount] = await Promise.all([
      RaceModel.countDocuments(rulesetQuery),
      IdiomaModel.countDocuments(rulesetQuery),
      RasgoModel.countDocuments(rulesetQuery)
    ]);

    return { racesCount, languagesCount, traitsCount };
  }

  async consultarSistemasPorUsuario(userId: string): Promise<SystemApi[]> {
    const usuario = await this.usuarioRepository.buscarUsuarioPorId(userId);
    const accessibleSystemIds = usuario?.accessibleSystems || [];

    const query: any = {
      $or: [
        { publisher: userId },
        { isOpen: true }
      ]
    };

    if (accessibleSystemIds.length > 0) {
      const validIds = accessibleSystemIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        query.$or.push({ _id: { $in: validIds } });
      }
    }

    const sistemas = await SistemasModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return Promise.all(sistemas.map(async (sys) => {
      const isPublisher = sys.publisher === userId;

      let publisherName = sys.publisher;
      if (mongoose.Types.ObjectId.isValid(sys.publisher)) {
        const user = await this.usuarioRepository.buscarUsuarioPorId(sys.publisher);
        if (user) {
          publisherName = user.name;
        }
      }

      const { racesCount, languagesCount, traitsCount } = await this.obtenerEstadisticasSistema(
        sys._id.toString(),
        sys.name
      );

      return {
        id: sys._id.toString(),
        name: sys.name || '',
        description: sys.description || '',
        publisher: publisherName,
        isOpen: !!sys.isOpen,
        canEdit: isPublisher,
        racesCount,
        languagesCount,
        traitsCount
      };
    }));
  }

  async crear(data: TypeCrearSystem): Promise<SystemApi | null> {
    const nuevoSistema = new SistemasModel({
      name: data.name,
      description: data.description,
      publisher: data.publisher,
      isOpen: data.isOpen
    });

    const resultado = await nuevoSistema.save();

    let publisherName = resultado.publisher;
    if (mongoose.Types.ObjectId.isValid(resultado.publisher)) {
      const user = await this.usuarioRepository.buscarUsuarioPorId(resultado.publisher);
      if (user) {
        publisherName = user.name;
      }
    }

    const { racesCount, languagesCount, traitsCount } = await this.obtenerEstadisticasSistema(
      resultado._id.toString(),
      resultado.name
    );

    return {
      id: resultado._id.toString(),
      name: resultado.name || '',
      description: resultado.description || '',
      publisher: publisherName,
      isOpen: !!resultado.isOpen,
      canEdit: true,
      racesCount,
      languagesCount,
      traitsCount
    };
  }

  async modificar(data: TypeModificarSystem): Promise<SystemApi | null> {
    const { id, name, description, isOpen } = data;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (isOpen !== undefined) updateFields.isOpen = isOpen;

    const resultado = await SistemasModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!resultado) return null;

    let publisherName = resultado.publisher;
    if (mongoose.Types.ObjectId.isValid(resultado.publisher)) {
      const user = await this.usuarioRepository.buscarUsuarioPorId(resultado.publisher);
      if (user) {
        publisherName = user.name;
      }
    }

    const { racesCount, languagesCount, traitsCount } = await this.obtenerEstadisticasSistema(
      resultado._id.toString(),
      resultado.name
    );

    return {
      id: resultado._id.toString(),
      name: resultado.name || '',
      description: resultado.description || '',
      publisher: publisherName,
      isOpen: !!resultado.isOpen,
      canEdit: resultado.publisher === data.userId,
      racesCount,
      languagesCount,
      traitsCount
    };
  }

  async obtenerPorId(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return SistemasModel.findById(id).lean();
  }
}
