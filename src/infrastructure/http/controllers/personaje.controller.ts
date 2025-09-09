import ValidarToken from "../../../application/use-cases/usuario/validarToken.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import CrearPersonaje from "../../../application/use-cases/personaje/crearPersonaje.use-case";
import ObtenerPersonajesPorUsuario from "../../../application/use-cases/personaje/obtenerPersonajesPorUsuario.use-case";
import PersonajeService from "../../../domain/services/personaje.service";
import PersonajeRepository from "../../databases/mongoDb/repositories/personaje.repository";
import ConsultarPersonaje from "../../../application/use-cases/personaje/obtenerPersonajePorId.use-case";
import CambiarXp from "../../../application/use-cases/cambiarXp";
import SubirNivelDatos from "../../../application/use-cases/subirNivelDatos";
import SubirNivel from "../../../application/use-cases/subirNivel";
import AñadirEquipo from "../../../application/use-cases/personaje/añadirEquipo.use-case";
import EliminarEquipo from "../../../application/use-cases/personaje/eliminarEquipo.use-case";
import EquipArmor from "../../../application/use-cases/personaje/equiparArmadura.use-case.";
import CrearPdf from "../../../application/use-cases/personaje/obtenerPdf.use-case";
import UpdateMoney from "../../../application/use-cases/personaje/modificarDinero.use-case";
import { Request, Response } from "express";

import EquipamientoRepository from "../../databases/mongoDb/repositories/equipamiento.repository";
import RasgoRepository from "../../databases/mongoDb/repositories/rasgo.repository";
import CompetenciaRepository from "../../databases/mongoDb/repositories/competencia.repository";
import IdiomaRepository from "../../databases/mongoDb/repositories/idioma.repository";
import HabilidadRepository from "../../databases/mongoDb/repositories/habilidad.repository";
import ConjuroRepository from "../../databases/mongoDb/repositories/conjuros.repository";
import DoteRepository from "../../databases/mongoDb/repositories/dote.repository";

const competenciaRepository = new CompetenciaRepository()
const conjuroRepository = new ConjuroRepository()

const personajeRepository = new PersonajeRepository(
  new UsuarioRepository(),
  new EquipamientoRepository(),
  new RasgoRepository(undefined, competenciaRepository, conjuroRepository),
  competenciaRepository,
  new IdiomaRepository(),
  new HabilidadRepository(),
  conjuroRepository,
  new DoteRepository()
)

const personajeService = new PersonajeService(personajeRepository)

const obtenerPersonajesPorUsuario = new ObtenerPersonajesPorUsuario(personajeService);
const crearPersonaje = new CrearPersonaje(personajeService);
const consultarPersonaje = new ConsultarPersonaje(personajeService);

const cambiaXp = new CambiarXp(personajeService)
const subirNivelDatos = new SubirNivelDatos(personajeService)
const subirNivel = new SubirNivel(personajeService)
const añadirEquipo = new AñadirEquipo(personajeService);
const eliminarEquipo = new EliminarEquipo(personajeService);
const equipArmor = new EquipArmor(personajeService);
const updateMoney = new UpdateMoney(personajeService);
const crearPdf = new CrearPdf(personajeService);

const getCharacters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const data = await obtenerPersonajesPorUsuario.execute(userId)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al consultar personajes' });
  }
};

const createCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const data = await crearPersonaje.execute({ ...req.body, user: userId })
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear personaje' });
  }
};

const getCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del personaje' });
    }

    const data = await consultarPersonaje.execute(id, userId)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al consultar personajes' });
  }
};
 
const generarPdf = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del personaje' });
    }

    const data = await crearPdf.execute(id, userId)
    res.status(200).send(Buffer.from(data));
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al generar pdf de personaje' });
  }
};

const añadirEquipamiento = async (req: Request, res: Response) => {
  try {
    const data = await añadirEquipo.execute(req.body)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al añadir el equipamiento' });
  }
};

const eliminarEquipamiento = async (req: Request, res: Response) => {
  try {
    const data = await eliminarEquipo.execute(req.body)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al eliminar el equipamiento' });
  }
};

const equiparArmadura = async (req: Request, res: Response) => {
  try {
    const data = await equipArmor.execute(req.body)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al añadir el equipamiento' });
  }
};
 
const modificarDinero = async (req: Request, res: Response) => {
  try {
    const { id, money } = req.body
    
    const data = await updateMoney.execute(id, money)
    res.status(200).json(data);
    
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al modificar el dinero' });
  }
};


/**__________________________ */


const changeXp = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await cambiaXp.execute(req.body)

      if (success) {
        res.status(201).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al modificar experiencia' });
  }
};

const levelUpData = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await subirNivelDatos.execute(req.body)

      if (success) {
        res.status(201).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al modificar experiencia' });
  }
};

const levelUp = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await subirNivel.execute(req.body)

      if (success) {
        res.status(201).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al modificar experiencia' });
  }
};

export default { createCharacter, getCharacters, getCharacter, generarPdf, changeXp, levelUpData, levelUp, añadirEquipamiento, eliminarEquipamiento, equiparArmadura, modificarDinero };