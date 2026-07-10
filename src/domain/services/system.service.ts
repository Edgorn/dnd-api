import ISystemRepository from '../repositories/ISystemRepository';
import { System, TypeCrearSystem, TypeModificarSystem } from '../types/system.types';

export default class SystemService {
  constructor(private readonly systemRepository: ISystemRepository) {}

  getByUserId(userId: string, accessibleSystemIds: string[]): Promise<System[]> {
    return this.systemRepository.getByUserId(userId, accessibleSystemIds);
  }

  create(data: TypeCrearSystem): Promise<System | null> {
    return this.systemRepository.create(data);
  }

  async update(data: TypeModificarSystem): Promise<System | null> {
    const system = await this.systemRepository.getById(data.id);
    if (!system) {
      throw new Error('Sistema no encontrado');
    }

    if (system.publisher !== data.userId) {
      throw new Error('No tienes permisos de edición para este sistema');
    }

    return this.systemRepository.update(data);
  }

  obtenerPorId(id: string): Promise<System | null> {
    return this.systemRepository.getById(id);
  }

  getById(id: string): Promise<System | null> {
    return this.systemRepository.getById(id);
  }

  getByIdWithDeleted(id: string): Promise<System | null> {
    return this.systemRepository.getByIdWithDeleted(id);
  }

  getSystemsAndAncestors(systems: string[]): Promise<string[]> {
    return this.systemRepository.getSystemsAndAncestors(systems);
  }

  softDelete(id: string, deletedAt: Date): Promise<void> {
    return this.systemRepository.softDelete(id, deletedAt);
  }

  restore(id: string): Promise<void> {
    return this.systemRepository.restore(id);
  }
}
