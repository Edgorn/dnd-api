import {
  InputCreateSubclass,
  InputUpdateSubclass,
  SubclassApi
} from "../types/subclass.types";

export default interface ISubclassRepository {
  getBySystems(rulesets: string[], classId?: string): Promise<SubclassApi[]>;
  getByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassApi[]>;
  getByIds(ids: string[]): Promise<SubclassApi[]>;
  getById(id: string): Promise<SubclassApi | null>;
  create(data: InputCreateSubclass): Promise<SubclassApi>;
  update(data: InputUpdateSubclass): Promise<SubclassApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
