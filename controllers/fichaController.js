const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const Raza = require('../src/infrastructure/databases/mongoDb/schemas/Raza');
const Rasgo = require('../src/infrastructure/databases/mongoDb/schemas/Rasgo');
const Clase = require('../src/infrastructure/databases/mongoDb/schemas/Clase');

const { listTraits, escribirHeaders, firstPage, escribirRasgos, escribirCompetencias, escribirSkills, escribirConjuros, escribirAtaques, listSpells, listSkills, listProficiencies, listLanguages, listEquipment, escribirEquipamientos, escribirArmas, escribirTesoro, escribirEquipamiento } = require('../helpers/fichaHelpers');
const Competencia = require('../src/infrastructure/databases/mongoDb/schemas/Competencia');
const Equipamiento = require('../src/infrastructure/databases/mongoDb/schemas/Equipamiento');

async function crearFicha(req, res) {
  const { race, subrace, class: clas, level, subclass, terrain } = req.body

  const raza = await Raza.find({ index: race });
  const subraza = raza[0]?.subraces?.find(srace => srace.index === subrace)

  const clase = await Clase.find({ index: clas })
  const rasgos = await Rasgo.find();
  const competencias = await Competencia.find();
  const equipamientos = await Equipamiento.find()

  const spells = listSpells({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const traits = listTraits({ raza: raza[0] ?? null, subraza: subraza ?? null, clase: clase[0], level, subclass })
  const skills = listSkills({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const proficiencies = listProficiencies({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null, clase: clase[0], competencias })
  const languages = listLanguages({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const { equipment, weapons, musical, armors, municion } = listEquipment({ character: req.body, clase: clase[0], equipamientos })

  const existingPdfBytes = fs.readFileSync('./hoja-nueva.pdf');

  try {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
/*
    const fields = form.getFields();

    fields.forEach((field, index) => {
      const type = field.constructor.name;

      if (type === 'PDFTextField') {
        //if (index > 0 && index < 10) {
          console.log(`Tipo: ${type}`);
          console.log('-' + field.getName() + '-');
          //field.setText('1')
        //}
      }
    });*/

    await escribirHeaders({ character: req.body, form, raza: raza[0], clase: clase[0] })  //Rellena datos
    await firstPage({ character: req.body, form, raza: raza[0], clase: clase[0], traits })  //Rellena datos
    await escribirSkills({ character: req.body, skills, form, clase: clase[0] })
    await escribirRasgos({ traits, rasgos, pdfDoc, terrain })
    await escribirCompetencias({ form, traits, rasgos, pdfDoc, proficiencies, languages, competencias: competencias })
    await escribirTesoro({ pdfDoc, equipment })
    await escribirEquipamiento({ pdfDoc, weapons, musical, armors, traits, rasgos, municion })
    await escribirConjuros({ spells, form, clase: clase[0], character: req.body })

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