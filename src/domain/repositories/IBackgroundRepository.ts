import { BackgroundApi, InputCreateBackground, InputUpdateBackground } from "../types/background.types";

export default interface IBackgroundRepository {
  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<BackgroundApi[]>;
  getById(id: string): Promise<BackgroundApi | null>;
  create(data: InputCreateBackground): Promise<BackgroundApi>;
  update(data: InputUpdateBackground): Promise<BackgroundApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
