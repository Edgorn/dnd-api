const { StandardFonts, rgb } = require("pdf-lib")
const Idioma = require("../src/infrastructure/databases/mongoDb/schemas/Idioma")
const Conjuro = require("../src/infrastructure/databases/mongoDb/schemas/Conjuro")
const Rasgo = require("../src/infrastructure/databases/mongoDb/schemas/Rasgo")

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

const caracteristicasOld = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

const caracteristicas = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR'
}

const salvacion = {
  str: 'STRsavePROF',
  dex: 'DEXsavePROF',
  con: 'CONsavePROF',
  int: 'INTsavePROF',
  wis: 'WISsavePROF',
  cha: 'CHAsavePROF'
}

const salvacionOld = {
  str: 'Check Box 11',
  dex: 'Check Box 18',
  con: 'Check Box 19',
  int: 'Check Box 20',
  wis: 'Check Box 21',
  cha: 'Check Box 22'
}

const conjuros = {
  trucos: [
    'Spells1',
    'Spells2',
    'Spells3',
    'Spells4',
    'Spells5',
    'Spells6',
    'Spells7',
    'Spells8'
  ],
  nvl1: [
    'Spells9',
    'Spells10',
    'Spells11',
    'Spells12',
    'Spells13',
    'Spells14',
    'Spells15',
    'Spells16',
    'Spells17',
    'Spells18',
    'Spells19',
    'Spells20',
  ]
}

const skillOld = {
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

const skill = {
  acrobatics: 'acroPROF',
  athletics: 'athPROF',
  arcana: 'arcanaPROF',
  deception: 'decepPROF',
  history: 'histPROF',
  intimidation: 'intimPROF',
  performance: 'perfPROF',
  investigation: 'investPROF',
  "sleight-of-hand": 'sohPROF',
  medicine: 'medPROF',
  nature: 'naturePROF',
  perception: 'perPROF',
  insight: 'insightPROF',
  persuasion: 'persPROF',
  religion: 'religPROF',
  stealth: 'stealthPROF',
  survival: 'survPROF',
  "animal-handling": 'anhanPROF'
}

function listTraits({ raza, subraza, clase, level, subclass }) {
  const traitsClase = []

  clase?.levels
    ?.filter(lev => lev.level <= level)
    ?.forEach(level => {
      traitsClase.push(...level?.traits ?? [], ...(level?.subclasses && level?.subclasses[subclass]?.traits) ?? [])
    })
    
  return [ 
    ...raza?.traits ?? [],
    ...subraza?.traits ?? [],
    ...traitsClase ?? []
  ]
}

function listSpells({ character }) {
  const { spells } = character 

  const listSpells = [
    ...spells.map(spell => { return { index: spell?.index ?? spell, type: spell?.type } }) ?? []
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

function listProficiencies({ character, raza, subraza, clase, competencias }) {
  const { proficiencies } = character

  const listProficiencies = [
    ...raza?.starting_proficiencies?.filter(prof => prof.type !== 'habilidad')?.map(prof => prof.index) ?? [],
    ...subraza?.starting_proficiencies?.filter(prof => prof.type !== 'habilidad')?.map(prof => prof.index) ?? [],
    ...clase?.starting_proficiencies?.filter(prof => prof.type !== 'habilidad')?.map(prof => prof.index) ?? [],
    ...proficiencies ?? []
  ]

  const seen = new Set();

  const uniqueList = listProficiencies.filter(item => {
    const duplicate = seen.has(item);
    seen.add(item);
    return !duplicate;
  });

  const uniqueProficiencies = []

  uniqueList.forEach(prof => {
    const competencia = competencias.find(comp => comp.index === prof)

    if (!uniqueList.includes(competencia.desc[0])) {
      uniqueProficiencies.push(prof)
    }
  })

  return uniqueProficiencies
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

function listEquipment({ character, equipamientos }) {
  const list = []
  const weapons = []
  const musical = []
  const armors = [] 
  const municion = []

  character?.equipment?.forEach(equip => {
    const equipment = equipamientos.find(e => e.index === equip.index)

    if (equipment) {
      if (equipment?.category === 'Paquete de equipo') {
        equipment.content.forEach(item => {
          const equipmentItem = equipamientos.find(e => e.index === item.item)
          list.push({ name: equipmentItem.name, quantity: item.quantity*equip.quantity })
        })
      } else if (equipment?.category === 'Arma') {
        weapons.push({ name: equipment.name, quantity: equip.quantity, damage: equipment?.weapon?.damage?.dice })
      } else if (equipment?.category === 'Instrumento musical') {
        musical.push({ name: equipment.name, quantity: equip.quantity })
      } else if (equipment?.category === 'Armadura') {
        armors.push({ name: equipment.name, quantity: equip.quantity, class: equipment?.armor?.class })
      } else if (equipment?.category === 'Equipo estandar') {
        list.push({ name: equipment.name, quantity: equip.quantity })
      } else if (equipment?.category === 'Munición') {
        municion.push({ name: equipment.name, quantity: equip.quantity })
      }
    }
  })

  return { equipment: list, weapons, musical, armors, municion }
}

async function escribirHeaders({character, form, raza, clase}) {
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

  form.getTextField('ClassLevel').setText((clase?.name ?? '') + ' ' + level)
  form.getTextField('PlayerName').setText(playerName)
  
  form.getField('Race').setOptions([race])
  form.getField('Race').select(race)

  form.getTextField('ExperiencePoints').setText(experiencePoints + '/' + nivel[level-1])

  const { age='', height='', weight='', eyes='', hair='', skin='' } = appearance

  form.getTextField('Age').setText(age ? age + ' años' : '')
  form.getTextField('Eyes').setText(eyes)
  form.getTextField('Height').setText(height ? height + ' cm' : '')
  form.getTextField('Skin').setText(skin)
  form.getTextField('Weight').setText(weight ? weight + ' kg' : '')
  form.getTextField('Hair').setText(hair)
}

async function firstPage({ character, form, raza, clase, traits }) {
  const { subrace, level, money, ability_scores } = character
  const subraza = raza?.subraces?.find(s => s.index === subrace)
  const speed = subraza?.speed ?? raza?.speed

  let live = clase?.hit_die

  if (traits.includes('dwarven-toughness')) {
    live += level
  }

  const dataLevel = clase?.levels?.find(lev => lev.level === level)

  form.getTextField('STRscore').setText(ability_scores.str + '')
  form.getTextField('DEXscore').setText(ability_scores.dex + '')
  form.getTextField('CONscore').setText(ability_scores.con + '')
  form.getTextField('INTscore').setText(ability_scores.int + '')
  form.getTextField('WISscore').setText(ability_scores.wis + '')
  form.getTextField('CHAscore').setText(ability_scores.cha + '')

  form.getTextField('ProfBonus').setText('+' + (dataLevel?.prof_bonus ?? ''))

  let AC = 10 + valorHabilidad(ability_scores.dex)

  if (traits.includes('barbarian-unarmored-defense')) {
    AC += valorHabilidad(ability_scores.con)
  }
  
  form.getTextField('AC').setText(AC + '')
  form.getTextField('Init').setText(formatNumber(valorHabilidad(ability_scores.dex)) + '')
  form.getTextField('Speed').setText((speed ?? '') + '')

  form.getTextField('HPMax').setText(live + '')
  form.getTextField('HitDiceTotal').setText(level + 'd' + clase?.hit_die)
  
  form.getTextField('Copper').setText('0')
  form.getTextField('Silver').setText('0')
  form.getTextField('Electrum').setText('0')
  form.getTextField('Gold').setText('' + (money ?? 0))
  form.getTextField('Platinum').setText('0')
}

const valorHabilidad = (value) => {
  return Math.floor(value/2 - 5)
}

function formatNumber(num) {
  return (num >= 0 ? "+" : "-") + num.toString();
}

async function escribirRasgos({ traits, rasgos, pdfDoc}) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY1 = page1.getHeight() - 395;
  let textY2 = page2.getHeight() - 385;
  let maxHeight = 44

  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)

    if (rasgo && !traits?.includes(rasgo?.discard) && rasgo?.type !== 'proficiency' && rasgo?.type !== 'spell'  ) {
      const { textY, actualHeight } = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 170,
        page: page1,
        x: 412,
        y: textY1,
        maxHeight
      })

      if (maxHeight === actualHeight) {
        const { textY } = escribirParrafo({ 
          titulo: rasgo?.name, 
          descripcion: rasgo?.desc?.join('|'),
          fontTitle: fontBold,
          fontText: fontRegular,
          maxWidth: 185,
          page: page2,
          x: 225,
          y: textY2
        })

        textY2 = textY

      } else {
        textY1 = textY
        maxHeight = actualHeight
      }

    }
  })
}

function escribirParrafo({ titulo, descripcion, fontTitle, fontText, maxWidth, page, x, y, maxHeight=1000 }) {
  let textY = y
  const fontSize = 8; 
  const lineSpacing = 8;
  const textWidth = titulo==='' ? 0 : fontTitle.widthOfTextAtSize(titulo + '. ', fontSize);
  const texto = titulo + ': ' + descripcion

  const textoFilas = []
  let lineasTexto = 0
  let actualHeight = maxHeight

  texto.split('|').forEach((text, ind) => {
    const parrafo = wrapText(text, fontTitle, fontSize, maxWidth)
    textoFilas.push(parrafo)
    lineasTexto += parrafo.length
  })

  if (lineasTexto <= maxHeight) {
    textoFilas.forEach((wrappedLines, ind) => {
      //const wrappedLines = wrapText(text, fontTitle, fontSize, maxWidth);
  
      wrappedLines.forEach((wrappedLine, index) => {
        if (index === 0 && ind === 0) {
          if (titulo !== '') {
            page.drawText(titulo + '. ', {
              x: x,
              y: textY,
              size: fontSize,
              font: fontTitle,
              color: rgb(0, 0, 0)
            });
          }
    
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

    actualHeight -= lineasTexto
  }

  return { textY: textY-1, actualHeight }
}

async function escribirCompetencias({ traits, rasgos, pdfDoc, proficiencies, languages, competencias }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 635;
  let x = 35
  const maxWidth = 170;

  // COMPETENCIAS
  const listaCompetencias = []

  proficiencies?.forEach(proficiency => {
    const competencia = competencias.find(i => i.index === proficiency)

    if (competencia?.name) {
      listaCompetencias.push(competencia.name)
    }
  })

  if (listaCompetencias.length > 0) {
    const { textY: actualY } = escribirParrafo({ 
      titulo: 'Competencias', 
      descripcion: listaCompetencias?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })

    textY = actualY
  }

  //  IDIOMAS
  const idiomas = await Idioma.find();
  const listaIdiomas = []

  languages?.forEach(language => {
    const idioma = idiomas.find(i => i.index === language)
    listaIdiomas.push(idioma.name)
  })

  const { textY: actualY } = escribirParrafo({ 
    titulo: 'Idiomas', 
    descripcion: listaIdiomas?.join(', ')+'.',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: textY
  })

  textY = actualY

  // RASGOS
  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)

    if (rasgo?.type === 'proficiency') {
      const { textY: actualY } = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth,
        page: page1,
        x,
        y: textY
      })

      textY = actualY
    }
  })
}

async function escribirSkills({ skills, form, clase }) {
  clase?.saving_throws.forEach(sav => {
    form.getCheckBox(salvacion[sav]).check()
  })

  skills?.forEach(s => {
    form.getCheckBox(skill[s]).check()
  })
}

async function escribirConjuros({ spells, form, clase, character }) {
  if (clase?.spellcasting) {
    form.getField('SpellClass').setOptions([clase?.name + ''])
    form.getField('SpellClass').select(clase?.name + '')

    const level = character?.level ?? 1
    const slots = clase?.levels?.find(lev => lev.level === level)?.spellcasting

    form.getTextField('SlotsTot1').setText(slots?.spell_slots_level_1 + '')
    form.getTextField('SlotsRemaining1').setText(0 + '')

    form.getTextField('SlotsTot2').setText(slots?.spell_slots_level_2 + '')
    form.getTextField('SlotsRemaining2').setText(0 + '')

    form.getTextField('SlotsTot3').setText(slots?.spell_slots_level_3 + '')
    form.getTextField('SlotsRemaining3').setText(0 + '')

    form.getTextField('SlotsTot4').setText(slots?.spell_slots_level_4 + '')
    form.getTextField('SlotsRemaining4').setText(0 + '')

    form.getTextField('SlotsTot5').setText(slots?.spell_slots_level_5 + '')
    form.getTextField('SlotsRemaining5').setText(0 + '')

    form.getTextField('SlotsTot6').setText(slots?.spell_slots_level_6 + '')
    form.getTextField('SlotsRemaining6').setText(0 + '')

    form.getTextField('SlotsTot7').setText(slots?.spell_slots_level_7 + '')
    form.getTextField('SlotsRemaining7').setText(0 + '')

    form.getTextField('SlotsTot8').setText(slots?.spell_slots_level_8 + '')
    form.getTextField('SlotsRemaining8').setText(0 + '')

    form.getTextField('SlotsTot9').setText(slots?.spell_slots_level_9 + '')
    form.getTextField('SlotsRemaining9').setText(0 + '')
  }

  const conjurosList = await Conjuro.find()
  const rasgosList = await Rasgo.find()
  const trucosLista = []
  const conjurosLista = []

  spells?.forEach(spell => {
    const conjuro = conjurosList?.find(c => c.index === spell.index)

    if (conjuro) {
      const tipo = caracteristicas[spell?.type]

      if (tipo) {
        trucosLista.push(conjuro.name + ' (' + tipo + ')')
      } else {
        const rasgo = rasgosList?.find(c => c.index === spell.type)
        if (rasgo) {
          trucosLista.push(conjuro.name + ' (' + rasgo.name + ')')
        } else {
          if (conjuro.level === 0) {
            trucosLista.push(conjuro.name + '')
          } else {
            conjurosLista.push(conjuro)
          }
        }
      }
    }
  })

  
  conjurosLista
    .filter(conjuro => conjuro.level === 1)
    .forEach((conjuro, index) => {
      form.getTextField(conjuros.nvl1[index]).setText(conjuro.name + '')
    })
    
    trucosLista
      .forEach((name, index) => {
        form.getTextField(conjuros.trucos[index]).setText(name)
      })
}
/*
async function escribirAtaques({ pdfDoc, rasgos, traits }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 460;

  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
    
    if (rasgo?.type === 'spell') {
      const { textY: actualY } = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 170,
        page: page1,
        x: 225,
        y: textY
      })

      textY = actualY
    }
  })
}
*/

async function escribirTesoro({ pdfDoc, equipment }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 612;

  const text = equipment.map(eq => eq.quantity + 'x ' + eq.name).join('|')

  const { textY: actualY } = escribirParrafo({ 
    titulo: '', 
    descripcion: text,
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth: 370,
    page: page1,
    x: 225,
    y: textY
  })

  textY = actualY
}

async function escribirEquipamiento({ pdfDoc, weapons, musical, armors, traits, rasgos, municion }) {
  await escribirArmas({ pdfDoc, weapons, traits, rasgos })
  await escribirEquipo({ pdfDoc, musical, armors, municion })
}

async function escribirArmas({ pdfDoc, weapons, traits, rasgos }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 460;

  const text = weapons.map(eq => eq.quantity + 'x ' + eq.name + ' (' + eq.damage + ')').join('|')

  if (text !== '') {
    const { textY: actualY } = escribirParrafo({ 
      titulo: '', 
      descripcion: text,
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 170,
      page: page1,
      x: 225,
      y: textY
    })
  
    textY = actualY
  }

  traits?.forEach(trait => {
    const rasgo = rasgos.find(r => r.index === trait)
    
    if (rasgo?.type === 'spell') {
      const { textY: actualY } = escribirParrafo({ 
        titulo: rasgo?.name, 
        descripcion: rasgo?.desc?.join('|'),
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 170,
        page: page1,
        x: 225,
        y: textY
      })

      textY = actualY
    }
  })
}

async function escribirEquipo({ pdfDoc, musical, armors, municion }) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 625;
  
  const text1 = armors
    .map(eq => {
      const ca = eq?.class?.dex_bonus ? (eq?.class?.base + '+0') : eq?.class?.base
      return eq.quantity + 'x ' + eq.name + ' (' + ca + ' CA)'
    })
    .join('|')

  const text2 = musical.map(eq => eq.quantity + 'x ' + eq.name).join('|')
  const text3 = municion.map(eq => eq.quantity + 'x ' + eq.name).join('|')

  if (text1 !== '') {
    const { textY: actualY1 } = escribirParrafo({ 
      titulo: '', 
      descripcion: text1,
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 370,
      page: page1,
      x: 270,
      y: textY
    })

    textY = actualY1
  }

  if (text2 !== '') {
    const { textY: actualY2 } = escribirParrafo({ 
      titulo: '', 
      descripcion: text2,
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 370,
      page: page1,
      x: 270,
      y: textY
    })
  
    textY = actualY2
  }

  if (text3 !== '') {
    const { textY: actualY3 } = escribirParrafo({ 
      titulo: '', 
      descripcion: text3,
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 370,
      page: page1,
      x: 270,
      y: textY
    })

    textY = actualY3
  }
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
  listEquipment,
  escribirHeaders,
  firstPage,
  escribirSkills,
  escribirRasgos,
  escribirCompetencias,
  escribirConjuros,
  //escribirAtaques,
  escribirTesoro,
  escribirEquipamiento
};