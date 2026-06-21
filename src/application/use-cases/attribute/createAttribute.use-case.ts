import AttributeService from "../../../domain/services/attribute.service";
import { AttributeApi, InputCreateAttribute } from "../../../domain/types/attribute.types";

export default class CreateAttribute {
  constructor(private readonly attributeService: AttributeService) { }

  execute(data: InputCreateAttribute): Promise<AttributeApi> {
    return this.attributeService.create(data);
  }
}
