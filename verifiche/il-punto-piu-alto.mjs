// ============================================================================
//  IL PUNTO PIÙ ALTO, CONTRO LA FORZA BRUTA.
//
//  Il calcolatore consiglia la percentuale di versamento che lascia più soldi
//  alla fine, e non la cerca spazzolando il cursore: prova un elenco di punti
//  notevoli. Fra un punto e l'altro il patrimonio finale è lineare, quindi il
//  massimo di una spezzata sta su un vertice — ma UN VERTICE DIMENTICATO È UN
//  MASSIMO MANCATO, e non c'è nulla che lo faccia notare: la pagina scrive una
//  percentuale plausibile, con una cifra plausibile accanto, e nessun controllo
//  la contraddice.
//
//  Il 07/08/2026 ne mancavano tre generi, e la misura è questa: su trecento
//  piani casuali, OTTANTA consigli non ottimi, il peggiore da 136.840 €.
//   · gli spigoli della detrazione dell'art. 13 e della somma del cuneo
//     (15.000 e 8.500 €), perché l'elenco delle soglie era scritto a mano e si
//     era fermato a quelle dell'ulteriore detrazione;
//   · la FRONTIERA DELLA TENUTA, che non è un vertice della spezzata ma un
//     vincolo: oltre una certa percentuale il piano non arriva in fondo, e
//     l'ottimo di una funzione crescente sotto vincolo sta sul bordo;
//   · gli spigoli che il modello ha e che non vale la pena enumerare, tipo il
//     minimo fra versato e montante.
//
//  QUESTO CONTROLLO È L'UNICO CHE POTEVA VEDERLI, perché è l'unico che non
//  crede all'elenco: spazzola il cursore a passo 0,1 — il passo vero, quello
//  che l'utente può raggiungere — e pretende che la risposta rapida valga
//  quanto quella lenta. Nel percorso caldo la spazzolata è impraticabile
//  (settecento giri di motore per persona, contro i trenta millisecondi in cui
//  il ricalcolo si sente mentre si scrive in una casella); qui costa un secondo
//  a build, ed è il posto giusto per pagarlo.
//
//  node verifiche/il-punto-piu-alto.mjs
// ============================================================================
// L'armatura sta in `_armatura.mjs`, una per tutti i controlli. `DATI` è riassegnato a ogni
// piano: il risolutore legge il binding, e ogni piano parte dal modulo appena aperto.
import { sorgente, documento, prepara, controllaChiavi, moduloIniziale } from './_armatura.mjs';
const src = sorgente();
const MODULO = moduloIniziale();
let DATI = MODULO;
prepara();
globalThis.document = documento(id => DATI[id] === undefined ? undefined : String(DATI[id]));
const M = new Function(src + `\nreturn {leggi, simula, conAlt, migliore, affina,
  candidatiVersamento, pcSoglia, pcTenuta, pcMassimo, meglioDi};`)();

// stesso generatore seminato delle invarianti: i piani sono sempre gli stessi, e una
// violazione si riproduce invece di comparire e sparire fra un lancio e l'altro
const SEME = Number(process.env.SEME ?? 20260807);
let stato = SEME >>> 0;
const casuale = () => {
  stato = (stato + 0x6D2B79F5) >>> 0;
  let x = stato;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
const R = (a,b) => a + casuale()*(b-a), I = (a,b) => Math.round(R(a,b)), P = l => l[I(0,l.length-1)];
const eur = n => Math.round(n).toLocaleString('it-IT', {useGrouping:'always'}) + ' €';

// LA TOLLERANZA È DICHIARATA, e non è zero per una ragione: fra due percentuali diverse dello
// stesso decimo il finale può differire di qualche euro per come cadono gli arrotondamenti, e
// un controllo che pretende l'uguaglianza esatta fallirebbe su una risposta giusta. Cento euro
// su patrimonî da centinaia di migliaia è sotto il rumore; il difetto vero ne valeva 136.840.
const TOLLERANZA = 100;
const PIANI = 40;

let peggio = 0, peggioCaso = null, guardati = 0, mancati = 0;
for (let n = 0; n < PIANI; n++){
  const nascita0 = I(1960, 2000);
  DATI = {...MODULO, quanti:'1', cl3:Math.round(R(0,400000)), spesa:Math.round(R(500,4000)), spesaPens:'',
    rend:+R(0,8).toFixed(1), infl:+R(0,4).toFixed(1), rendFondo0:+R(0,8).toFixed(1), rendFondo1:+R(0,8).toFixed(1),
    etaFine:I(80,100), nascita0, ral0:Math.round(R(8000,90000)),
    pens0:Math.round(R(500,3000)), annoPens0:nascita0 + I(62,70),
    fondo0:Math.round(R(0,300000)), pcVoi0:+R(0,3).toFixed(1), pcDat0:+R(0,3).toFixed(1),
    pcMin0:P(['', 0, +R(0,3).toFixed(1)]), tfrDove0:P(['fondo','azienda']), iscr0:I(1990,2025),
    quotaCap0:+R(0,1).toFixed(2), forma0:P(['vita','rev','certa','durata','frazionata']),
    anniFraz0:P(['', I(5,25)]), rita0:'', ultimo0:'', cresc0:P(['', +R(0,3).toFixed(1)]),
    tfrGia0:P(['', '', Math.round(R(0,150000))]), annoLav0:P(['', I(1985,2020)]),
    casaCosa:'resto', casaAnno:'', casaValore:'', casaNuova:'', casaCanone:'', nome0:'Anna'};
  // le chiavi del generatore sono sempre le stesse: si confrontano con le caselle vere una volta
  if (n === 0) controllaChiavi(DATI, 'il generatore del punto più alto');

  let s, x, pcMax, b;
  try {
    s = M.leggi(); x = s.p[0];
    if (!(x.ral > 0)) continue;
    pcMax = Math.max(M.pcMassimo(x), 0.1);
    // ESATTAMENTE la catena della pagina, non una sua parafrasi: se qui si scrivesse una
    // ricerca «equivalente», il controllo misurerebbe sé stesso e non il calcolatore.
    b = M.affina(s, 0, 'pc', M.migliore(s, 0, 'pc',
      M.candidatiVersamento(x, pcMax, [...M.pcSoglia(s, 0, pcMax), ...M.pcTenuta(s, 0, pcMax)])),
      pcMax);
  } catch (e) { console.log(`  KO  il motore va in errore: ${e.message}`); process.exit(1); }
  if (b === null) continue;

  // la forza bruta, sul passo vero del cursore
  let vero = null;
  for (let p = 0; p <= pcMax + 1e-9; p += 0.1){
    const v = +p.toFixed(1);
    const r = M.simula({...s, p: s.p.map((y, j) => j === 0 ? {...y, pc: v} : y)});
    const c = {v, f: r.finale, z: r.annoZero, regge: r.annoZero === null};
    if (vero === null || M.meglioDi(c, vero)) vero = c;
  }
  guardati++;
  // il confronto in euro ha senso solo fra due piani che arrivano tutti e due in fondo: fra due
  // che si esauriscono la differenza non misura niente, ed è la stessa ragione per cui la pagina
  // in quel caso non scrive una cifra. Lì si pretende soltanto che il verdetto coincida.
  if (vero.regge !== b.regge){
    mancati++;
    console.log(`  KO  la ricerca sbaglia perfino sulla tenuta: vertici ${b.v}%`
      + ` (${b.regge ? 'regge' : 'si esaurisce'}) contro forza bruta ${vero.v}%`);
    continue;
  }
  if (!vero.regge) continue;
  const perso = vero.f - b.f;
  if (perso > TOLLERANZA){
    mancati++;
    if (perso > peggio){ peggio = perso; peggioCaso = {b: b.v, vero: vero.v, ral: DATI.ral0}; }
  }
}

console.log(`  ${guardati} piani spazzolati a passo 0,1 sull'intero cursore`);
if (mancati === 0){
  console.log(`  ok  la ricerca sui vertici trova sempre il massimo vero (tolleranza ${eur(TOLLERANZA)})`);
} else {
  console.log(`  KO  ${mancati} piani su ${guardati} in cui il punto consigliato non è il migliore`);
  if (peggioCaso)
    console.log(`      peggiore: consiglia ${peggioCaso.b}% invece di ${peggioCaso.vero}%`
      + ` — ${eur(peggio)} lasciati lì (RAL ${eur(peggioCaso.ral)})`);
  console.log(`      si riproduce con: SEME=${SEME} node verifiche/il-punto-piu-alto.mjs`);
  process.exit(1);
}
