import { rgb, StandardFonts } from "pdf-lib";

const abilities: {[key: string]: string} = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR'
}

const spellsList = [
  ['Spells1', 'Spells2', 'Spells3', 'Spells4', 'Spells5', 'Spells6', 'Spells7', 'Spells8'],
  ['Spells9', 'Spells10','Spells11', 'Spells12', 'Spells13', 'Spells14', 'Spells15', 'Spells16', 'Spells17', 'Spells18', 'Spells19', 'Spells20'],
  ['Spells21', 'Spells22', 'Spells23', 'Spells24', 'Spells25', 'Spells26', 'Spells27', 'Spells28', 'Spells29', 'Spells30', 'Spells31', 'Spells32', 'Spells33'],
  ['Spells34', 'Spells35', 'Spells36', 'Spells37', 'Spells38', 'Spells39', 'Spells40', 'Spells41', 'Spells42', 'Spells43', 'Spells44', 'Spells45', 'Spells46'],
  ['Spells47', 'Spells48', 'Spells49', 'Spells50', 'Spells51', 'Spells52', 'Spells53', 'Spells54', 'Spells55', 'Spells56', 'Spells57', 'Spells58', 'Spells59'],
  ['Spells60', 'Spells61', 'Spells62', 'Spells63', 'Spells64', 'Spells65', 'Spells66', 'Spells67', 'Spells68'],
  ['Spells69', 'Spells70', 'Spells71', 'Spells72', 'Spells73', 'Spells74', 'Spells75', 'Spells76', 'Spells77'],
  ['Spells78', 'Spells79', 'Spells80', 'Spells81', 'Spells82', 'Spells83', 'Spells84', 'Spells85', 'Spells86'],
  ['Spells87', 'Spells88', 'Spells89', 'Spells90', 'Spells91', 'Spells92', 'Spells93'],
  ['Spells94', 'Spells95', 'Spells96', 'Spells97', 'Spells98', 'Spells99', 'Spells100']
]

const wrapText = (text: any, font: any, fontSize: any, maxWidth: any) => {
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

const escribirParrafo = ({ titulo, descripcion, fontTitle, fontText, maxWidth, page, x, y, maxHeight=1000 }: any) => {
  let textY = y
  const fontSize = 8; 
  const lineSpacing = 8;
  const textWidth = titulo==='' ? 0 : fontTitle.widthOfTextAtSize(titulo + '. ', fontSize);
  const texto = titulo + ': ' + descripcion

  const textoFilas: any[] = []
  let lineasTexto = 0
  let actualHeight = maxHeight

  texto.split('\n').forEach((text, ind) => {
    const parrafo = wrapText(text, fontTitle, fontSize, maxWidth)
    textoFilas.push(parrafo)
    lineasTexto += parrafo.length
  })

  if (lineasTexto <= maxHeight) {
    textoFilas.forEach((wrappedLines, ind) => {
      //const wrappedLines = wrapText(text, fontTitle, fontSize, maxWidth);
  
      wrappedLines.forEach((wrappedLine: any, index: any) => {
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
    
          page.drawText(wrappedLine.split(': ')[1] ?? '', {
            x: x + textWidth,
            y: textY,
            size: fontSize,
            font: fontText,
            color: rgb(0, 0, 0)
          });
        } else {
          page.drawText(wrappedLine ?? '', {
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

export async function escribirRasgos({ traits, invocations, pdfDoc, terrain }: any) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Rasgos y atributos
  let textY1 = page1.getHeight() - 395;
  let textY2 = page2.getHeight() - 385;
  let textY3 = page2.getHeight() - 385;
  let maxHeight1 = 43
  let maxHeight2 = 23
   
  // Ataques y lanzamientos de conjuros
  let textY4 = page1.getHeight() - 460;

  const rasgos = [ ...traits ?? [], ...invocations ?? []]
  const rasgosList = rasgos.map(rasg => rasg.index)
  
  rasgos
    ?.filter((trait: any) => {
      let isDiscard = true

      trait?.discard?.forEach((dis: string) => {

        if (rasgosList?.includes(dis)) {
          isDiscard = false
        }
      })
 
      return trait.type !== 'spell' && !trait.hidden && isDiscard
      
    })?.forEach((trait: any) => {
      const { textY, actualHeight: actualHeight1 } = escribirParrafo({ 
        titulo: trait?.name, 
        descripcion: trait?.desc,
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 178,  //174
        page: page1,
        x: 410, //412
        y: textY1,
        maxHeight: maxHeight1
      })

      if (maxHeight1 === actualHeight1) {
        const { textY, actualHeight: actualHeight2 } = escribirParrafo({ 
          titulo: trait?.name, 
          descripcion: trait?.desc,
          fontTitle: fontBold,
          fontText: fontRegular,
          maxWidth: 182,
          page: page2,
          x: 227,
          y: textY2,
          maxHeight: maxHeight2
        })

        if (maxHeight2 === actualHeight2) {
          const { textY } = escribirParrafo({ 
            titulo: trait?.name, 
            descripcion: trait?.desc,
            fontTitle: fontBold,
            fontText: fontRegular,
            maxWidth: 182,
            page: page2,
            x: 405,
            y: textY3
          })

          textY3 = textY

        } else {
          textY2 = textY
          maxHeight2 = actualHeight2
        }
      } else {
        textY1 = textY
        maxHeight1 = actualHeight1
      } 
    /*
    let rasgo = rasgos.find(r => r.index === trait)

    if (rasgo?.index === 'born-explorer') {
      const desc1 = rasgo?.desc[0]
        ?.replace("un tipo de entorno natural concreto", "el tipo de terreno "+terrain[0].toLowerCase())
        ?.replace("tu terreno predilecto", "el tipo de terreno "+terrain[0].toLowerCase())

      const desc2 = rasgo?.desc[1]
        ?.replace("tu terreno favorito", "el tipo de terreno "+terrain[0].toLowerCase())

      rasgo.desc[0] = desc1
      rasgo.desc[1] = desc2
    }
    
    if (rasgo && !traits?.includes(rasgo?.discard) && rasgo?.type !== 'proficiency' && rasgo?.type !== 'spell') {
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

    }*/
  })

  traits
    ?.filter((trait: any) => trait.type === 'spell')
    ?.forEach((trait: any) => {
      const { textY } = escribirParrafo({ 
        titulo: trait?.name, 
        descripcion: trait?.desc,
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 182,
        page: page1,
        x: 222,
        y: textY4
      })

      textY4 = textY
    })
}

export async function escribirOrganizaciones({ pdfDoc, personaje, form }: any) {
  const pages = pdfDoc.getPages();
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Rasgos y atributos
  let textY1 = page2.getHeight() - 140;
  /*let textY2 = page2.getHeight() - 385;
  let textY3 = page2.getHeight() - 385;*/
  let maxHeight1 = 43
  //let maxHeight2 = 23
   
  // Ataques y lanzamientos de conjuros
  //let textY4 = page1.getHeight() - 460;

  if (personaje?.background?.god) {
    const { textY, actualHeight: actualHeight1 } = escribirParrafo({ 
      titulo: 'Dios', 
      descripcion: personaje?.background?.god ?? '',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 178,  //174
      page: page2,
      x: 222,
      y: textY1,
      maxHeight: maxHeight1
    })

    textY1 = textY
  }
/*
  const rasgos = [ ...traits ?? [], ...invocations ?? []]
  const rasgosList = rasgos.map(rasg => rasg.index)
  
  rasgos
    ?.filter((trait: any) => {
      let isDiscard = true

      trait?.discard?.forEach((dis: string) => {

        if (rasgosList?.includes(dis)) {
          isDiscard = false
        }
      })
 
      return trait.type !== 'spell' && !trait.hidden && isDiscard
      
    })?.forEach((trait: any) => {
      const { textY, actualHeight: actualHeight1 } = escribirParrafo({ 
        titulo: trait?.name, 
        descripcion: trait?.desc,
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 178,  //174
        page: page1,
        x: 410, //412
        y: textY1,
        maxHeight: maxHeight1
      })

      if (maxHeight1 === actualHeight1) {
        const { textY, actualHeight: actualHeight2 } = escribirParrafo({ 
          titulo: trait?.name, 
          descripcion: trait?.desc,
          fontTitle: fontBold,
          fontText: fontRegular,
          maxWidth: 182,
          page: page2,
          x: 227,
          y: textY2,
          maxHeight: maxHeight2
        })

        if (maxHeight2 === actualHeight2) {
          const { textY } = escribirParrafo({ 
            titulo: trait?.name, 
            descripcion: trait?.desc,
            fontTitle: fontBold,
            fontText: fontRegular,
            maxWidth: 182,
            page: page2,
            x: 405,
            y: textY3
          })

          textY3 = textY

        } else {
          textY2 = textY
          maxHeight2 = actualHeight2
        }
      } else {
        textY1 = textY
        maxHeight1 = actualHeight1
      } 
    /*
    let rasgo = rasgos.find(r => r.index === trait)

    if (rasgo?.index === 'born-explorer') {
      const desc1 = rasgo?.desc[0]
        ?.replace("un tipo de entorno natural concreto", "el tipo de terreno "+terrain[0].toLowerCase())
        ?.replace("tu terreno predilecto", "el tipo de terreno "+terrain[0].toLowerCase())

      const desc2 = rasgo?.desc[1]
        ?.replace("tu terreno favorito", "el tipo de terreno "+terrain[0].toLowerCase())

      rasgo.desc[0] = desc1
      rasgo.desc[1] = desc2
    }
    
    if (rasgo && !traits?.includes(rasgo?.discard) && rasgo?.type !== 'proficiency' && rasgo?.type !== 'spell') {
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
  })*/
}

export async function escribirCompetencias({ pdfDoc, languages, weapons, armors, proficiencies }: any) {

  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY = page1.getHeight() - 635;
  let x = 35
  const maxWidth = 170;

  if (weapons.length > 0) {
    const { textY: actualY } = escribirParrafo({ 
      titulo: 'Armas', 
      descripcion: weapons?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })

    textY = actualY
  }

  if (armors.length > 0) {
    const { textY: actualY } = escribirParrafo({ 
      titulo: 'Armaduras', 
      descripcion: armors?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })

    textY = actualY
  }

  if (proficiencies.length > 0) {
    const { textY: actualY } = escribirParrafo({ 
      titulo: 'Competencias', 
      descripcion: proficiencies?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })

    textY = actualY
  }

  if (weapons.length > 0) {
    const { textY: actualY } = escribirParrafo({ 
      titulo: 'Idiomas', 
      descripcion: languages?.join(', ')+'.',
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth,
      page: page1,
      x,
      y: textY
    })

    textY = actualY
  }
  /*
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
  })*/
}

export async function escribirTransfondo({ pdfDoc, background }: any) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let x = 417
  const maxWidth = 168;

  escribirParrafo({ 
    titulo: '', 
    descripcion: background?.personality?.join('\n') ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: page1.getHeight() - 147
  })

  escribirParrafo({ 
    titulo: '',//background?.ideals[0]?.split('.')[0] ?? '', 
    descripcion: background?.ideals?.join('\n') ?? '',//background?.ideals[0]?.split('.')[1] ?? background?.ideals ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: page1.getHeight() - 217
  })

  escribirParrafo({ 
    titulo: '', 
    descripcion: background?.bonds ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: page1.getHeight() - 272
  })

  escribirParrafo({ 
    titulo: '', 
    descripcion: background?.flaws ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: page1.getHeight() - 327
  })

  escribirParrafo({ 
    titulo: '', 
    descripcion: background?.history ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth: 180,
    page: page2,
    x: 33,
    y: page2.getHeight() - 392
  })
}

export async function escribirEquipo({ pdfDoc, equipment, personaje, form }: any) {

  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const equipo = equipment
    .filter((equip: any) => equip.category === "Arma" || equip.category === "Armadura")
    .map((equip: any) => {
      if (equip.category === 'Armadura' && equip?.armor?.category !== 'Escudo' && equip.equipped) {
        let CA = equip?.armor?.class?.base ?? 10

        if (equip?.armor?.class?.dex_bonus) {
          CA += Math.floor((personaje?.abilities.dex/2) - 5)
        }
  
        escribirParrafo({ 
          titulo: '', 
          descripcion: equip?.name ?? '',
          fontTitle: fontBold,
          fontText: fontRegular,
          maxWidth: 131,
          page: page1,
          x: 270,
          y: page1.getHeight() - 609
        })

        //form.getTextField('ArmorWorn').setText(equip?.name ?? '' + '');
        form.getTextField('ACworn').setText('+' + (CA - 10));
      }

      let dataProperties = ''

      if (equip.weapon.properties.length > 0) {
        dataProperties = '(' + equip?.weapon?.properties
          .map((prop: any) => {
            if (prop?.name === 'Versátil') {
              return prop?.name + ' ' + equip?.weapon?.two_handed_damage?.dice
            }
            
            if (prop?.name === 'Arrojadiza') {
              return prop?.name + ' ' + equip?.weapon?.range_throw?.normal + '/' + equip?.weapon?.range_throw?.long
            }
            
            if (prop?.name === 'Munición') {
              return prop?.name + ' ' + equip?.weapon?.range_throw?.normal + '/' + equip?.weapon?.range_throw?.long
            }

            return prop?.name
          })
          .join(', ') + ')'
      }
      
      return equip.quantity+'x ' + equip.name + ' ' + dataProperties
    })

  const tesoro = equipment
    .filter((equip: any) => equip.category !== "Arma" && equip.category !== "Armadura")
    .map((equip: any) => equip.quantity+'x ' + equip.name)

  escribirParrafo({ 
    titulo: '', 
    descripcion: equipo?.join('\n') ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth: 131,
    page: page1,
    x: 267,
    y: page1.getHeight() - 622
  })
  
  escribirParrafo({ 
    titulo: '', 
    descripcion: tesoro?.slice(0, 15)?.join('\n') ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth: 170,
    page: page2,
    x: 227,
    y: page2.getHeight() - 613
  })
 
  escribirParrafo({ 
    titulo: '', 
    descripcion: tesoro?.slice(15)?.join('\n') ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth: 170,
    page: page2,
    x: 405,
    y: page2.getHeight() - 613
  })
}  

const calcularAtaque = (character: any, spellcasting: string) => {
  return (character.prof_bonus ?? 0) + (Math.floor((character.abilities[spellcasting]/2) - 5) ?? 0)
}

function formatNumber(num: any) {
  return (num >= 0 ? "+" : "") + num.toString();
}

const nombres:any = {
  'Agarre electrizante': 'Controlar llamas',
  Amistad: 'Saeta de fuego',
  'Descarga de fuego': 'Soplo de viento',
  'Zancada prodigiosa': 'Absorber elementos'
}

export async function escribirConjuros({ form, personaje }: any) {
  const spells = personaje.spells
  const checkSpells: any = []

  spells?.race?.list?.forEach((spell: any) => {
    if (!checkSpells[spell.level]) {
      checkSpells[spell.level] = 0
    }

    form.getTextField(spellsList[spell.level][checkSpells[spell.level]]).setText(spell.name + ' (' + spells.race.type + ')');

    checkSpells[spell.level]++
  })

  Object.keys(spells).forEach(clas => {
    if (clas !== 'race') {
      
      const claseName = personaje.classes.find((c: any) => c.class === clas)?.name ?? ''
      const claseSpells = spells[clas]

      if (claseName && claseSpells?.spellcasting) {
        const listSpellsAux = [...claseSpells?.list ?? []]

        personaje.subclasses?.forEach((sub: string) => {
          listSpellsAux?.push(...spells[clas + '_' + sub]?.list ?? [])
        }) 

        form.getDropdown('SpellClass').addOptions([claseName]);
        form.getDropdown('SpellClass').select(claseName);
      
        form.getDropdown('SpellAbility').addOptions([abilities[claseSpells.spellcasting] ?? '']);
        form.getDropdown('SpellAbility').select(abilities[claseSpells.spellcasting] ?? '');
        
        form.getTextField('SpellSaveDC').setText((8 + calcularAtaque(personaje, claseSpells.spellcasting)) + '');
        form.getTextField('SAB').setText(formatNumber(calcularAtaque(personaje, claseSpells.spellcasting)) + '');
 
        Array.from({ length: 10 }).forEach((_, index) => {
          if (!checkSpells[index]) {
            checkSpells[index] = 0
          }
  
          listSpellsAux?.filter((spell: any) => spell.level === index).forEach((spell: any, index2: number) => {
            if (!spellsList[index][checkSpells[index]]) {
              checkSpells[index] = 0
            }
            const valor = form.getTextField(spellsList[index][checkSpells[index]]).getText() ?? ''

            const name = nombres[spell.name] ?? spell.name

            form.getTextField(spellsList[index][checkSpells[index]]).setText(valor ? (valor + ', ' + name) : name);
            checkSpells[index]++ 
          })
        })
 
        Array.from({ length: 9 }).forEach((_, index) => {
          if (clas === 'warlock') {
            if (index + 1 !== claseSpells.level) {
              form.getTextField('SlotsTot' + (index + 1)).setText('0')
            } else {
              form.getTextField('SlotsTot' + (index + 1)).setText(claseSpells.slots + '')
            }
          } else {
            form.getTextField('SlotsTot' + (index + 1)).setText(claseSpells['slots_level_' + (index + 1)] + '')
          }
        }) 
      /*
        if (claseSpells.level) {
          const totalSlots = form.getTextField('SlotsTot' + claseSpells.level);
          if (totalSlots) {
            totalSlots.setText(String(claseSpells.slots));
          } else {
            console.warn(`No se encontró el campo de formulario: SlotsTot${claseSpells.level}`);
          }
        } else {
          console.error("Error: 'claseSpells.level' es undefined o null");
        }*/
      }
    }
  })
}