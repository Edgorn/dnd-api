import { Request, Response } from "express";

import EquipamientoRepository from "../../databases/mongoDb/repositories/equipamiento.repository";
import EquipamientoService from "../../../domain/services/equipamiento.service";
import ConsultarEquipamientos from "../../../application/use-cases/equipamiento/obtenerEquipamientosPorTipo.use-case";

const equipamientoService = new EquipamientoService(new EquipamientoRepository)
const consultarEquipamientos = new ConsultarEquipamientos(equipamientoService);

const getEquipamientos = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ error: 'Se requiere el tipo del equipamiento' });
    }

    const data = await consultarEquipamientos.execute(type)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al consultar equipamiento' });
  }
};

export default { getEquipamientos };