const express = require('express');
const router = express.Router();
import campañaController from '../controllers/campaña.controller';

router.post('/campaign', campañaController.createCampaign);
router.get('/campaigns', campañaController.getCampaign);

module.exports = router;