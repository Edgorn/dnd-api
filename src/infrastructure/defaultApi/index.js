const express = require('express');
const router = express.Router();
const axios = require('axios');

router.use(async (req, res) => {
  if (req.originalUrl !== '/favicon.ico') {
    const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;
    try {
      const { status, data } = await axios({
        method: req.method,
        url: apiUrl,
        data: req.body,
        headers: { 'Content-Type': 'application/json' } 
      });
     
      res.status(status).json(data);
    } catch (error) {
      res.status(500).json({ error: "Error al procesar la consulta externa" });
    }
  }
});

module.exports = router;