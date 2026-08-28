export interface Property {
  id?: string;
  name: string;
  description: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export type PropertyApi = Property;

export interface InputCreateProperty {
  ruleset: string;
  name: string;
  description: string;
}

export interface InputUpdateProperty {
  id: string;
  name?: string;
  description?: string;
}
