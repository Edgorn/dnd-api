import IMagicSchoolRepository from "../repositories/IMagicSchoolRepository";
import { MagicSchoolApi, InputCreateMagicSchool, InputUpdateMagicSchool } from "../types/magicSchool.types";

export default class MagicSchoolService {
  constructor(private readonly magicSchoolRepository: IMagicSchoolRepository) {}

  getBySystems(rulesets: string[]): Promise<MagicSchoolApi[]> {
    return this.magicSchoolRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<MagicSchoolApi | null> {
    return this.magicSchoolRepository.getById(id);
  }

  create(magicSchool: InputCreateMagicSchool): Promise<MagicSchoolApi> {
    return this.magicSchoolRepository.create(magicSchool);
  }

  update(magicSchool: InputUpdateMagicSchool): Promise<MagicSchoolApi> {
    return this.magicSchoolRepository.update(magicSchool);
  }

  softDelete(id: string): Promise<void> {
    return this.magicSchoolRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.magicSchoolRepository.restore(id);
  }
}
