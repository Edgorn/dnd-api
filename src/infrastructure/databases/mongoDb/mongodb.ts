import mongoose from "mongoose";
import { mongoURI } from "../../config/config";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoURI)
    console.log('🚀 Conexión a MongoDB exitosa');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB', err);
  }
};

export default connectDB;