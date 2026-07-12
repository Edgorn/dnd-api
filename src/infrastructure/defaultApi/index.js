const express = require('express');
const router = express.Router();

router.use(async (req, res) => {
  if (req.originalUrl !== '/favicon.ico') {
    const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;
    try {
      const options = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(apiUrl, options);
      const data = await response.json();
      
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: "Error al procesar la consulta externa" });
    }
  }
});

module.exports = router;