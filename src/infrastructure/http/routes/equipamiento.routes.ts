const express = require('express');
const router = express.Router();
import equipamientoController from '../controllers/equipamiento.controller';

router.get('/equipment/:type', equipamientoController.getEquipamientos);

module.exports = router;