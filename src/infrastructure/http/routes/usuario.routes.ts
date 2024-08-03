const express = require('express');
const router = express.Router();
import usuarioController from '../controllers/usuario.controller';

router.post('/login', usuarioController.login);

module.exports = router;