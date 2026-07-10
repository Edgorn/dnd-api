import { System, TypeCrearSystem, TypeModificarSystem } from "../types/system.types";

export default interface ISystemRepository {
  getByUserId(userId: string, accessibleSystemIds: string[]): Promise<System[]>;
  create(data: TypeCrearSystem): Promise<System | null>;
  update(data: TypeModificarSystem): Promise<System | null>;
  getById(id: string): Promise<System | null>;
  obtenerPorId(id: string): Promise<System | null>;
  getByIdWithDeleted(id: string): Promise<System | null>;
  getGlobalModifierFormula(systems: string[]): Promise<string | undefined>;
  getInitiativeBonusFormula(systems: string[]): Promise<string | undefined>;
  verifySystemsNotBase(systems: string[]): Promise<void>;
  getSystemsAndAncestors(systems: string[]): Promise<string[]>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  restore(id: string): Promise<void>;
}
