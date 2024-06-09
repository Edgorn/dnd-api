const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const Raza = require('../models/razaModel');
const Rasgo = require('../models/rasgoModel');
const Clase = require('../models/claseModel');

const { listTraits, escribirHeaders, firstPage, escribirRasgos, escribirCompetencias, escribirSkills, escribirConjuros, escribirAtaques, listSpells, listSkills, listProficiencies, listLanguages, listEquipment, escribirEquipamientos, escribirArmas, escribirTesoro, escribirEquipamiento } = require('../helpers/fichaHelpers');
const Competencia = require('../models/competenciaModel');
const Equipamiento = require('../models/equipamientoModel');

async function crearFicha(req, res) {
  const { race, subrace, class: clas, level } = req.body

  const raza = await Raza.find({ index: race });
  const subraza = raza[0]?.subraces?.find(srace => srace.index === subrace)

  const clase = await Clase.find({ index: clas })
  const rasgos = await Rasgo.find();
  const competencias = await Competencia.find();
  const equipamientos = await Equipamiento.find()

  const spells = listSpells({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const traits = listTraits({ raza: raza[0] ?? null, subraza: subraza ?? null, clase: clase[0], level })
  const skills = listSkills({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const proficiencies = listProficiencies({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null, clase: clase[0], competencias })
  const languages = listLanguages({ character: req.body, raza: raza[0] ?? null, subraza: subraza ?? null })
  const { equipment, weapons, musical, armors } = listEquipment({ character: req.body, clase: clase[0], equipamientos })

  const existingPdfBytes = fs.readFileSync('./hoja-nueva.pdf');

  try {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

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
    });


    await escribirHeaders({ character: req.body, form, raza: raza[0], clase: clase[0] })  //Rellena datos
    await firstPage({ character: req.body, form, raza: raza[0], clase: clase[0], traits })  //Rellena datos
    await escribirSkills({ character: req.body, skills, form, clase: clase[0] })
    await escribirRasgos({ form, traits, rasgos, pdfDoc })
    await escribirCompetencias({ form, traits, rasgos, pdfDoc, proficiencies, languages, competencias: competencias })
    await escribirTesoro({ pdfDoc, equipment })
    await escribirEquipamiento({ pdfDoc, weapons, musical, armors, traits, rasgos })
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