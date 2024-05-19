const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const razaRoutes = require('./routes/razaRoutes');
const claseRoutes = require('./routes/claseRoutes');
const transfondoRoutes = require('./routes/transfondoRoutes');
const habilidadRoutes = require('./routes/habilidadRoutes');
const idiomaRoutes = require('./routes/idiomaRoutes');
const competenciaRoutes = require('./routes/competenciaRoutes');
const rasgoRoutes = require('./routes/rasgoRoutes');
const axios = require('axios');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const Raza = require('./models/razaModel');
const Rasgo = require('./models/rasgoModel');
const Idioma = require('./models/idiomaModel');
const Competencia = require('./models/competenciaModel');

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
app.use(rasgoRoutes);

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

app.post('/crearFicha', async (req, res) => {

  const { race } = req.body

  const raza = await Raza.find({ index: race });
  const rasgos = await Rasgo.find();

  const traits = listTraits({ character: req.body, raza: raza[0] ?? null})

  const existingPdfBytes = fs.readFileSync('./hoja.pdf');

  try {

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    console.log(req.body)

    await escribirHeaders({ character: req.body, form, raza: raza[0] })
    await firstPage({ character: req.body, form, raza: raza[0], traits })
    await escribirRasgos({ form, traits, rasgos, pdfDoc })
    await escribirCompetencias({ form, traits, rasgos, pdfDoc, character: req.body })

    const fields = form.getFields();

    fields.forEach(field => {
      const type = field.constructor.name;

      console.log(`Tipo: ${type}`);
      console.log('-' + field.getName() + '-');
      console.log('____________')
      
    });

    //form.flatten();

    const pdfBytes = await pdfDoc.save();

    // Envía el PDF como archivo
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al modificar el PDF');
  }
});

function listTraits({ character, raza }) {

  const { subrace } = character  
  const subraza = raza?.subraces?.find(srace => srace.index === subrace)

  const race = subraza?.name ?? raza?.name ?? ''

  return {
    raceName: race,
    raceTraits: [ ...raza?.traits ?? [], ...subraza?.traits ?? [] ]
  }
}

function escribirHeaders({character, form, raza}) {
  const {
    name='',
    level=1,
    experiencePoints=0,
    playerName='',
    appearance={},
    subrace
  } = character;

  const subraza = raza?.subraces?.find(srace => srace.index === subrace)
  const race = subraza?.name ?? raza?.name ?? ''

  form.getTextField('CharacterName').setText(name)
  form.getTextField('CharacterName 2').setText(name)

  form.getTextField('ClassLevel').setText('' + level)
  form.getTextField('PlayerName').setText(playerName)
  form.getTextField('Race ').setText(race)
  form.getTextField('XP').setText(experiencePoints + '/' + nivel[level-1])

  const { age='', height='', weight='', eyes='', hair='', skin='' } = appearance

  form.getTextField('Age').setText(age ? age + ' años' : '')
  form.getTextField('Weight').setText(height ? height + ' cm' : '')
  form.getTextField('Height').setText(weight ? weight + ' kg' : '')
  form.getTextField('Eyes').setText(eyes)
  form.getTextField('Skin').setText(skin)
  form.getTextField('Hair').setText(hair)
}

function firstPage({character, form, raza, traits}) {
  form.getTextField('Speed').setText(raza?.speed + ' pies')
  /*let CA = 10

  if (traits?.raceTraits?.includes('dwarven-toughness')) {
    CA += character?.level ?? 1
  }*/
}

async function escribirRasgos({ form, traits, rasgos, pdfDoc}) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontSize = 8;  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lineSpacing = 8;
  let textY = page1.getHeight() - 395;
/*
  page1.drawText(traits?.raceName+'', {
    x: 415,
    y: textY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  textY -= (lineSpacing + 1);
*/
  let x = 415

  const maxWidth = 160;

  traits?.raceTraits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
    
    if (rasgo?.type !== 'proficiency') {
      const textWidth = fontRegular.widthOfTextAtSize(rasgo?.name + '..|.', fontSize);

      const texto = rasgo?.name + ': ' + rasgo?.desc?.join('\n')
      const wrappedLines = wrapText(texto, fontRegular, fontSize, maxWidth);

      wrappedLines.forEach((wrappedLine, index) => {
        if (index === 0) {
          
          page1.drawText(rasgo?.name + '. ', {
            x: x,
            y: textY,
            size: fontSize,
            font: fontBold,
            color: rgb(0, 0, 0)
          });
          
          page1.drawText(wrappedLine.split(': ')[1], {
            x: x + textWidth,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;

        } else {
          page1.drawText(wrappedLine, {
            x: x,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;
        }
      });
      
      textY -= 3;
/*
      page1.drawText('- ' + rasgo?.name ?? '', {
        x: 415,
        y: textY,
        size: fontSize,
        font: fontRegular,
        color: rgb(0, 0, 0)
      });
  
      textY -= lineSpacing;*/
    }
  })
/*
  const page2 = pages[1]
  textY = page2.getHeight() - 380
  let x = 225

  const maxWidth2 = 340;

  traits?.raceTraits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
 
    if (rasgo?.sum_desc && rasgo?.type !== 'proficiency') {
      const textWidth = fontRegular.widthOfTextAtSize(rasgo?.name + '..|.', fontSize);

      const texto = rasgo?.name + ': ' + rasgo?.desc?.join('\n')
      const wrappedLines = wrapText(texto, fontRegular, fontSize, maxWidth2);

      wrappedLines.forEach((wrappedLine, index) => {
        if (index === 0) {
          
          page2.drawText(rasgo?.name + '. ', {
            x: x,
            y: textY,
            size: fontSize,
            font: fontBold,
            color: rgb(0, 0, 0)
          });
          
          page2.drawText(wrappedLine.split(': ')[1], {
            x: x + textWidth,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;

        } else {
          page2.drawText(wrappedLine, {
            x: x,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;
        }
      });
    }

    textY -= 3;
  })
*/
  form.getTextField('Features and Traits').setText('');
  form.flatten();
}

async function escribirCompetencias({ traits, rasgos, pdfDoc, character }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontSize = 8;  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lineSpacing = 8;
  let textY = page1.getHeight() - 635;
  let x = 35

  const maxWidth = 160;

  // INICIO COMPETENCIAS
  const competencias = await Competencia.find();
  const listaCompetencias = []

  character?.proficiencies.forEach(proficiency => {
    const competencia = competencias.find(i => i.index === proficiency)
    listaCompetencias.push(competencia.name)
  })

  const texto = 'Competencias: ' + listaCompetencias?.join(', ')
  const wrappedLines = wrapText(texto, fontRegular, fontSize, maxWidth);

  wrappedLines.forEach((wrappedLine, index) => {
    if (index === 0) {
      page1.drawText('Competencias. ', {
        x: x,
        y: textY,
        size: fontSize,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
      
      page1.drawText(wrappedLine.split(': ')[1], {
        x: x + 58,
        y: textY,
        size: fontSize,
        font: fontRegular,
        color: rgb(0, 0, 0)
      });
      textY -= lineSpacing;

    } else {
      page1.drawText(wrappedLine, {
        x: x,
        y: textY,
        size: fontSize,
        font: fontRegular,
        color: rgb(0, 0, 0)
      });
      textY -= lineSpacing;
    }
  })

  textY -= 3;
  // FIN COMPETENCIAS

  //  INICIO IDIOMAS
  const idiomas = await Idioma.find();
  const listaIdiomas = []

  character?.languages.forEach(language => {
    const idioma = idiomas.find(i => i.index === language)
    listaIdiomas.push(idioma.name)
  })

  page1.drawText('Idiomas. ', {
    x: x,
    y: textY,
    size: fontSize,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
  
  page1.drawText(listaIdiomas.join(', '), {
    x: x + 34,
    y: textY,
    size: fontSize,
    font: fontRegular,
    color: rgb(0, 0, 0)
  });

  textY -= lineSpacing + 3;
  //  FIN IDIOMAS

  traits?.raceTraits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
    
    if (rasgo?.type === 'proficiency') {
      const textWidth = fontRegular.widthOfTextAtSize(rasgo?.name + '..|.', fontSize);

      const texto = rasgo?.name + ': ' + rasgo?.desc?.join('\n')
      const wrappedLines = wrapText(texto, fontRegular, fontSize, maxWidth);

      wrappedLines.forEach((wrappedLine, index) => {
        if (index === 0) {
          page1.drawText(rasgo?.name + '. ', {
            x: x,
            y: textY,
            size: fontSize,
            font: fontBold,
            color: rgb(0, 0, 0)
          });
          
          page1.drawText(wrappedLine.split(': ')[1], {
            x: x + textWidth,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;

        } else {
          page1.drawText(wrappedLine, {
            x: x,
            y: textY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0, 0, 0)
          });
          textY -= lineSpacing;
        }
      })
    }
  })
}

function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine); // Añade la última línea
  return lines;
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
