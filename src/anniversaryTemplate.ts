import { mk, type El } from './store'

/**
 * Modelo editorial baseado no panfleto de aniversario D&D (153 x 207 mm).
 * Todos os campos comerciais sao elementos independentes e editaveis.
 * Fotos sao placeholders: importe as fotos oficiais no editor.
 */
const COLORS = { pink: '#E92B55', purple: '#853AEB', green: '#19B866', cream: '#FCEAE1', dark: '#1B1421' }

function txt(x: number, y: number, w: number, h: number, text: string, fontPt: number, color = COLORS.dark, align: 'left' | 'center' | 'right' = 'center', bold = true): El {
  return mk('text', { x, y, w, h, text, fontPt, color, align, bold, font: 'Montserrat' })
}

function base(): El[] {
  return [
    txt(0, 0, 153, 34, ' ', 8, COLORS.cream),
    txt(31, 4, 91, 5, 'T E M P O   D E   F L O R E S C E R', 7, COLORS.green),
    txt(28, 9, 93, 9, 'ANIVERSÁRIO', 20, COLORS.pink),
    txt(34, 17, 74, 16, 'D&D', 36, COLORS.purple),
    txt(108, 12, 38, 12, 'D&D', 25, COLORS.green),
    txt(109, 23, 35, 5, 'cosméticos', 9, COLORS.green, 'center', false),
    txt(0, 0, 30, 25, '🌼', 39, '#F4C500'),
    txt(1, 18, 31, 17, '🌸', 31, COLORS.purple),
    txt(125, 0, 28, 25, '🌻', 35, '#F7B92C'),
    txt(126, 20, 27, 15, '🌺', 29, COLORS.purple),
  ]
}

type Item = [brand: string, name: string, de: string, por: string, seal?: string]
const frontItems: Item[] = [
  ['FHAN', 'Liphoney Gloss Labial de Mel 5g com Pingente', '69,90', '19,99'],
  ['AVON', 'Color Trend Mascara Incolor 8g', '29,99', '14,99'],
  ['AVON', 'Supershock Volume Max 10ml', '42,99', '19,99'],
  ['AVON', 'Color Trend Disney Mascara de Cilios 7ml', '29,99', '9,99'],
  ['EUDORA', 'H Colonia Masculina 100ml', '124,90', '74,99'],
  ['EUDORA', 'Pulse Colonia Masculina 100ml', '94,99', '69,99'],
  ['EUDORA', 'Chic Retro Colonia Feminina 95ml', '129,90', '79,99'],
  ['EUDORA', 'Siage Pro Cronology Curvas Shampoo + Condicionador', '102,98', '79,99'],
  ['EUDORA', 'Siage Resgate Imediato Mascara Balm 250g', '74,99', '39,99'],
  ['NUANCE', 'Kit Viagem Sol de Copacabana Shampoo + Condicionador', '49,97', '24,99', 'LANÇAMENTO'],
]
const backItems: Item[] = [
  ['JEQUITI', 'Cebolinha Colonia Masculina 25ml', '39,90', '19,99'],
  ['CICLO', 'Deo Colonia Infantil Cici 100ml', '75,99', '64,99'],
  ['AVON', 'Petit Colonia 50ml', '64,90', '29,99'],
  ['CARMED', 'Fini Minhocas Enxaguante Bucal 250ml', '14,99', '9,99'],
  ['CARMED', 'Fini Dentaduras Gel Dental Anticarie 70g', '14,99', '9,99'],
  ['CARMED', 'Hidratante Labial 10g', '14,99', '9,99'],
  ['AVON', 'Aquavibe Body Splash 300ml', '39,99', '19,99'],
  ['AVON', 'Lov|U Touch Deo Parfum Feminino 75ml', '144,90', '49,99'],
  ['AVON', 'Far Away Deo Parfum Feminino 50ml', '124,90', '64,99'],
  ['JEQUITI', 'Momentos de Amor Sabonete em Barra 4un 80g', '33,90', '19,99'],
  ['JEQUITI', 'Sensi Hidratante Calendula 220ml', '32,90', '14,99'],
  ["BARBOUR'S", 'Body Splash 200ml', '99,90', '49,99'],
]

function cards(items: Item[], yStart: number, rowH: number, cols = 3): El[] {
  const margin = 6
  const gap = 2
  const w = (153 - margin * 2 - gap * (cols - 1)) / cols
  return items.map(([brand, name, de, price, seal], i) => mk('product', {
    x: +(margin + (i % cols) * (w + gap)).toFixed(2),
    y: +(yStart + Math.floor(i / cols) * (rowH + 1.5)).toFixed(2),
    w: +w.toFixed(2), h: rowH, brand, text: name, de, price, cada: '',
    seal: seal ?? '', hue: [44, 175, 260, 308, 220, 34][i % 6],
    color: COLORS.pink, fontPt: 8.5, font: 'Montserrat',
  }))
}

function front(): El[] {
  return [
    ...base(),
    txt(7, 36, 139, 8, 'APROVEITE O DESCONTO PROGRESSIVO  FHADER', 13, COLORS.pink),
    txt(8, 46, 137, 5, 'Eau de Parfum 100ml · Masculino ou Feminino · Qualquer fragrância', 8, COLORS.dark),
    ...([
      [8, 'LEVE 1', '69,90', '99,90', COLORS.purple],
      [56, 'LEVE 2', '110,00', '199,80', COLORS.green],
      [104, 'LEVE 3', '150,00', '299,70', COLORS.purple],
    ] as const).flatMap(([x, label, price, de, color]) => [
      txt(x, 54, 40, 11, '✦  FHADER  ✦', 12, color),
      txt(x, 66, 40, 5, 'DE: R$ ' + de, 7, color),
      txt(x, 72, 40, 8, label, 17, color),
      txt(x, 80, 40, 8, 'R$ ' + price, 16, color),
    ]),
    ...cards(frontItems, 92, 25.2, 4),
    txt(1, 191.5, 151, 6, 'dedcosmeticosonline.com.br   ·   @dedcosmeticosonline', 8, '#FFFFFF'),
    txt(0, 190, 153, 17, ' ', 8, COLORS.purple),
  ].sort((a, b) => a.y === 190 ? -1 : b.y === 190 ? 1 : 0)
}

function back(): El[] {
  return [
    ...base(),
    ...cards(backItems, 38, 36.5, 3),
    txt(0, 191, 153, 16, ' ', 8, COLORS.purple),
    txt(6, 193, 77, 5, 'EM ATÉ 6X SEM JUROS NOS CARTÕES', 8, '#FFFFFF'),
    txt(5, 199, 83, 4, 'Visa · Mastercard · Elo · Pix', 8, '#FFFFFF'),
    txt(91, 193, 57, 9, 'SIGA NOSSO INSTAGRAM', 9, '#FFFFFF'),
    txt(15, 204, 125, 3, 'Ofertas válidas até 07.11.26 ou enquanto durarem os estoques.', 5, '#FFFFFF'),
  ]
}

export function anniversaryTemplate(): El[][] {
  return [front(), back()]
}
