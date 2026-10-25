import mongoose from "mongoose";
import connectDB from "./mongodb";
import { characterRepository } from "../../dependencies";

async function migrateCharacterAc(): Promise<void> {
  await connectDB();
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error("No hay conexión a MongoDB. Revisa MONGODB_URI.");
  }

  const { scanned, modified } = await characterRepository.backfillMissingArmorClass();
  console.log(`[migrate:character-ac] scanned=${scanned} modified=${modified}`);
}

migrateCharacterAc()
  .catch((error) => {
    console.error("[migrate:character-ac] Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
