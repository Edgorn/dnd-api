const { StandardFonts, rgb } = require("pdf-lib")
const Competencia = require("../models/competenciaModel")
const Idioma = require("../models/idiomaModel")
const Conjuro = require("../models/conjuroModel")
const Rasgo = require("../models/rasgoModel")

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

const caracteristicas = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

const salvacion = {
  str: 'Check Box 11',
  dex: 'Check Box 18',
  con: 'Check Box 19',
  int: 'Check Box 20',
  wis: 'Check Box 21',
  cha: 'Check Box 22'
}

const conjuros = {
  trucos: [
    'Spells 1014',
    'Spells 1016',
    'Spells 1017',
    'Spells 1018',
    'Spells 1019',
    'Spells 1020',
    'Spells 1021',
    'Spells 1022'
  ],
  nvl1: [
    'Spells 1015',
    'Spells 1023',
    'Spells 1024',
    'Spells 1025',
    'Spells 1026',
    'Spells 1027',
    'Spells 1028',
    'Spells 1029',
    'Spells 1030',
    'Spells 1031',
    'Spells 1032',
    'Spells 1033',
  ]
}

const skill = {
  acrobatics: 'Check Box 23',
  athletics: 'Check Box 25',
  arcana: 'Check Box 24',
  deception: 'Check Box 26',
  history: 'Check Box 32',
  intimidation: 'Check Box 28',
  performance: 'Check Box 27',
  investigation: 'Check Box 29',
  "sleight-of-hand": 'Check Box 33',
  medicine: 'Check Box 30',
  nature: 'Check Box 31',
  perception: 'Check Box 34',
  insight: 'Check Box 35',
  persuasion: 'Check Box 36',
  religion: 'Check Box 37',
  stealth: 'Check Box 38',
  survival: 'Check Box 39',
  "animal-handling": 'Check Box 40'
}

function listTraits({ raza, subraza }) {
  return [ 
    ...raza?.traits ?? [],
    ...subraza?.traits ?? []
  ]
}

function listSpells({ character, raza, subraza }) {
  const { spells } = character 

  const listSpells = [
    ...raza?.spells?.map(spell => {
      return {
        index: spell.split('_')[0],
        type: spell.split('_')[1]
      }
    }) ?? [],
    ...subraza?.spells?.map(spell => {
      return {
        index: spell.split('_')[0],
        type: spell.split('_')[1]
      }
    }) ?? [],
    ...spells ?? []
  ]

  const seen = new Set();

  const uniqueList = listSpells.filter(item => {
    const duplicate = seen.has(item.index);
    seen.add(item.index);
    return !duplicate;
  });

  return uniqueList
}

function listSkills({ character, raza, subraza }) {
  const { skills } = character 

  const listSkills = [
    ...raza?.starting_proficiencies?.filter(prof => prof.type === 'habilidad')?.map(prof => prof.index) ?? [],
    ...subraza?.starting_proficiencies?.filter(prof => prof.type === 'habilidad')?.map(prof => prof.index) ?? [],
    ...skills ?? []
  ]

  return listSkills
}

function listProficiencies({ character, raza, subraza }) {
  const { proficiencies } = character

  const listProficiencies = [
    ...raza?.starting_proficiencies?.filter(prof => prof.type !== 'habilidad')?.map(prof => prof.index) ?? [],
    ...subraza?.starting_proficiencies?.filter(prof => prof.type !== 'habilidad')?.map(prof => prof.index) ?? [],
    ...proficiencies ?? []
  ]

  const seen = new Set();

  const uniqueList = listProficiencies.filter(item => {
    const duplicate = seen.has(item);
    seen.add(item);
    return !duplicate;
  });

  return uniqueList
}

function listLanguages({ character, raza, subraza }) {
  const { languages } = character

  const listLanguages = [
    ...raza?.languages ?? [],
    ...subraza?.languages ?? [],
    ...languages ?? []
  ]

  const seen = new Set();

  const uniqueList = listLanguages.filter(item => {
    const duplicate = seen.has(item);
    seen.add(item);
    return !duplicate;
  });

  return uniqueList
}

function escribirHeaders({character, form, raza}) {
  const {
    name='',
    level=1,
    experiencePoints=0,
    playerName='',
    appearance={},
    subrace,
    type
  } = character;

  const subraza = raza?.subraces?.find(srace => srace.index === subrace)
  const race = type==='' || !type ? subraza?.name ?? raza?.name ?? '' : type

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

function firstPage({ character, form, raza }) {
  const { subrace } = character
  const subraza = raza?.subraces?.find(s => s.index === subrace)
  const speed = subraza?.speed ?? raza?.speed
  
  form.getTextField('Speed').setText(speed ? speed + ' pies' : '')
}

async function escribirRasgos({ form, traits, rasgos, pdfDoc}) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 395;

  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)

    if (rasgo && !traits?.includes(rasgo?.discard) && rasgo?.type !== 'proficiency' && rasgo?.type !== 'spell'  ) {
      textY = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 170,
        page: page1,
        x: 415,
        y: textY
      })
    }
  })

  form.getTextField('Features and Traits').setText('');
  form.flatten();
}

function escribirParrafo({ titulo, descripcion, fontTitle, fontText, maxWidth, page, x, y }) {
  let textY = y
  const fontSize = 8; 
  const lineSpacing = 8;
  const textWidth = fontTitle.widthOfTextAtSize(titulo + '. ', fontSize);
  const texto = titulo + ': ' + descripcion

  texto.split('|').forEach((text, ind) => {
    
    const wrappedLines = wrapText(text, fontTitle, fontSize, maxWidth);

    wrappedLines.forEach((wrappedLine, index) => {
      if (index === 0 && ind === 0) {
        page.drawText(titulo + '. ', {
          x: x,
          y: textY,
          size: fontSize,
          font: fontTitle,
          color: rgb(0, 0, 0)
        });
  
        page.drawText(wrappedLine.split(': ')[1], {
          x: x + textWidth,
          y: textY,
          size: fontSize,
          font: fontText,
          color: rgb(0, 0, 0)
        });
      } else {
        page.drawText(wrappedLine, {
          x: x,
          y: textY,
          size: fontSize,
          font: fontText,
          color: rgb(0, 0, 0)
        });
      }
      
      textY -= lineSpacing;
    })

    textY -= 2;
  })

  return textY-1
}

async function escribirCompetencias({ traits, rasgos, pdfDoc, proficiencies, languages }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 635;
  let x = 35
  const maxWidth = 170;

  // COMPETENCIAS
  const competencias = await Competencia.find();
  const listaCompetencias = []

  proficiencies?.forEach(proficiency => {
    const competencia = competencias.find(i => i.index === proficiency)

    if (competencia?.name) {
      listaCompetencias.push(competencia.name)
    }
  })

  if (listaCompetencias.length > 0) {
    textY = escribirParrafo({ 
      titulo: 'Competencias', 
      descripcion: listaCompetencias?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })
  }

  //  IDIOMAS
  const idiomas = await Idioma.find();
  const listaIdiomas = []

  languages?.forEach(language => {
    const idioma = idiomas.find(i => i.index === language)
    listaIdiomas.push(idioma.name)
  })

  textY = escribirParrafo({ 
    titulo: 'Idiomas', 
    descripcion: listaIdiomas?.join(', ')+'.',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: textY
  })

  // RASGOS
  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)

    if (rasgo?.type === 'proficiency') {
      textY = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth,
        page: page1,
        x,
        y: textY
      })
    }
  })
}

async function escribirSkills({ skills, form }) {
  skills?.forEach(s => {
    form.getCheckBox(skill[s]).check()
  })
}

async function escribirConjuros({ spells, form }) {
  const conjurosList = await Conjuro.find()
  const rasgosList = await Rasgo.find()

  spells?.forEach((spell, index) => {
    const conjuro = conjurosList?.find(c => c.index === spell.index)

    if (conjuro) {
      const tipo = caracteristicas[spell.type]

      if (tipo) {
        form.getTextField(conjuros.trucos[index]).setText(conjuro.name + ' (' + tipo + ')')
      } else {
        const rasgo = rasgosList?.find(c => c.index === spell.type)
        form.getTextField(conjuros.trucos[index]).setText(conjuro.name + ' (' + rasgo.name + ')')
      }
    }
  })
}

async function escribirAtaques({ pdfDoc, rasgos, traits }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 460;

  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
    
    if (rasgo?.type === 'spell') {
      textY = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 170,
        page: page1,
        x: 225,
        y: textY
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

module.exports = {
  listTraits,
  listSpells,
  listSkills,
  listProficiencies,
  listLanguages,
  escribirHeaders,
  firstPage,
  escribirSkills,
  escribirRasgos,
  escribirCompetencias,
  escribirConjuros,
  escribirAtaques
};