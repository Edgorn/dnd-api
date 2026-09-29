import { z } from "zod";
import { CREATURE_ANY_RACE, CREATURE_ATTACK_KINDS, CREATURE_USAGE_TYPES } from "../../../domain/types/creature.types";
import { GrantedEquipmentListSchema } from "./equipment.schema";

const ChoiceMongoSchema = z.object({
  choose: z.number().int().min(1, "Debe elegir al menos 1"),
  options: z.array(z.string()).optional(),
  filter: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.array(z.union([z.string(), z.number()]))
  ])).optional()
});

/** Movement speeds are stored in feet. */
const SpeedSchema = z.object({
  walk: z.number().nonnegative("La velocidad a pie no puede ser negativa"),
  fly: z.number().nonnegative().optional(),
  climb: z.number().nonnegative().optional(),
  swim: z.number().nonnegative().optional(),
  burrow: z.number().nonnegative().optional()
}).strict();

const ArmorClassSchema = z.object({
  value: z.number(),
  notes: z.string().optional()
}).strict();

/** Sense distances are stored in feet. */
const SensesSchema = z.object({
  darkvision: z.number().nonnegative().optional(),
  blindsight: z.number().nonnegative().optional(),
  tremorsense: z.number().nonnegative().optional(),
  truesight: z.number().nonnegative().optional(),
  passive_perception: z.number().optional(),
  notes: z.string().optional()
}).strict();

const DamageRollSchema = z.object({
  dice: z.string().min(1, "Los dados de daño no pueden estar vacíos"),
  bonus: z.number().optional(),
  damageTypeId: z.string().min(1, "El tipo de daño es obligatorio")
}).strict();

/** Reach and range are stored in feet. */
const AttackSchema = z.object({
  kind: z.enum(CREATURE_ATTACK_KINDS),
  attributeKey: z.string().min(1).optional(),
  bonus: z.number().optional(),
  reach: z.number().nonnegative().optional(),
  range: z.object({
    normal: z.number().nonnegative(),
    long: z.number().nonnegative().optional()
  }).strict().optional(),
  targets: z.string().optional(),
  equipmentId: z.string().optional(),
  damage: z.array(DamageRollSchema)
}).strict();

const UsageSchema = z.object({
  type: z.enum(CREATURE_USAGE_TYPES),
  value: z.union([z.number(), z.string()]).optional()
}).strict();

const FeatureSchema = z.object({
  name: z.string().min(1, "El nombre del rasgo no puede estar vacío"),
  description: z.array(z.string()),
  usage: UsageSchema.optional(),
  attack: AttackSchema.optional(),
  cost: z.number().int().nonnegative().optional()
}).strict();

const SpellcastingSchema = z.object({
  casterLevel: z.number().int().min(1, "El nivel de lanzador debe ser al menos 1").optional(),
  abilityId: z.string().min(1, "La aptitud mágica no puede estar vacía").optional(),
  spellSaveDc: z.number().int("La CD de salvación de conjuros debe ser un entero").optional(),
  spellAttackBonus: z.number().int("El bonificador de ataque de conjuros debe ser un entero").optional(),
  slots: z.record(z.string(), z.number().int().nonnegative("Las ranuras de conjuro no pueden ser negativas")),
  spells: z.array(z.string().min(1, "El identificador del conjuro no puede estar vacío"))
}).strict();

const InnateSpellGroupSchema = z.object({
  usage: UsageSchema,
  spells: z.array(z.string().min(1, "El identificador del conjuro no puede estar vacío"))
    .min(1, "Cada grupo de conjuros innatos debe tener al menos un conjuro")
}).strict().superRefine((group, ctx) => {
  if (group.usage.type !== "perDay") return;
  const value = group.usage.value;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    ctx.addIssue({
      code: "custom",
      path: ["usage", "value"],
      message: "Los usos por día deben ser un entero mayor o igual que 1"
    });
  }
});

const InnateSpellcastingSchema = z.object({
  abilityId: z.string().min(1, "La aptitud mágica no puede estar vacía").optional(),
  spellSaveDc: z.number().int("La CD de salvación de conjuros debe ser un entero").optional(),
  spellAttackBonus: z.number().int("El bonificador de ataque de conjuros debe ser un entero").optional(),
  spells: z.array(InnateSpellGroupSchema)
}).strict();

const LanguagesSchema = z.object({
  speaks: z.array(z.string()).optional(),
  understands: z.array(z.string()).optional(),
  notes: z.string().optional()
}).strict();

export const CreateCreatureSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  img: z.string().nullable().optional(),
  description: z.array(z.string()).optional(),
  creatureTypeId: z.string().min(1, "El tipo de criatura es obligatorio"),
  race: z.union([z.literal(CREATURE_ANY_RACE), z.string().min(1)]).nullable().optional(),
  size: z.string().min(1, "El tamaño no puede estar vacío"),
  alignment: z.string().min(1, "El alineamiento no puede estar vacío"),
  armor_class: ArmorClassSchema.nullable().optional(),
  HPMax: z.number().int().nonnegative("Los puntos de golpe no pueden ser negativos"),
  hit_dice: z.string().nullable().optional(),
  speed: SpeedSchema,
  attributes: z.array(z.object({
    key: z.string().min(1),
    value: z.number()
  }).strict()).optional(),
  saving_throws: z.array(z.string()).optional(),
  skill_bonuses: z.array(z.object({
    skillId: z.string().min(1),
    bonus: z.number()
  }).strict()).nullable().optional(),
  senses: SensesSchema.nullable().optional(),
  languages: LanguagesSchema.nullable().optional(),
  language_choices: ChoiceMongoSchema.nullable().optional(),
  challenge_rating: z.number().nonnegative(),
  xp: z.number().int().nonnegative(),
  prof_bonus: z.number().int().nonnegative(),
  damage_vulnerabilities: z.array(z.string()).optional(),
  damage_immunities: z.array(z.string()).optional(),
  damage_resistances: z.array(z.string()).optional(),
  condition_immunities: z.array(z.string()).optional(),
  special_abilities: z.array(FeatureSchema).optional(),
  spellcasting: SpellcastingSchema.nullable().optional(),
  innateSpellcasting: InnateSpellcastingSchema.nullable().optional(),
  actions: z.array(FeatureSchema).optional(),
  bonus_actions: z.array(FeatureSchema).optional(),
  reactions: z.array(FeatureSchema).optional(),
  legendary_actions: z.object({
    uses: z.number().int().nonnegative(),
    description: z.array(z.string()).optional(),
    actions: z.array(FeatureSchema)
  }).strict().nullable().optional(),
  equipment: GrantedEquipmentListSchema.nullable().optional()
}).strict();

export const UpdateCreatureSchema = CreateCreatureSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un campo para modificar" }
);

export const GetCreaturesQuerySchema = z.object({
  ruleset: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
  creatureTypeId: z.string().min(1).optional()
});

export type CreateCreatureInput = z.infer<typeof CreateCreatureSchema>;
export type UpdateCreatureInput = z.infer<typeof UpdateCreatureSchema>;
