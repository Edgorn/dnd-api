const express = require('express');
const router = express.Router();
import campañaController from '../controllers/campaña.controller';

router.post('/campaign', campañaController.createCampaign);
router.post('/entryCampaign', campañaController.entryCampaign);
router.get('/campaign', campañaController.getCampaign);
router.get('/campaign/:id', campañaController.getCampaign);

module.exports = router;