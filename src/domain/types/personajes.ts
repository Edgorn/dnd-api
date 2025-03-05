export interface PersonajeBasico {
  id: string,
  img: string,
  name: string,
  race: string,
  campaign: string | null,
  classes: {
    name: string,
    level: number
  } [],
  CA: number,
  HPMax: number,
  HPActual: number,
  XP: number,
  XPMax: number
}