const express = require('express');
const router = express.Router();
import claseController from '../controllers/clase.controller';

router.get('/clases', claseController.getClases);

module.exports = router;