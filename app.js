const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const razaRoutes = require('./routes/razaRoutes');
const claseRoutes = require('./routes/claseRoutes');
const transfondoRoutes = require('./routes/transfondoRoutes');
const habilidadRoutes = require('./routes/habilidadRoutes');
const idiomaRoutes = require('./routes/idiomaRoutes');
const competenciaRoutes = require('./routes/competenciaRoutes');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use(razaRoutes);
app.use(claseRoutes);
app.use(transfondoRoutes);
app.use(habilidadRoutes);
app.use(idiomaRoutes);
app.use(competenciaRoutes);


const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]


app.post('/crearFicha', async (req, res) => {
  const {
    name='',
    level=1,
    experiencePoints=0,
    playerName='',
    appearance
  } = req.body;

  const existingPdfBytes = fs.readFileSync('./hoja.pdf');

  try {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();

    console.log(req.body)

    escribirHeaders(req.body, form)
/*
    const fields = form.getFields();

    fields.forEach(field => {
      const type = field.constructor.name;

      if (type === 'PDFTextField') {
        console.log(`Tipo: ${type}`);
        console.log(field.getName());
        console.log('____________')
      }
      
      form.flattenField(field.getName());

    });
*/
    const pdfBytes = await pdfDoc.save();

    // Envía el PDF como archivo
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).send('Error al modificar el PDF');
  }
});

function escribirHeaders(character, form) {
  const {
    name='',
    level=1,
    experiencePoints=0,
    playerName='',
    appearance={}
  } = character;

  form.getTextField('CharacterName').setText(name)
  form.getTextField('CharacterName 2').setText(name)

  form.getTextField('ClassLevel').setText('nvl ' + level)
  form.getTextField('PlayerName').setText(playerName)
  form.getTextField('XP').setText(experiencePoints + '/' + nivel[level-1])

  const { age='', height='', weight='', eyes='', heir='', skin='' } = appearance

  form.getTextField('Age').setText(age ? age + ' años' : '')
  form.getTextField('Weight').setText(height ? height + ' cm' : '')
  form.getTextField('Height').setText(weight ? weight + ' kg' : '')
  form.getTextField('Eyes').setText(eyes)
  form.getTextField('Skin').setText(heir)
  form.getTextField('Hair').setText(skin)
}

app.use(async (req, res) => {
  if (req.originalUrl !== '/favicon.ico') {
    const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;

    console.log(apiUrl)
  
    try {
      const response = await axios({
        method: req.method,
        url: apiUrl,
        data: req.body,
        headers: { 'Content-Type': 'application/json' } 
      });
  
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Error al procesar la consulta externa" });
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
