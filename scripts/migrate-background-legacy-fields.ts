import mongoose from "mongoose";
import { mongoURI } from "../src/infrastructure/config/config";
import { BackgroundTable } from "../src/domain/types/background.types";

interface LegacyOptionsName {
  name?: string;
  choose?: number;
  options?: string[];
}

interface BackgroundDoc {
  _id: unknown;
  tables?: BackgroundTable[];
  options_name?: LegacyOptionsName;
}

function synthesizeTablesFromLegacy(legacy: LegacyOptionsName): BackgroundTable[] | null {
  if (!legacy || typeof legacy !== "object") {
    return null;
  }
  const legacyOptions = legacy.options;
  if (!Array.isArray(legacyOptions) || legacyOptions.length === 0) {
    return null;
  }
  const maxChoose = legacy.choose ?? 1;
  return [{
    name: legacy.name ?? "",
    choose: { min: 1, max: maxChoose },
    options: legacyOptions.map(label => ({ label }))
  }];
}

function needsTablesMigration(doc: BackgroundDoc): boolean {
  const stored = doc.tables;
  const hasStoredTables = Array.isArray(stored) && stored.length > 0;
  if (hasStoredTables) {
    return false;
  }
  return synthesizeTablesFromLegacy(doc.options_name ?? {}) !== null;
}

async function main(): Promise<void> {
  if (!mongoURI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  const collection = mongoose.connection.collection("backgrounds");

  const cursor = collection.find({});
  let migratedTables = 0;
  let unsetFields = 0;

  for await (const raw of cursor) {
    const doc = raw as BackgroundDoc;
    const update: Record<string, unknown> = {};
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {
      options_name: 1,
      personalized_equipment: 1
    };

    if (needsTablesMigration(doc)) {
      const tables = synthesizeTablesFromLegacy(doc.options_name ?? {});
      if (tables) {
        $set.tables = tables;
        migratedTables += 1;
      }
    }

    if (Object.keys($set).length > 0) {
      update.$set = $set;
    }
    update.$unset = $unset;

    await collection.updateOne({ _id: doc._id }, update);
    unsetFields += 1;
  }

  console.log(`Processed ${unsetFields} background(s). Migrated tables from options_name: ${migratedTables}.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
