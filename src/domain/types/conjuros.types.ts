export interface ConjuroMongo {
  index: string,
  name: string,
  type: string,
  level: number,
  classes: string[],
  typeName: string,
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string[],
  ritual: boolean 
}

export interface ConjuroApi {
  index: string,
  name: string,
  type: string,
  level: number,
  classes: string[],
  typeName: string,
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string,
  ritual: boolean
}

export interface ChoiceSpell {
  choose: number,
  level: number,
  class: string
}