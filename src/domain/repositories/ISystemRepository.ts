import { System, SystemApi, TypeCrearSystem, TypeModificarSystem } from "../types/system.types";

export default interface ISystemRepository {
  consultarSistemasPorUsuario(userId: string): Promise<SystemApi[]>;
  crear(data: TypeCrearSystem): Promise<SystemApi | null>;
  modificar(data: TypeModificarSystem): Promise<SystemApi | null>;
  obtenerPorId(id: string): Promise<System | null>;
  obtenerFormulaModificadorGlobal(systems: string[]): Promise<string | undefined>;
  obtenerFormulaBonoIniciativa(systems: string[]): Promise<string | undefined>;
  verificarSistemasNoBase(systems: string[]): Promise<void>;
  getSystemsAndAncestors(systems: string[]): Promise<string[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
