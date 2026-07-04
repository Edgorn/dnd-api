import ISystemRepository from '../repositories/ISystemRepository';
import { SystemApi, TypeCrearSystem, TypeModificarSystem } from '../types/system.types';

export default class SystemService {
  constructor(private readonly systemRepository: ISystemRepository) {}

  consultarPorUsuario(userId: string): Promise<SystemApi[]> {
    return this.systemRepository.consultarSistemasPorUsuario(userId);
  }

  crear(data: TypeCrearSystem): Promise<SystemApi | null> {
    return this.systemRepository.crear(data);
  }

  async modificar(data: TypeModificarSystem): Promise<SystemApi | null> {
    const sistema = await this.systemRepository.obtenerPorId(data.id);
    if (!sistema) {
      throw new Error('Sistema no encontrado');
    }

    if (sistema.publisher !== data.userId) {
      throw new Error('No tienes permisos de edición para este sistema');
    }

    return this.systemRepository.modificar(data);
  }

  getSystemsAndAncestors(systems: string[]): Promise<string[]> {
    return this.systemRepository.getSystemsAndAncestors(systems);
  }
}
