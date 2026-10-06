import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from '../databases/mongoDb/mongodb';

//Importacion de rutas
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import backgroundRoutes from "./routes/background.routes";
import raceRoutes from "./routes/race.routes";
import characterClassRoutes from "./routes/characterClass.routes";
import personajeRoutes from "./routes/personaje.routes";
import equipmentRoutes from "./routes/equipment.routes";
import campaignRoutes from "./routes/campaign.routes";
import creatureRoutes from "./routes/creature.routes";
import npcsRoutes from "./routes/npcs.routes";
import spellRoutes from "./routes/spell.routes";
import traitsRoutes from "./routes/trait.routes";
import subclassRoutes from "./routes/subclass.routes";
import skillRoutes from "./routes/skill.routes";
import languageRoutes from "./routes/language.routes";
import featRoutes from "./routes/feat.routes";
import systemRoutes from "./routes/system.routes";
import attributeRoutes from "./routes/attribute.routes";
import proficiencyRoutes from "./routes/proficiency.routes";
import magicSchoolRoutes from "./routes/magicSchool.routes";
import damageRoutes from "./routes/damage.routes";
import coinRoutes from "./routes/coin.routes";
import propertyRoutes from "./routes/property.routes";
import armorTypeRoutes from "./routes/armorType.routes";
import creatureTypeRoutes from "./routes/creatureType.routes";
import conditionRoutes from "./routes/condition.routes";
import swaggerUi from 'swagger-ui-express';
import { tryLoadOpenApiSpec } from './config/loadOpenApiSpec';
import { errorHandler } from "./middlewares/errorHandler.middleware";

const app: Application = express();

// Middlewares
app.use(helmet());
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) ?? ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] ⚠️ Intento de acceso bloqueado desde el origen: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use(authRoutes);
app.use(userRoutes);
app.use(backgroundRoutes);
app.use(raceRoutes)
app.use(characterClassRoutes);
app.use(personajeRoutes)
app.use(equipmentRoutes);
app.use(campaignRoutes);
app.use(creatureRoutes);
app.use(npcsRoutes);
app.use(spellRoutes);
app.use(traitsRoutes);
app.use(subclassRoutes);
app.use(skillRoutes);
app.use(languageRoutes);
app.use(featRoutes);
app.use(systemRoutes);
app.use(attributeRoutes);
app.use(proficiencyRoutes);
app.use(magicSchoolRoutes);
app.use(damageRoutes);
app.use(coinRoutes);
app.use(propertyRoutes);
app.use(armorTypeRoutes);
app.use(creatureTypeRoutes);
app.use(conditionRoutes);

app.use(errorHandler);

const swaggerSpec = tryLoadOpenApiSpec();
if (swaggerSpec) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export const startServer = async (port: number | string): Promise<void> => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🛡️  Servidor de D&D corriendo en http://localhost:${port}`);
  });
};

export default app;
