import mongoose from "mongoose";
import connectDB from "./mongodb";
import { migrateCharacterDocumentFields } from "../../../utils/migrateCharacterDocumentFields";

const BATCH_SIZE = 500;
const COLLECTION = "characters";
const LEGACY_COLLECTION = "Personajes";

async function migrateCharacterFieldNames(): Promise<void> {
  await connectDB();
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error("No hay conexión a MongoDB. Revisa MONGODB_URI.");
  }

  const db = mongoose.connection.db;
  const characters = db.collection(COLLECTION);
  const scanned = await characters.countDocuments();

  if (scanned === 0) {
    const collections = await db.listCollections({ name: LEGACY_COLLECTION }).toArray();
    if (collections.length > 0) {
      throw new Error(
        `La colección ${COLLECTION} está vacía y sigue existiendo ${LEGACY_COLLECTION}. Renómbrala antes de migrar campos.`
      );
    }
    console.log(`[migrate:character-fields] ${COLLECTION} está vacía. Nada que migrar.`);
    return;
  }

  const cursor = characters.find({});
  const ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  let modified = 0;
  let skipped = 0;
  let seen = 0;

  const flush = async () => {
    if (ops.length === 0) return;
    const result = await characters.bulkWrite(ops.splice(0, ops.length), { ordered: false });
    modified += result.modifiedCount;
  };

  for await (const doc of cursor) {
    seen += 1;
    const migration = migrateCharacterDocumentFields(doc);
    if (!migration) {
      skipped += 1;
      continue;
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(migration.$set).length > 0) update.$set = migration.$set;
    if (Object.keys(migration.$unset).length > 0) update.$unset = migration.$unset;

    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update,
      },
    });

    if (ops.length >= BATCH_SIZE) {
      await flush();
    }
  }

  await flush();

  console.log(
    `[migrate:character-fields] scanned=${seen} modified=${modified} skipped=${skipped}`
  );
}

migrateCharacterFieldNames()
  .catch((error) => {
    console.error("[migrate:character-fields] Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
