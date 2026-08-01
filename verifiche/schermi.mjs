// ============================================================================
//  CHE IL SITO STIA DENTRO LO SCHERMO.
//
//  Fino al 01/08/2026 non c'era nessuna media query se non quella di stampa, e
//  a 390 px il modulo usciva dal video: le caselle tagliate a destra, il
//  contenuto non compilabile. Nessuno dei 204 controlli se n'era accorto,
//  perché tutti leggono frasi e numeri e nessuno guarda la larghezza.
//
//  QUESTO CONTROLLO È IN NODE PURO e non apre un browser, per stare nella
//  catena di `verifica.mjs` senza portarsi dietro Chrome. È quindi una
//  euristica, non una resa: legge le griglie a colonne FISSE e verifica che
//  ciascuna, sommata ai suoi vuoti, stia nella larghezza utile più stretta
//  che il sito dichiara di sostenere — a meno che una media query non la
//  ridefinisca. Prende esattamente la classe di difetto che si era prodotta:
//  `.due` (1fr 134 134), `.cur` e `.passo` (74 1fr 250), `.fase`
//  (100 1fr 208 132), tutte larghe più dello schermo di un telefono.
//
//  La resa vera si guarda con gli occhi, in Chrome, a più larghezze: il modo
//  è descritto nel README. Un'euristica non sostituisce lo sguardo, ma non si
//  dimentica mai di girare.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const SITO = join(QUI, '..', 'sito');

// la larghezza più stretta che il sito dichiara di sostenere, e quanto ne toglie il margine
const MINIMA = 320;
const PADDING = 28;          // .pagina, 14 px per lato sotto i 600
const UTILE = MINIMA - PADDING;

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

for (const file of fs.readdirSync(SITO).filter(f => f.endsWith('.html'))){
  const h = fs.readFileSync(join(SITO, file), 'utf8');
  const stile = [...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  if (!stile.trim()) continue;

  // le regole che stanno DENTRO una media query sono già una risposta al problema:
  // si guardano solo quelle di base
  const senzaMedia = stile.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const strette = [];
  for (const m of senzaMedia.matchAll(/([^{};]+)\{([^}]*grid-template-columns\s*:[^;}]+)[;}]/g)){
    const sel = m[1].trim().split('\n').pop().trim();
    const col = (m[2].match(/grid-template-columns\s*:\s*([^;}]+)/) || [, ''])[1];
    const px = [...col.matchAll(/(\d+(?:\.\d+)?)px/g)].map(x => +x[1]);
    if (!px.length) continue;
    // i vuoti fra le colonne
    const reg = senzaMedia.slice(m.index, m.index + 400);
    const gap = +((reg.match(/gap\s*:\s*[\d.]+px\s+([\d.]+)px/) ||
                   reg.match(/gap\s*:\s*([\d.]+)px/) || [, 0])[1]);
    const n = col.trim().split(/\s+(?![^(]*\))/).length;
    const totale = px.reduce((a, b) => a + b, 0) + gap * (n - 1);
    if (totale > UTILE) strette.push({sel, col: col.trim(), totale: Math.round(totale)});
  }
  // per ciascuna, deve esistere una media query che la ridefinisce
  const scoperte = strette.filter(s => {
    const nome = s.sel.replace(/[.#]/g, '\\$&');
    const re = new RegExp('@media[^{]*\\{[\\s\\S]*?' + nome + '[^}]*grid-template-columns');
    return !re.test(stile);
  });
  c(`${file}: ogni griglia a colonne fisse sta in ${MINIMA} px, o è ridefinita`,
    scoperte.length === 0,
    scoperte.length ? scoperte.map(s => `${s.sel} chiede ${s.totale} px`).join(' · ')
                    : (strette.length ? `${strette.length} griglie larghe, tutte ridefinite` : ''));
}

// e che una media query per gli schermi stretti esista: senza, non c'è niente da ridefinire
const idx = fs.readFileSync(join(SITO, 'index.html'), 'utf8');
const soglie = [...idx.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map(m => +m[1]);
c('il calcolatore dichiara almeno una soglia per gli schermi stretti', soglie.length > 0,
  soglie.length ? soglie.sort((a,b)=>b-a).join(' px, ') + ' px' : 'nessuna');
c('e la più bassa arriva sotto i 400 px, dove stanno i telefoni',
  soglie.length > 0 && Math.min(...soglie) <= 400, soglie.length ? Math.min(...soglie) + ' px' : '');

// le tabelle non devono far scorrere la pagina: il loro contenitore scorre da sé
for (const file of ['il-metodo.html', 'come-prendere-il-fondo.html', 'contributo-datore.html']){
  const h = fs.readFileSync(join(SITO, file), 'utf8');
  const conte = [...h.matchAll(/<div class="(conto|scorre)">/g)].map(m => m[1]);
  const stile = [...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const scorrono = new Set();
  // il selettore è l'ULTIMA riga prima della graffa: `[^{};]+` si porta dietro il commento che
  // sta sopra, e un commento con una virgola dentro spezza lo split. Ci sono cascato scrivendo
  // questo stesso controllo, che dava rosso mentre Chrome dava verde.
  for (const m of stile.matchAll(/([^{}]+)\{[^}]*overflow-x\s*:\s*(auto|scroll)/g)){
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim().split('\n').pop();
    for (const x of sel.split(',')) scorrono.add(x.trim().replace(/^\./, ''));
  }
  const senza = [...new Set(conte)].filter(x => !scorrono.has(x));
  c(`${file}: i contenitori di tabelle scorrono da sé`, senza.length === 0, senza.join(', '));
}

// --- NASCOSTO VUOL DIRE INVISIBILE ------------------------------------------
// L'attributo `hidden` nasconde con una regola del BROWSER, che ha la specificità più bassa che
// esista: qualunque `display` scritto su una classe la batte. Un elemento con `display:flex` e
// `hidden` resta quindi in mezzo alla pagina, e il codice che lo spegne non spegne niente.
//
// È successo due volte. La prima a `.sommario`, e fu aggiunta la riga gemella `[hidden]`. La
// seconda al banner del consenso, che per ore non si è chiuso con NESSUNO dei due pulsanti,
// mentre tutte le prove erano verdi: guardavano `el.hidden`, cioè l'intenzione, invece di quello
// che si vede. E con lo stesso difetto è venuto fuori `.cur`, la riga del cursore che non si è
// mai nascosta con una persona sola.
//
// Qui si guarda senza browser: se una classe dichiara un `display` ED è di un elemento che
// qualcuno spegne con `hidden`, deve esistere la sua regola `[hidden]`.
for (const file of fs.readdirSync(SITO).filter(f => f.endsWith('.html'))){
  const h = fs.readFileSync(join(SITO, file), 'utf8');
  const stile = [...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

  // le classi con un `display` d'autore, escluse le regole `[hidden]` stesse e la stampa
  const conDisplay = new Set();
  for (const m of stile.matchAll(/([^{}]+)\{([^}]*)\}/g)){
    const sel = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim().split('\n').pop();
    if (sel.includes('[hidden]') || /display\s*:\s*none/.test(m[2])) continue;
    if (!/(^|;)\s*display\s*:/.test(m[2])) continue;
    // LA CLASSE CHE CONTA È IL SOGGETTO DEL SELETTORE, non quelle degli antenati: in
    // `.durataFraz u{display:block}` il display sta sulla `u`, e l'attributo `hidden` su
    // `.durataFraz` funziona benissimo. Prendendo tutte le classi del selettore il controllo
    // segnalava un codice giusto — nono falso positivo di questa famiglia in questo progetto,
    // e sempre lo stesso errore: una regex che guarda più di quello che deve.
    for (const parte of sel.split(',')){
      const soggetto = parte.trim().split(/[\s>+~]+/).pop() || '';
      for (const c of soggetto.match(/\.[\w-]+/g) || []) conDisplay.add(c.slice(1));
    }
  }
  const protette = new Set([...stile.matchAll(/\.([\w-]+)\[hidden\]/g)].map(m => m[1]));

  // le classi di elementi che vengono spenti: `hidden` scritto nel markup, oppure raggiunti
  // dal codice con `closest('.classe')` per poi assegnargli `hidden`
  const spente = new Set();
  // L'ATTRIBUTO È `hidden`, NON `aria-hidden`. Con `\b` il trattino è un confine, quindi
  // `aria-hidden="true"` risultava un elemento spento: ottavo falso positivo di questa famiglia
  // in questo progetto, e sempre lo stesso errore — una regex che promette una precisione che
  // non ha. Qui l'attributo si riconosce dal confine vero: spazio prima, fine o uguale dopo.
  for (const m of h.matchAll(/<\w+((?:[^>"']|"[^"]*"|'[^']*')*)>/g))
    if (/(?:^|\s)hidden(?=[\s>=]|$)/.test(m[1]))
    for (const c of ((m[1].match(/class="([^"]*)"/) || [, ''])[1]).split(/\s+/)) if (c) spente.add(c);
  for (const m of h.matchAll(/closest\('\.([\w-]+)'\)/g)) spente.add(m[1]);

  const scoperte = [...spente].filter(c => conDisplay.has(c) && !protette.has(c));
  c(`${file}: ogni elemento spento con «hidden» ha la sua regola`, scoperte.length === 0,
    scoperte.map(x => `.${x} ha un display ma non .${x}[hidden]`).join(' · '));
}

console.log(ko ? `\n  ✗ ${ko} controlli falliti` : '\n  nessuna griglia esce dallo schermo');
if (ko) process.exitCode = 1;
