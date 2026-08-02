// ============================================================================
//  IL PIANO PORTATO VIA: che il file sia un file, e dica quello che si vede.
//
//  Il calcolatore scrive un `.xlsx` a mano: uno zip con dentro qualche XML.
//  È l'unico pezzo del sito che produce un formato altrui, e sbagliarlo di un
//  byte non dà un errore: dà un file che non si apre, e lo scopre chi lo
//  scarica. Nessun'altra verifica lo guarda, perché sul sito non si vede.
//
//  Si controllano tre cose diverse:
//   1. che l'archivio sia formato bene e che ogni XML dentro sia valido;
//   2. che il contenuto sia quello del piano che si sta guardando, numeri
//      compresi, e non un conto rifatto per l'occasione;
//   3. CHE PORTI CON SÉ LE PROPRIE IPOTESI. Un foglio con dentro una proiezione
//      a quarant'anni, riaperto fra sei mesi senza sapere con quali rendimenti
//      è stato fatto, è un foglio che mente.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const PAGINA = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
const src = [...PAGINA.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

const DATI = {quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1975, nascita1:1980,
  ral0:58000, ral1:36000, pens0:2600, pens1:1700,
  annoPens0:2042, annoPens1:2050, pcVoi0:1.5, pcVoi1:1.2, pcDat0:2, pcDat1:1.6,
  iscr0:2018, iscr1:2012, cl3:120000, spesa:2600, rend:5, infl:2, rendFondo:5,
  etaFine:95, fondo0:90000, fondo1:30000, tfrDove0:'fondo', tfrDove1:'fondo',
  tipoFondo0:'collettiva', tipoFondo1:'collettiva', ultimo0:'', ultimo1:'',
  rita0:2042, rita1:2050, quotaCap0:0.6, quotaCap1:1, forma0:'vita', forma1:'vita',
  spesaPens:'', cresc0:'', cresc1:'', pc0:'', pc1:''};

// IL DOM FINTO DEVE FAR SEGUIRE `textContent` A `innerHTML`, come fa un browser vero. Il file
// prende il verdetto da lì — deve contenere quello che si legge in pagina, non una frase
// ricostruita — e con `textContent` sempre vuoto il controllo avrebbe dichiarato buono un file
// col risultato in bianco. Settima volta che un'armatura incompleta mente sul codice buono.
const finto = () => {
  const o = {value:'', className:'', checked:false, min:'', max:'', disabled:false,
    style:{}, dataset:{}, addEventListener(){}, setAttribute(){}, closest:() => null, hidden:false,
    get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }};
  let html = '', testo = '';
  Object.defineProperty(o, 'innerHTML', {
    get: () => html,
    set: v => { html = String(v); testo = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  });
  Object.defineProperty(o, 'textContent', {get: () => testo, set: v => { testo = String(v); }});
  return o;
};
const elementi = {};
globalThis.IntersectionObserver = class { constructor(c){ this.cb = c; } observe(){} };
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis;
globalThis.document = {body:{classList:{toggle(){}}}, querySelectorAll: () => [],
  getElementById: id => elementi[id] ??= Object.assign(finto(),
    {value: DATI[id] === undefined ? '' : String(DATI[id])})};

const M = new Function(src + '\nreturn {calc, leggi, simula, pianoInFoglio};')();
M.calc();
const s = M.leggi(), r = M.simula(s);
const bytes = Buffer.from(M.pianoInFoglio(s, r));

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

// --- 1. L'ARCHIVIO ----------------------------------------------------------
// Si legge la struttura zip a mano: firme, numero di voci, e la coda che dice dove sta
// l'indice. Un archivio che sembra giusto ma ha un offset sbagliato si apre qui e non da Excel.
{
  c('comincia con la firma di un archivio zip', bytes.readUInt32LE(0) === 0x04034b50);
  const fine = bytes.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  c('ha la coda che chiude l\'archivio', fine > 0);
  const voci = bytes.readUInt16LE(fine + 10);
  const dimDir = bytes.readUInt32LE(fine + 12), offDir = bytes.readUInt32LE(fine + 16);
  c('l\'indice sta dove la coda dice', offDir + dimDir === fine,
    `${voci} file, indice a ${offDir}`);
  c('e l\'indice comincia con la sua firma', bytes.readUInt32LE(offDir) === 0x02014b50);

  const attesi = ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels', 'xl/styles.xml',
    'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml'];
  const testo = bytes.toString('latin1');
  const manca = attesi.filter(n => !testo.includes(n));
  c('ci sono tutti i pezzi che un foglio pretende', manca.length === 0, manca.join(', '));
  c('e il numero di voci è quello', voci === attesi.length, String(voci));
}

// --- 2. I PEZZI DENTRO L'ARCHIVIO -------------------------------------------
// I file sono archiviati SENZA compressione: comprimerli avrebbe voluto dire portarsi dentro
// un deflate, per risparmiare venticinque chilobyte. Qui torna comodo, perché si rileggono
// senza decomprimere niente.
// SI LEGGE L'ARCHIVIO DAVVERO, camminando sulle intestazioni locali. Il primo tentativo
// ritagliava i byte cercando il nome e poi il tag di chiusura: sembrava funzionare e invece
// consegnava fette sbagliate, e i due controlli sui numeri fallivano su un file corretto.
// Un lettore vero è più corto di una fetta indovinata, e non può prendere l'una per l'altra.
// È una funzione e non un blocco perché serve due volte: il secondo piano, quello col cambio
// di casa, si rilegge con lo stesso lettore invece di fidarsi di una seconda ritagliatura.
function leggiZip(b){
  const out = {};
  let q = 0;
  while (b.readUInt32LE(q) === 0x04034b50){
    const lung = b.readUInt32LE(q + 18);
    const lnome = b.readUInt16LE(q + 26), lextra = b.readUInt16LE(q + 28);
    const nome = b.toString('utf8', q + 30, q + 30 + lnome);
    const a = q + 30 + lnome + lextra;
    out[nome] = b.toString('utf8', a, a + lung);
    q = a + lung;
  }
  return out;
}
const dentro = leggiZip(bytes);
{
  c('ogni pezzo si rilegge dall\'archivio', Object.keys(dentro).length === 7,
    `${Object.keys(dentro).length} pezzi riletti`);

  // niente parser XML in Node: si controlla quello che rompe davvero un file scritto a mano,
  // cioè i caratteri riservati lasciati liberi dentro il testo
  for (const [nome, x] of Object.entries(dentro)){
    const senzaTag = x.replace(/<[^>]*>/g, '');
    c(`${nome.split('/').pop()}: nessun carattere riservato lasciato libero`,
      !/[<>]/.test(senzaTag) && !/&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(x));
  }
  c('le due schede sono nominate', /name="Il piano"/.test(dentro['xl/workbook.xml'])
    && /name="Anno per anno"/.test(dentro['xl/workbook.xml']));
}

// --- 3. IL CONTENUTO È IL PIANO CHE SI STA GUARDANDO ------------------------
{
  const tab = dentro['xl/worksheets/sheet2.xml'];
  const righe = (tab.match(/<row /g) || []).length;
  c('la tabella ha una riga per esercizio, più l\'intestazione',
    righe === r.righe.length + 1, `${righe} righe per ${r.righe.length} esercizi`);

  // il patrimonio dell'ultimo esercizio dev'essere quello del motore: se il file rifacesse il
  // conto per conto suo, prima o poi direbbe una cosa diversa da quella sullo schermo
  const ultimi = [...tab.matchAll(/<v>(-?[\d.]+)<\/v>/g)].map(m => +m[1]);
  const finale = Math.round(r.finale * 100) / 100;
  c('l\'ultimo patrimonio del file è quello del motore',
    Math.abs(ultimi.at(-1) - finale) < 0.02, `${ultimi.at(-1)} contro ${finale}`);

  const piano = dentro['xl/worksheets/sheet1.xml'];
  // IL VERDETTO VIENE DALLA PAGINA, non ricostruito: il file deve dire quello che si legge
  const verdetto = elementi.titolo.textContent;
  c('il verdetto è nel file, ed è quello scritto in pagina',
    verdetto.length > 10 && piano.includes(verdetto.replace(/&/g, '&amp;')),
    verdetto.slice(0, 60));

  // LE IPOTESI: senza, il file è un elenco di numeri di cui nessuno sa più la provenienza
  for (const [nome, re] of [
    ['il rendimento degli investimenti', /Rendimento degli investimenti/],
    ['il rendimento del comparto',       /Rendimento del comparto/],
    ['l\'inflazione',                    /Inflazione/],
    ['l\'orizzonte',                     /Orizzonte del piano/],
    ['il patrimonio e la spesa',         /Patrimonio investito/],
    ['la data di revisione dei parametri', /Parametri normativi rivisti al/],
    ['in che valuta è la tabella',       /sono espressi in/],
    ['e che non è consulenza',           /non costituisce consulenza/]
  ]) c(`il file dichiara ${nome}`, re.test(piano));

  c('e nomina le persone come le nomina la pagina',
    s.indici.every(i => piano.includes(s.p[i].nome)));

  // L'ABITAZIONE. Senza questo controllo il foglio poteva restare muto sul cambio di casa e
  // tutto il resto sarebbe stato verde lo stesso: chi lo riapre fra sei mesi troverebbe un
  // patrimonio che a un certo anno fa un salto senza che nulla nel file lo spieghi.
  // Il caso base non cambia casa, quindi la scheda NON deve nominarla: si prova il ramo
  // giusto rileggendo il piano con la scelta compiuta.
  c('senza cambio di casa il foglio non ne parla', !/L'ABITAZIONE/.test(piano));
}

// --- 5. IL CAMBIO DI CASA, SE C'È, STA NEL FILE -----------------------------
{
  // GLI ELEMENTI DEL DOM FINTO SONO MEMOIZZATI (`elementi[id] ??=`): il loro `value` è fissato
  // alla prima lettura, quindi riscrivere `DATI` dopo non cambia nulla e i controlli
  // fallirebbero su un codice giusto. Si scrive dove scriverebbe una persona — nella casella —
  // e si tiene allineato anche `DATI` per gli elementi non ancora creati.
  // È l'ottava volta che un'armatura incompleta fa cadere codice buono: si completa l'armatura.
  const scrivi = o => Object.entries(o).forEach(([k, v]) => {
    DATI[k] = v;
    if (elementi[k]) elementi[k].value = String(v);
  });
  const salva = {casaCosa: DATI.casaCosa ?? '', casaAnno: DATI.casaAnno ?? '',
                 casaValore: DATI.casaValore ?? '', casaCanone: DATI.casaCanone ?? ''};
  scrivi({casaCosa: 'affitto', casaAnno: 2045, casaValore: 300000, casaCanone: 900});
  const s2 = M.leggi(), r2 = M.simula(s2);
  const dentro2 = leggiZip(Buffer.from(M.pianoInFoglio(s2, r2)));
  scrivi(salva);

  const piano2 = dentro2['xl/worksheets/sheet1.xml'];
  const tab2   = dentro2['xl/worksheets/sheet2.xml'];
  for (const [nome, re] of [
    ['la scelta compiuta',       /venderla e andare in affitto/],
    ['l\'anno del cambio',       /In che anno/],
    ['il canone',                /Canone mensile/],
    ['i costi, dichiarati stima', /Costi della compravendita \(stima\)/],
    ['il ricavato netto',        /Ricavato netto/]
  ]) c(`col cambio di casa il foglio dichiara ${nome}`, re.test(piano2));

  // LA COLONNA IN PIÙ, per la stessa ragione della tabella in pagina: il foglio esiste per
  // essere rifatto a mano, e una riga a cui manca una voce di flusso non torna.
  c('e la tabella guadagna la colonna della casa', /Casa/.test(tab2));
  const intest = (tab2.match(/<row [^>]*>[\s\S]*?<\/row>/) || [''])[0];
  c('che nell\'intestazione sta fra il fondo e la spesa',
    intest.indexOf('Casa') > intest.indexOf('Fondo e TFR')
    && intest.indexOf('Casa') < intest.indexOf('Spesa'));
}

// --- 4. IL PULSANTE È SPENTO FINCHÉ NON C'È UN PIANO ------------------------
// Scaricare un file vuoto, o peggio il conto di prima, è il modo silenzioso di consegnare un
// documento sbagliato: chi lo apre non ha modo di sapere che non era il suo.
{
  c('col modulo compilato il pulsante è acceso', elementi.scarica.disabled === false);

  const salva = {...DATI};
  // «cl3» è il patrimonio: da quando non si chiede più intero, il patrimonio è la somma delle
  // quattro classi e il modulo di prova lo mette tutto in una. Toglierla è quindi togliere il
  // patrimonio — che è la proprietà che questo controllo vuole davvero provare.
  const COME_SI_CHIAMA = {spesa: 'la spesa', cl3: 'il patrimonio', nascita0: 'la nascita'};
  for (const k of Object.keys(COME_SI_CHIAMA)){
    Object.assign(DATI, salva); delete DATI[k];
    for (const id of Object.keys(elementi))
      elementi[id].value = DATI[id] === undefined ? '' : String(DATI[id]);
    M.calc();
    c(`senza ${COME_SI_CHIAMA[k]} il pulsante si spegne`, elementi.scarica.disabled === true);
  }
  Object.assign(DATI, salva);
}

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n  il piano si porta via, e si porta dietro le sue ipotesi');
if (ko) process.exitCode = 1;
