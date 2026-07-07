import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.MONGODB_URI;

if (!url) {
  console.error("❌ MONGODB_URI no está definido en el archivo .env");
  process.exit(1);
}

const collectionsToUpdate = ['attributes', 'skills', 'languages'];

async function main() {
  const client = new MongoClient(url as string);

  try {
    console.log("Conectando a MongoDB...");
    await client.connect();
    const db = client.db(); 
    console.log("✅ Conexión establecida.");

    for (const collectionName of collectionsToUpdate) {
      console.log(`\nProcesando colección: ${collectionName}...`);
      const collection = db.collection(collectionName);

      // Buscar documentos donde ruleset sea un array y tenga al menos un elemento
      const query = {
        ruleset: { $type: "array" }
      };

      const docsToUpdate = await collection.find(query).toArray();
      console.log(`Encontrados ${docsToUpdate.length} documentos con ruleset como array.`);

      let successCount = 0;
      let errorCount = 0;

      for (const doc of docsToUpdate) {
        try {
          // Tomamos el primer elemento del array como el ruleset principal
          const primaryRuleset = Array.isArray(doc.ruleset) && doc.ruleset.length > 0 
            ? doc.ruleset[0] 
            : ""; 
            
          await collection.updateOne(
            { _id: doc._id },
            { $set: { ruleset: primaryRuleset } }
          );
          
          successCount++;
        } catch (e) {
          console.error(`Error actualizando el documento con ID ${doc._id}:`, e);
          errorCount++;
        }
      }

      console.log(`Colección ${collectionName} finalizada. Éxitos: ${successCount}, Errores: ${errorCount}`);
    }

    console.log("\n🎉 Migración completada con éxito.");

  } catch (error) {
    console.error("❌ Ocurrió un error general:", error);
  } finally {
    await client.close();
    console.log("Conexión cerrada.");
  }
}

main();
