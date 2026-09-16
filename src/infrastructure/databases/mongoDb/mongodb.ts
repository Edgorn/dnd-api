import mongoose from "mongoose";
import { mongoURI } from "../../config/config";

const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
      return;
    }

    await mongoose.connect(mongoURI);
    console.log('🚀 Conexión a MongoDB exitosa');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB', err);
  }
};

export default connectDB;
