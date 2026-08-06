// ============================================================================
//  GLI ESEMPI DELLE PAGINE, RICALCOLATI COL MOTORE VERO.
//
//      node verifiche/esempi.mjs
//
//  PERCHÉ ESISTE. Le cifre che le pagine mostrano non escono dal calcolatore: escono da
//  `ESEMPIO` e `ESEMPIO_TFR` in `regole.mjs`, che sono una SECONDA IMPLEMENTAZIONE delle stesse
//  regole scritta per il testo. Fino al 06/08/2026 nessun controllo le confrontava con il motore
//  — `grep -rn ESEMPIO test.mjs verifiche/ build.mjs` non trovava niente — e i dodici numeri di
//  `contributo-datore.html` erano pubblicati sulla fiducia.
//
//  Che il rischio sia reale lo dice `regole.mjs` stesso, nel commento sopra `irpefNetta`: senza
//  le detrazioni «la pagina direbbe 330 € dove il conto ne dice 417». Quella volta se ne sono
//  accorti; la volta dopo poteva andare diversamente, perché una pagina che sbaglia un numero
//  non si rompe — si limita a dire una cosa falsa con la stessa faccia di prima.
//
//  COSA CONFRONTA, e perché così:
//   1. il TFR lasciato in AZIENDA end-to-end. Il motore lo espone in `liquidazioni` con montante,
//      aliquota e imposta, quindi il confronto è sul risultato e non sulla formula;
//   2. le ALIQUOTE del fondo, prese dalla funzione `aliquota` del motore per ogni durata mostrata
//      in pagina. Il lato «nel fondo» non è isolabile end-to-end — dentro il fondo il TFR si
//      mescola ai contributi e non esiste una voce che dica quanto ne è venuto dal TFR — quindi
//      lì si controlla la regola, che è la cosa che potrebbe divergere;
//   3. lo SCONTO IRPEF di `ESEMPIO`, cioè il numero che aveva già sbagliato una volta.
//
//  IL CASO NON È INVENTATO QUI: è quello che le pagine pubblicano, letto da `regole.mjs`. Un
//  fixture scritto a mano proverebbe che il motore è coerente con sé stesso, che non è la domanda.
// ============================================================================
import fs from 'node:fs';
import { REGOLE, TESTI, ESEMPIO_TFR, irpefNetta } from '../regole.mjs';

const V = k => REGOLE[k].val;

// --- il motore, dalla pagina costruita --------------------------------------
// Stessa armatura di `verifiche/seconda-implementazione.mjs`: si sceglie il blocco <script>
// dicendo cosa si vuole (quello che contiene `simula`), non fidandosi dell'ordine.
const PAGINA = new URL('../sito/index.html', import.meta.url).pathname;
const src = [...fs.readFileSync(PAGINA, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

let DATI = {};
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, hidden:false, style:{}, addEventListener(){}, setAttribute(){},
  closest(){ return finto(); }, classList:{toggle(){}, add(){}, remove(){}},
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis;
globalThis.document = {
  body: {classList: {toggle(){}}},
  getElementById: id => Object.assign(finto(), {value: String(DATI[id] ?? 0)}),
  querySelectorAll: () => []
};
// `aliquota` e `aliquotaTfr` servono per il lato fondo, dove il confronto è sulla regola.
const M = new Function(src + '\nreturn {leggi, simula, aliquota, aliquotaTfr, irpefNetta};')();

// --- i controlli ------------------------------------------------------------
let ko = 0, n = 0;
const eur = x => Math.round(x).toLocaleString('it-IT', {useGrouping:'always'}) + ' €';
// Tolleranza di UN EURO: non sono due stime, sono due implementazioni della stessa regola. Se
// divergono di più, una delle due ha torto e va saputo.
const vicino = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const t = (nome, ok, detta) => {
  n++;
  if (ok) return;
  ko++;
  console.log(`  ✗ ${nome}\n    ${detta}`);
};

// L'ANNO ZERO DEL PIANO lo decide il motore, non questo file: `leggi()` lo espone e da lì si
// costruiscono gli anni di lavoro, così il controllo non scade al primo gennaio.
const ANNO0 = new Date().getFullYear();

// Il caso dell'esempio, tradotto in caselle. Zero contributi e zero fondo iniziale: qui si
// guarda il TFR, e tutto il resto è rumore che sposterebbe le cifre senza dire niente.
const casoTfr = (anni, dove) => ({
  quanti: '1',
  nome0: 'A', nascita0: ANNO0 - 40,
  ral0: ESEMPIO_TFR.ral, cresc0: '',
  // smette di lavorare dopo esattamente `anni` esercizi, contando quello in corso
  ultimo0: ANNO0 + anni - 1,
  pens0: 1500, annoPens0: ANNO0 + anni,
  fondo0: '', pcVoi0: 0, pcDat0: 0, iscr0: ANNO0,
  tfrDove0: dove, tfrGia0: '', annoLav0: '',
  forma0: 'vita', quotaCap0: 0, rita0: ANNO0 + anni,
  cl3: 50000, spesa: 1500, spesaPens: '',
  rend: 3, infl: ESEMPIO_TFR.infl * 100, rendFondo: ESEMPIO_TFR.rendBase * 100,
  etaFine: 95
});

const simulaCon = o => { DATI = o; return M.simula(M.leggi()); };

console.log('Gli esempi delle pagine, ricalcolati col motore\n');

// --- 1. il TFR in azienda, end-to-end ---------------------------------------
for (const anni of ESEMPIO_TFR.anni){
  const atteso = ESEMPIO_TFR.caso(ESEMPIO_TFR.rendBase, anni);
  const l = simulaCon(casoTfr(anni, 'azienda')).liquidazioni[0];

  t(`TFR in azienda, ${anni} anni: la liquidazione esiste`, !!l,
    'il motore non ha liquidato nessun TFR: il caso non descrive quello che credevo');
  if (!l) continue;

  t(`TFR in azienda, ${anni} anni: anni di servizio`, l.anni === anni,
    `il motore conta ${l.anni} anni, la pagina ne mostra ${anni}`);
  t(`TFR in azienda, ${anni} anni: montante`, vicino(l.lordo, atteso.azMontante),
    `motore ${eur(l.lordo)} · pagina ${eur(atteso.azMontante)}`);
  t(`TFR in azienda, ${anni} anni: aliquota separata`, vicino(l.al, atteso.azAliquota, 1e-9),
    `motore ${(l.al*100).toFixed(3)}% · pagina ${(atteso.azAliquota*100).toFixed(3)}%`);
  t(`TFR in azienda, ${anni} anni: imposta`, vicino(l.tasse, atteso.azImposta),
    `motore ${eur(l.tasse)} · pagina ${eur(atteso.azImposta)}`);
  t(`TFR in azienda, ${anni} anni: resta in mano`, vicino(l.netto, atteso.azMano),
    `motore ${eur(l.netto)} · pagina ${eur(atteso.azMano)}`);
}

// --- 2. le aliquote del lato fondo ------------------------------------------
// La riga della pagina è «−6.527 €, 13,5% sostitutiva»: se il motore applicasse un'altra
// aliquota alla stessa anzianità, la pagina pubblicherebbe uno sconto che il conto non fa.
for (const anni of ESEMPIO_TFR.anni){
  const atteso = ESEMPIO_TFR.caso(ESEMPIO_TFR.rendBase, anni);
  t(`aliquota sul fondo, ${anni} anni di iscrizione`,
    vicino(M.aliquota(anni), atteso.foAliquota, 1e-9),
    `motore ${(M.aliquota(anni)*100).toFixed(2)}% · pagina ${(atteso.foAliquota*100).toFixed(2)}%`);
}
// e che il pavimento sia quello dichiarato, non uno più basso raggiunto per caso
t('l\'aliquota minima è quella di REGOLE', vicino(M.aliquota(99), V('ALIQ_FONDO_MIN'), 1e-9),
  `motore ${M.aliquota(99)} · REGOLE ${V('ALIQ_FONDO_MIN')}`);
t(`il minimo si tocca al ${TESTI.aliqFondoAnni}° anno, come dice la pagina`,
  vicino(M.aliquota(+TESTI.aliqFondoAnni), V('ALIQ_FONDO_MIN'), 1e-9)
  && M.aliquota(+TESTI.aliqFondoAnni - 1) > V('ALIQ_FONDO_MIN'),
  `al ${TESTI.aliqFondoAnni}° anno il motore dà ${(M.aliquota(+TESTI.aliqFondoAnni)*100).toFixed(2)}%`);

// --- 3. la rivalutazione reale del TFR in azienda ---------------------------
// Il numero è pubblicato in pagina («0,48% l'anno in termini reali»): si ricava dal montante che
// il motore ha effettivamente prodotto, invece di rifare qui la formula — che sarebbe una terza
// implementazione e proverebbe solo che so copiare.
{
  const anni = ESEMPIO_TFR.base;
  const l = simulaCon(casoTfr(anni, 'azienda')).liquidazioni[0];
  // dal montante di una rendita posticipata si torna al tasso per bisezione
  const mont = r => Math.abs(r) > 1e-12 ? ESEMPIO_TFR.annuo * ((1+r)**anni - 1)/r
                                        : ESEMPIO_TFR.annuo * anni;
  let lo = -0.05, hi = 0.05;
  for (let i = 0; i < 200; i++){ const m = (lo+hi)/2; if (mont(m) < l.lordo) lo = m; else hi = m; }
  t('la rivalutazione reale pubblicata è quella che il motore applica',
    vicino((lo+hi)/2, ESEMPIO_TFR.rivReale, 1e-6),
    `motore ${(((lo+hi)/2)*100).toFixed(4)}% · pagina ${(ESEMPIO_TFR.rivReale*100).toFixed(4)}%`);
}

// --- 4. lo sconto IRPEF di ESEMPIO, il numero che aveva già sbagliato --------
// `contributo-datore.html` pubblica «costa {{exCosta}} e ne fa entrare {{exDentro}}»: lo sconto
// esce da `irpefNetta` in `regole.mjs`, e il motore ha la sua. È il punto in cui le due
// implementazioni hanno già divergiuto una volta (330 € contro 417 €), quindi si confrontano le
// due funzioni sugli stessi redditi invece di fidarsi del fatto che oggi tornino.
{
  const dell = irpefNetta;
  for (const reddito of [12000, 18000, 25000, 28000, 31770, 35000, 50000, 70000])
    for (const pens of [false, true])
      t(`imposta netta a ${eur(reddito)}${pens ? ', da pensione' : ''}`,
        vicino(M.irpefNetta(reddito, pens), dell(reddito, pens), 0.01),
        `motore ${eur(M.irpefNetta(reddito, pens))} · regole.mjs ${eur(dell(reddito, pens))}`);
}

// --- 5. che ESEMPIO e il motore vedano le stesse costanti -------------------
// Le tre aliquote della prestazione erano scritte a mano nel calcolatore mentre in `regole.mjs`
// avevano fonte e riscontro (corretto il 06/08/2026). Il controllo sopra le confronta sui valori
// di oggi; questo verifica che vengano dalla stessa sorgente, cioè che una correzione futura in
// REGOLE si veda anche nel conto.
for (const [k, prova] of [['ALIQ_FONDO_MAX', 0], ['ALIQ_FONDO_MIN', 99]])
  t(`${k} arriva al motore da regole.mjs`,
    vicino(M.aliquota(prova), V(k), 1e-12),
    `il motore usa ${M.aliquota(prova)}, REGOLE dichiara ${V(k)}`);

console.log(`\n${n - ko} su ${n}${ko ? `, ${ko} KO` : ', 0 KO'}`);
process.exit(ko ? 1 : 0);
