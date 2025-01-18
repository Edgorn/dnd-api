import { rgb, StandardFonts } from "pdf-lib";

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

export async function escribirRasgos({ traits, pdfDoc, terrain }: any) {
  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let textY1 = page1.getHeight() - 395;
  let textY2 = page2.getHeight() - 385;
  let textY3 = page2.getHeight() - 385;
  let maxHeight1 = 44
  let maxHeight2 = 20

  traits?.forEach((trait: any) => {
    const { textY, actualHeight: actualHeight1 } = escribirParrafo({ 
      titulo: trait?.name, 
      descripcion: trait?.desc,
      fontTitle: fontBold,
      fontText: fontRegular,
      maxWidth: 170,
      page: page1,
      x: 412,
      y: textY1,
      maxHeight: maxHeight1
    })

    if (maxHeight1 === actualHeight1) {
      const { textY, actualHeight: actualHeight2 } = escribirParrafo({ 
        titulo: trait?.name, 
        descripcion: trait?.desc,
        fontTitle: fontBold,
        fontText: fontRegular,
        maxWidth: 180,
        page: page2,
        x: 230,
        y: textY2,
        maxHeight: maxHeight2
      })

      if (maxHeight2 === actualHeight2) {
        const { textY } = escribirParrafo({ 
          titulo: trait?.name, 
          descripcion: trait?.desc,
          fontTitle: fontBold,
          fontText: fontRegular,
          maxWidth: 180,
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
  const maxWidth = 170;

  escribirParrafo({ 
    titulo: '', 
    descripcion: background?.personality ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page1,
    x,
    y: page1.getHeight() - 147
  })

  escribirParrafo({ 
    titulo: background?.ideals?.split('.')[0] ?? '', 
    descripcion: background?.ideals?.split('.')[1] ?? background?.ideals ?? '',
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


export async function escribirEquipo({ pdfDoc, equipment }: any) {

  const pages = pdfDoc.getPages();
  const page1 = pages[0]
  const page2 = pages[1]
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const maxWidth = 170;

  const equipo = equipment
    .filter((equip: any) => equip.category === "Arma" || equip.category === "Armadura")
    .map((equip: any) => {
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
    maxWidth,
    page: page1,
    x: 267,
    y: page1.getHeight() - 622
  })
  
  escribirParrafo({ 
    titulo: '', 
    descripcion: tesoro?.join('\n') ?? '',
    fontTitle: fontBold,
    fontText: fontRegular,
    maxWidth,
    page: page2,
    x: 230,
    y: page2.getHeight() - 613
  })
}