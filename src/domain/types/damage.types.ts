export interface Damage {
  id?: string;
  name: string;
  description: string;
  color: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export interface InputCreateDamage {
  ruleset: string;
  name: string;
  description: string;
  color: string;
}

export interface InputUpdateDamage {
  id: string;
  name?: string;
  description?: string;
  color?: string;
}
