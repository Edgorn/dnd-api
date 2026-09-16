import ISubclassRepository from "../repositories/ISubclassRepository";
import {
  InputCreateSubclass,
  InputUpdateSubclass,
  SubclassApi
} from "../types/subclass.types";

export default class SubclassService {
  constructor(private readonly subclassRepository: ISubclassRepository) { }

  getBySystems(rulesets: string[], classId?: string): Promise<SubclassApi[]> {
    return this.subclassRepository.getBySystems(rulesets, classId);
  }

  getByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassApi[]> {
    return this.subclassRepository.getByClassAndSystems(classId, rulesets);
  }

  getByIds(ids: string[]): Promise<SubclassApi[]> {
    return this.subclassRepository.getByIds(ids);
  }

  getById(id: string): Promise<SubclassApi | null> {
    return this.subclassRepository.getById(id);
  }

  create(data: InputCreateSubclass): Promise<SubclassApi> {
    return this.subclassRepository.create(data);
  }

  update(data: InputUpdateSubclass): Promise<SubclassApi> {
    return this.subclassRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.subclassRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.subclassRepository.restore(id);
  }
}
