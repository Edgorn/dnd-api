export interface ArmorDuration {
  value: number;
  unit: string;
}

export interface ArmorType {
  id: string;
  ruleset: string;
  name: string;
  description: string;
  don: ArmorDuration;
  doff: ArmorDuration;
  deletedAt?: Date | null;
}

export interface InputCreateArmorType {
  ruleset: string;
  name: string;
  description: string;
  don: ArmorDuration;
  doff: ArmorDuration;
}

export interface InputUpdateArmorType {
  id: string;
  name?: string;
  description?: string;
  don?: ArmorDuration;
  doff?: ArmorDuration;
}
