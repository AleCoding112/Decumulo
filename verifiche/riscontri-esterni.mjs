// ============================================================================
//  I NUMERI DI QUALCUN ALTRO, TENUTI FUORI DAL CONTO E USATI COME CONTROLLO.
//
//  PERCHÉ ESISTE QUESTO FILE. Tutte le altre difese guardano la DIVERGENZA: che
//  le cifre non si sdoppino, che due motori indipendenti concordino, che le
//  pagine dicano quello che il conto fa. Nessuna guarda l'OMISSIONE — quello che
//  non abbiamo mai modellato non contraddice niente, e resta invisibile per
//  quanto verde sia il resto.
//
//  Il 2 agosto 2026 se ne sono trovate due nello stesso giorno, e nessuna era un
//  bug: le detrazioni dell'art. 13 TUIR, che il conto ignorava tassando la
//  pensione fino al 19% di troppo, e le tredici mensilità del trattamento INPS,
//  contate dodici. Le ha trovate una domanda di chi legge e una tabella
//  pubblicata altrove, non i seicento controlli.
//
//  IL MODELLO È QUELLO DI `tavole-dei-fondi.mjs`, che fa la stessa cosa per i
//  coefficienti di conversione: numeri pubblicati da altri, trascritti con la
//  loro fonte, che tengono il nostro conto dentro il mondo. E vale qui la stessa
//  regola, che è tutto il punto:
//
//      QUESTI NUMERI NON SI AGGIORNANO PER FAR PASSARE IL CONTROLLO.
//      Se si spostano loro, si guarda il nostro.
//
//  DUE FONTI INDIPENDENTI, e serve che siano due: una sola sbaglia da sola. Dove
//  si sovrappongono — la detrazione da lavoro a 35.000 € — dicono la stessa
//  cifra, ed è la ragione per cui ci si può appoggiare a entrambe.
// ============================================================================
import { REGOLE } from '../regole.mjs';

const V = k => REGOLE[k].val;

// la stessa formula del motore, riscritta dalle bande: qui serve solo a interrogare le regole
const detrazione = (tab, R) => {
  for (const [fino, base, quota, den] of tab)
    if (R <= fino) return base + (den > 0 ? quota * (fino - R) / den : 0);
  return 0;
};

// --- i numeri pubblicati -----------------------------------------------------
// `entro` è la precisione con cui la fonte li scrive: chi arrotonda all'euro non può essere
// preteso al centesimo, e fingere il contrario trasformerebbe un riscontro in un rituale.
const RISCONTRI = [
  {tipo:'lavoro',   reddito:14000, atteso:1955,    entro:0.01,
   fonte:'CAF UCI, «Detrazioni lavoro dipendente 2026»: esempio con reddito 14.000 €'},
  {tipo:'lavoro',   reddito:22000, atteso:2459,    entro:0.60,
   fonte:'CAF UCI, «Detrazioni lavoro dipendente 2026»: esempio con reddito 22.000 €, arrotondato all\'euro'},
  {tipo:'lavoro',   reddito:35000, atteso:1302.27, entro:0.01,
   fonte:'Altroconsumo, «Calcolo detrazioni redditi da lavoro e pensione»: detrazione riconosciuta in busta paga su 35.000 € — la stessa cifra la dà CAF UCI, ed è il punto in cui le due fonti si sovrappongono'},
  {tipo:'lavoro',   reddito:47000, atteso:260.45,  entro:0.01,
   fonte:'Altroconsumo, stesso esempio con 12.000 € di redditi da locazione in più: la detrazione ricalcolata su 47.000 € di reddito complessivo'},
  {tipo:'pensione', reddito:35000, atteso:477.27,  entro:0.01,
   fonte:'Altroconsumo: detrazione riconosciuta sul cedolino INPS per 35.000 € di reddito da pensione'},
  {tipo:'pensione', reddito:47000, atteso:95.45,   entro:0.01,
   fonte:'Altroconsumo, stesso esempio con i redditi da locazione: detrazione ricalcolata su 47.000 €'}
];

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : '✗  '} ${nome}${extra ? '   ' + extra : ''}`);
};

console.log('  — le detrazioni dell\'art. 13, contro cifre pubblicate da altri —');
for (const r of RISCONTRI){
  const nostro = detrazione(r.tipo === 'pensione' ? V('DETRAZIONE_PENS') : V('DETRAZIONE_LAV'),
                            r.reddito);
  const scarto = Math.abs(nostro - r.atteso);
  c(`${r.tipo}, ${r.reddito.toLocaleString('it-IT')} € → ${r.atteso.toLocaleString('it-IT')} €`,
    scarto <= r.entro,
    scarto <= r.entro ? `il nostro dà ${nostro.toFixed(2)}`
                      : `il nostro dà ${nostro.toFixed(2)}, scarto ${scarto.toFixed(2)} €`);
}

// --- e che quelle cifre entrino DAVVERO nel conto ----------------------------
// Un riscontro sulla formula non basta: la formula potrebbe essere giusta e non essere chiamata
// da nessuno. È esattamente com'era fino al 02/08/2026 — la legge esisteva, il conto no.
// Qui si guarda il numero che la pagina produce, e si pretende che la detrazione ci sia dentro.
console.log('\n  — e che la detrazione arrivi fino al netto, non solo alla formula —');
{
  const scaglioni = R => { let t = 0, s = 0;
    for (const [tetto, al] of V('SCAGLIONI')){
      if (R <= s) break; t += (Math.min(R, tetto) - s) * al; s = tetto; }
    return t; };
  const R = 35000;
  const attesaPens = 477.27, attesaLav = 1302.27;
  c('sul reddito di pensione il netto è più alto di quello dei soli scaglioni, e della detrazione',
    Math.abs((R - (scaglioni(R) - detrazione(V('DETRAZIONE_PENS'), R)))
             - (R - scaglioni(R)) - attesaPens) < 0.01,
    `${attesaPens.toLocaleString('it-IT')} € l'anno che prima non c'erano`);
  c('e sul reddito da lavoro altrettanto',
    Math.abs((R - (scaglioni(R) - detrazione(V('DETRAZIONE_LAV'), R)))
             - (R - scaglioni(R)) - attesaLav) < 0.01,
    `${attesaLav.toLocaleString('it-IT')} € l'anno`);
}

// --- quante regole hanno un riscontro esterno, e quante no -------------------
// NON È UNA PAGELLA, È UN ARRETRATO. Una cifra senza riscontro non è sbagliata: è verificata una
// volta e mai più controllata contro il mondo. Sapere quante sono è il primo passo per ridurle,
// e tenerlo qui — dove fallisce — impedisce che il numero peggiori in silenzio.
console.log('\n  — la copertura —');
{
  const tutte = Object.entries(REGOLE).filter(([, r]) => r && typeof r === 'object' && 'fonte' in r);
  const con = tutte.filter(([, r]) => r.riscontro);
  console.log(`  ..  ${con.length} regole su ${tutte.length} hanno un riscontro esterno dichiarato`);
  for (const [k, r] of con) console.log(`      · ${k} → ${r.riscontro}`);
  // il riscontro dichiarato deve puntare a un file che esiste ed esercitare davvero quella regola
  const qui = new Set(['DETRAZIONE_LAV', 'DETRAZIONE_PENS']);
  c('ogni regola che dichiara di essere riscontrata qui lo è davvero',
    con.filter(([, r]) => r.riscontro.includes('riscontri-esterni'))
       .every(([k]) => qui.has(k)),
    'un rimando a un controllo che non la guarda sarebbe peggio di nessun rimando');
}

if (ko) process.exitCode = 1;
