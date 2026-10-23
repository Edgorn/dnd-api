export function applyHpDamage(hpActual: number, amount: number): number {
  return Math.max(0, hpActual - amount);
}

export function applyHpHeal(hpActual: number, hpMax: number, amount: number): number {
  return Math.min(hpMax, hpActual + amount);
}
