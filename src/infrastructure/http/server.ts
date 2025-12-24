import express, { Application } from 'express';
import cors from 'cors';
import connectDB from '../databases/mongoDb/mongodb';

//Importacion de rutas
import userRoutes from "./routes/usuario.routes";
import transfondoRoutes from "./routes/transfondo.routes";
import razaRoutes from "./routes/raza.routes";
import claseRoutes from "./routes/clase.routes";
import personajeRoutes from "./routes/personaje.routes";
import equipamientoRoutes from "./routes/equipamiento.routes";
import campañaRoutes from "./routes/campaña.routes";
import criaturasRoutes from "./routes/criaturas.routes";
import npcsRoutes from "./routes/npcs.routes";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a la Base de Datos
connectDB();

// Rutas
app.use(userRoutes)
app.use(transfondoRoutes);
app.use(razaRoutes)
app.use(claseRoutes);
app.use(personajeRoutes)
app.use(equipamientoRoutes);
app.use(campañaRoutes)
app.use(criaturasRoutes);
app.use(npcsRoutes);

export const startServer = (port: number | string): void => {
  app.listen(port, () => {
    console.log(`🛡️  Servidor de D&D corriendo en http://localhost:${port}`);
  });
};

export default app;
