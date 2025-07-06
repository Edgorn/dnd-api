const express = require('express');
const router = express.Router();
import npcs from '../controllers/npcs.controller';

router.get('/npcs', npcs.getNpcs);

module.exports = router;