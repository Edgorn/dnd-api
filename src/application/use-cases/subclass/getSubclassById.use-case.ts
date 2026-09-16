import SubclassService from "../../../domain/services/subclass.service";
import { SubclassApi } from "../../../domain/types/subclass.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GetSubclassById {
  constructor(private readonly subclassService: SubclassService) { }

  async execute(id: string): Promise<SubclassApi> {
    const subclass = await this.subclassService.getById(id);
    if (!subclass || subclass.deletedAt) {
      throw new NotFoundError("Subclase no encontrada");
    }
    return subclass;
  }
}
