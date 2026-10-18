import {
  InputCreateSubclass,
  InputUpdateSubclass,
  SubclassApi,
  SubclassSummaryDraft
} from "../types/subclass.types";

export default interface ISubclassRepository {
  getBySystems(rulesets: string[], classId?: string): Promise<SubclassApi[]>;
  getByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassApi[]>;
  getSummariesByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassSummaryDraft[]>;
  countByClassIds(classIds: string[], rulesets: string[]): Promise<Map<string, number>>;
  getByIds(ids: string[]): Promise<SubclassApi[]>;
  getById(id: string): Promise<SubclassApi | null>;
  create(data: InputCreateSubclass): Promise<SubclassApi>;
  update(data: InputUpdateSubclass): Promise<SubclassApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
