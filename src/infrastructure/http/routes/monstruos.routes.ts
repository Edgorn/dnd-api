const express = require('express');
const router = express.Router();
import monstruosController from '../controllers/monstruos.controller';

router.get('/monsters', monstruosController.getMonsters);

module.exports = router;