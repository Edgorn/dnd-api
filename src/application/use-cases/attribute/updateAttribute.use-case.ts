import AttributeService from "../../../domain/services/attribute.service";
import { AttributeApi, InputUpdateAttribute } from "../../../domain/types/attribute.types";

export default class UpdateAttribute {
  constructor(private readonly attributeService: AttributeService) { }

  execute(data: InputUpdateAttribute): Promise<AttributeApi> {
    return this.attributeService.update(data);
  }
}
