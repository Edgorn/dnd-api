import ValidarToken from "../../../application/use-cases/validarToken";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository())
const validarToken = new ValidarToken(usuarioService)

import CrearPersonaje from "../../../application/use-cases/crearPersonaje";
import ConsultarPersonajes from "../../../application/use-cases/consultarPersonajes";
import PersonajeService from "../../../domain/services/personaje.service";
import PersonajeRepository from "../../databases/mongoDb/repositories/personaje.repository";
import ConsultarPersonaje from "../../../application/use-cases/consultarPersonaje";

const personajeService = new PersonajeService(new PersonajeRepository())
const crearPersonaje = new CrearPersonaje(personajeService);
const consultarPersonajes = new ConsultarPersonajes(personajeService);
const consultarPersonaje = new ConsultarPersonaje(personajeService);

const createCharacter = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await crearPersonaje.execute({ ...req.body, user: validToken })

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
    res.status(500).json({ error: 'Error al crear personaje' });
  }
};

const getCharacters = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await consultarPersonajes.execute(validToken)

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
    res.status(500).json({ error: 'Error al consultar personajes' });
  }
};

const getCharacter = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    const { id } = req.params;

    if (validToken && id) {
      const { success, data, message } = await consultarPersonaje.execute(validToken, id)

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
    res.status(500).json({ error: 'Error al consultar personajes' });
  }
};

export default { createCharacter, getCharacters, getCharacter };