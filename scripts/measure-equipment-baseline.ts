/**
 * Fase 0 baseline: cuenta consultas Mongoose y tiempos de los tres caminos
 * equivalentes a GET /equipment, GET /equipment/armor y GET /equipment/:id (pack).
 * No modifica el código de producción. Borrar tras medir.
 */
import mongoose from "mongoose";
import { mongoURI } from "../src/infrastructure/config/config";
import EquipmentModel from "../src/infrastructure/databases/mongoDb/schemas/Equipment";
import SystemRepository from "../src/infrastructure/databases/mongoDb/repositories/system.repository";
import DamageRepository from "../src/infrastructure/databases/mongoDb/repositories/damage.repository";
import PropertyRepository from "../src/infrastructure/databases/mongoDb/repositories/property.repository";
import ProficiencyRepository from "../src/infrastructure/databases/mongoDb/repositories/proficiency.repository";
import CoinRepository from "../src/infrastructure/databases/mongoDb/repositories/coin.repository";
import ArmorTypeRepository from "../src/infrastructure/databases/mongoDb/repositories/armorType.repository";
import EquipmentRepository from "../src/infrastructure/databases/mongoDb/repositories/equipment.repository";

type QueryLog = { collection?: string; op: string };

function createQueryCounter() {
  const logs: QueryLog[] = [];
  mongoose.set("debug", ((collectionName: string, methodName: string) => {
    logs.push({ collection: collectionName, op: methodName });
  }) as unknown as boolean);
  return {
    reset() {
      logs.length = 0;
    },
    count() {
      return logs.length;
    },
    byCollection() {
      const map = new Map<string, number>();
      for (const log of logs) {
        const key = `${log.collection ?? "?"}.${log.op}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    }
  };
}

async function measure<T>(label: string, counter: ReturnType<typeof createQueryCounter>, fn: () => Promise<T>) {
  counter.reset();
  const started = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - started;
  const queries = counter.count();
  const byCollection = counter.byCollection();
  return { label, elapsedMs, queries, byCollection, result };
}

function printMeasure(row: {
  label: string;
  elapsedMs: number;
  queries: number;
  byCollection: [string, number][];
  extra?: string;
}) {
  console.log(`\n=== ${row.label} ===`);
  console.log(`tiempo: ${row.elapsedMs.toFixed(0)} ms`);
  console.log(`consultas: ${row.queries}`);
  if (row.extra) console.log(row.extra);
  console.log("desglose:");
  for (const [key, n] of row.byCollection.slice(0, 15)) {
    console.log(`  ${n}\t${key}`);
  }
}

async function main() {
  if (!mongoURI) {
    throw new Error("MONGODB_URI no está definida");
  }

  await mongoose.connect(mongoURI);
  const counter = createQueryCounter();

  const systemRepository = new SystemRepository();
  const damageRepository = new DamageRepository(systemRepository);
  const propertyRepository = new PropertyRepository(systemRepository);
  const proficiencyRepository = new ProficiencyRepository(systemRepository);
  const coinRepository = new CoinRepository(systemRepository);
  const armorTypeRepository = new ArmorTypeRepository(systemRepository);
  const equipmentRepository = new EquipmentRepository(
    systemRepository,
    damageRepository,
    propertyRepository,
    proficiencyRepository,
    coinRepository,
    armorTypeRepository
  );

  const catalogStats = await EquipmentModel.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: "$ruleset",
        count: { $sum: 1 },
        withWeapon: { $sum: { $cond: [{ $ifNull: ["$weapon", false] }, 1, 0] } },
        withArmor: { $sum: { $cond: [{ $ifNull: ["$armor", false] }, 1, 0] } },
        withContent: {
          $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$content", []] } }, 0] }, 1, 0] }
        },
        withProfs: {
          $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$proficiencies", []] } }, 0] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  console.log("Equipamientos activos por ruleset:");
  for (const row of catalogStats) {
    console.log(
      `  ${row.count} total | weapon=${row.withWeapon} armor=${row.withArmor} content=${row.withContent} profs=${row.withProfs} | ${row._id}`
    );
  }

  const topRuleset = catalogStats[0]?._id as string | undefined;
  if (!topRuleset) {
    throw new Error("No hay equipamientos activos para medir");
  }

  const pack = await EquipmentModel.findOne({
    deletedAt: null,
    ruleset: topRuleset,
    content: { $exists: true, $ne: [] }
  })
    .select({ name: 1, content: 1, ruleset: 1 })
    .lean();

  const fallbackPack = pack
    ? null
    : await EquipmentModel.findOne({
        deletedAt: null,
        content: { $exists: true, $ne: [] }
      })
        .select({ name: 1, content: 1, ruleset: 1 })
        .lean();

  const packDoc = pack ?? fallbackPack;
  const rulesets = [topRuleset];

  // Calentamiento: la primera pasada incluye JIT y caché de sockets de Mongo.
  await equipmentRepository.getArmor(rulesets);

  const list = await measure("getBySystems (GET /equipment)", counter, () =>
    equipmentRepository.getBySystems(rulesets)
  );
  printMeasure({
    ...list,
    extra: `ruleset=${topRuleset} objetos=${list.result.length}`
  });

  const armor = await measure("getArmor (GET /equipment/armor)", counter, () =>
    equipmentRepository.getArmor(rulesets)
  );
  printMeasure({
    ...armor,
    extra: `ruleset=${topRuleset} objetos=${armor.result.length}`
  });

  if (!packDoc) {
    console.log("\n=== getById (GET /equipment/:id pack) ===");
    console.log("No hay packs (content no vacío) para medir.");
  } else {
    const packId = packDoc._id.toString();
    const byId = await measure(`getById pack (GET /equipment/${packId})`, counter, () =>
      equipmentRepository.getById(packId)
    );
    printMeasure({
      ...byId,
      extra: `pack="${packDoc.name}" content=${Array.isArray(packDoc.content) ? packDoc.content.length : 0} ruleset=${packDoc.ruleset}`
    });
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
