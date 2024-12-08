const express = require('express');
const router = express.Router();
import transfondoController from '../controllers/transfondo.controller';

router.get('/transfondos', transfondoController.getTransfondos);

module.exports = router;