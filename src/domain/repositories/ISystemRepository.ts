import { System, SystemKind, SystemRulesConfig, TypeCrearSystem, TypeModificarSystem } from "../types/system.types";

export default interface ISystemRepository {
  getByUserId(userId: string, accessibleSystemIds: string[], kind?: SystemKind): Promise<System[]>;
  hasChildren(id: string): Promise<boolean>;
  create(data: TypeCrearSystem): Promise<System | null>;
  update(data: TypeModificarSystem): Promise<System | null>;
  getById(id: string): Promise<System | null>;
  getByIds(ids: string[]): Promise<System[]>;
  getByIdWithDeleted(id: string): Promise<System | null>;
  getGlobalModifierFormula(systems: string[]): Promise<string | undefined>;
  getInitiativeBonusFormula(systems: string[]): Promise<string | undefined>;
  getMergedRulesConfig(systemIds: string[]): Promise<SystemRulesConfig>;
  verifySystemsNotBase(systems: string[]): Promise<void>;
  getAncestry(systemId: string): Promise<System[]>;
  getSystemsAndAncestors(systems: string[]): Promise<string[]>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  restore(id: string): Promise<void>;
}
