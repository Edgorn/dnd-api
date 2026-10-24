export interface AttributeRequirementCreate {
  key: string;
  min: number;
}

export interface AttributeRequirement {
  key: string;
  name: string;
  min: number;
  icon?: string;
}

export interface AttributeRequirementsCreate {
  attributeMode?: "all" | "any";
  attributes?: AttributeRequirementCreate[];
}

export interface AttributeRequirements {
  attributeMode: "all" | "any";
  attributes: AttributeRequirement[];
}
