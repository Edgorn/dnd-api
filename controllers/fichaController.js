const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const Raza = require('../models/razaModel');
const Rasgo = require('../models/rasgoModel');

const { listTraits, escribirHeaders, firstPage, escribirRasgos, escribirCompetencias, escribirSkills, escribirConjuros, escribirAtaques, listSpells, listSkills, listProficiencies, listLanguages } = require('../helpers/fichaHelpers');

async function crearFicha(req, res) {
  const { race, subrace } = req.body

  const raza = await Raza.find({ index: race });
  const subraza = raza[0]?.subraces?.find(srace => srace.index === subrace)

  const rasgos = await Rasgo.find();

  const spells = listSpells({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const traits = listTraits({ raza: raza[0] ?? null, subraza: subraza ?? null })
  const skills = listSkills({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const proficiencies = listProficiencies({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const languages = listLanguages({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })

  const existingPdfBytes = fs.readFileSync('./hoja.pdf');

  try {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    //form.getCheckBox('').

    await escribirHeaders({ character: req.body, form, raza: raza[0] })
    await firstPage({ character: req.body, form, raza: raza[0] })
    await escribirConjuros({ spells, form })
    await escribirAtaques({ pdfDoc, traits, rasgos })
    await escribirSkills({ skills, form })
    await escribirRasgos({ form, traits, rasgos, pdfDoc })
    await escribirCompetencias({ form, traits, rasgos, pdfDoc, proficiencies, languages })
/*
    const fields = form.getFields();

    fields.forEach((field, index) => {
      const type = field.constructor.name;

      if (type === 'PDFTextField') {
        console.log(`Tipo: ${type}`);
        console.log('-' + field.getName() + '-');
        console.log('____________')
      }
    });
*/
    //form.flatten();

    const pdfBytes = await pdfDoc.save();

    // Envía el PDF como archivo
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al modificar el PDF');
  }
};

module.exports = {
  crearFicha,
};