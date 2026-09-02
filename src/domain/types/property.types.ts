export interface Property {
  id?: string;
  name: string;
  description: string;
  ruleset: string;
  attackAttributes?: string[];
  deletedAt?: Date | null;
}

export type PropertyApi = Property;

export interface InputCreateProperty {
  ruleset: string;
  name: string;
  description: string;
  attackAttributes?: string[];
}

export interface InputUpdateProperty {
  id: string;
  name?: string;
  description?: string;
  attackAttributes?: string[];
}
