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
import CambiarXp from "../../../application/use-cases/cambiarXp";
import SubirNivelDatos from "../../../application/use-cases/subirNivelDatos";
import SubirNivel from "../../../application/use-cases/subirNivel";
import AñadirEquipo from "../../../application/use-cases/añadirEquipo";
import EliminarEquipo from "../../../application/use-cases/eliminarEquipo";
import EquipArmor from "../../../application/use-cases/equipArmor";
import CrearPdf from "../../../application/use-cases/crearPdf";
import UpdateMoney from "../../../application/use-cases/updateMoney";

const personajeService = new PersonajeService(new PersonajeRepository())

const crearPersonaje = new CrearPersonaje(personajeService);
const consultarPersonajes = new ConsultarPersonajes(personajeService);
const consultarPersonaje = new ConsultarPersonaje(personajeService);
const cambiaXp = new CambiarXp(personajeService)
const subirNivelDatos = new SubirNivelDatos(personajeService)
const subirNivel = new SubirNivel(personajeService)
const añadirEquipo = new AñadirEquipo(personajeService);
const eliminarEquipo = new EliminarEquipo(personajeService);
const equipArmor = new EquipArmor(personajeService);
const updateMoney = new UpdateMoney(personajeService);
const crearPdf = new CrearPdf(personajeService);

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

const añadirEquipamiento = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await añadirEquipo.execute(req.body)

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al añadir el equipamiento' });
  }
};

const eliminarEquipamiento = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await eliminarEquipo.execute(req.body)

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al añadir el equipamiento' });
  }
};

const equiparArmadura = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { success, data, message } = await equipArmor.execute(req.body)

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al añadir el equipamiento' });
  }
};
 
const modificarDinero = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const validToken = await validarToken.execute(token)

    if (validToken) {
      const { id, money } = req.body
      
      const { success, message } = await updateMoney.execute(id, money)

      if (success) { 
        res.status(200).json({});
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al modificar el dinero' });
  }
};
 
const generarPdf = async (req: any, res: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    const idUser = await validarToken.execute(token)

    const { id } = req.params;

    if (idUser && id) {
      const { success, data, message } = await crearPdf.execute(idUser, id)

      if (success) {
        res.setHeader('Content-Type', 'application/pdf');

        // Enviar el PDF editado como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=edited.pdf');
        res.status(200).send(Buffer.from(data));
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al generar pdf de personaje' });
  }
};

export default { createCharacter, getCharacters, getCharacter, changeXp, levelUpData, levelUp, añadirEquipamiento, eliminarEquipamiento, equiparArmadura, modificarDinero, generarPdf };