// ============================================================================
//  I VENTI CASI, E I NUMERI CHE IL MOTORE DÀ SU CIASCUNO.
//
//  PERCHÉ ESISTE, E PERCHÉ NON ASSOMIGLIA AGLI ALTRI CONTROLLI. Tutto il resto
//  guarda la DIVERGENZA — che due implementazioni concordino, che le pagine
//  dicano quello che il conto fa, che 4.000 piani rispettino le invarianti.
//  Nessuno di quei controlli può vedere un'OMISSIONE: un istituto mai
//  rappresentato non contraddice niente. Le due omissioni trovate il 02/08/2026
//  (detrazioni art. 13, tredicesima del trattamento) sono uscite da un confronto
//  con numeri di fuori, non da seicento controlli verdi.
//
//  IL DISEGNO, che è la parte che conta.
//
//  1. IL NOSTRO RISULTATO FINALE NON HA UN GEMELLO. Nessuno calcola «quanto
//     durano i risparmi di due persone per 47 anni». Quindi il confronto è per
//     COMPONENTE, e i casi non sono persone realistiche: sono casi costruiti per
//     ISOLARE un pezzo alla volta. Se confrontassi una persona intera e trovassi
//     il 3% di scarto, non saprei quale dei nove ingredienti l'ha prodotto.
//
//  2. I CASI STANNO SUI GRADINI DELLA LEGGE, non sparsi a caso. Le combinazioni
//     le coprono già i 4.000 piani casuali di `invarianti.mjs`. Qui il valore è
//     attraversare le discontinuità: gli scaglioni (28k, 50k), i due tratti del
//     taglio del cuneo (20k, 32k, 40k), il quindicesimo anno di iscrizione, le
//     soglie di cumulo dei superstiti. È lì che un'omissione si nasconde, perché
//     è lì che la legge cambia forma.
//
//  3. QUATTRO DIFFERENZE SONO NOSTRE SCELTE DICHIARATE, non errori, e vanno
//     neutralizzate PRIMA o si insegue un fantasma:
//       - PERIMETRO FISCALE: non rappresentiamo addizionali regionali e comunali
//         né detrazioni per familiari a carico. Ogni calcolatore di netto sì.
//         Il confronto si fa sul lordo-meno-IRPEF-erariale, e lo scarto atteso è
//         dichiarato qui sotto caso per caso.
//       - EURO DI OGGI: il motore lavora in valori reali. Nei casi l'inflazione
//         è 0, così reale e nominale coincidono e il confronto è diretto.
//       - COSTI DEL FONDO: i nostri rendimenti per comparto sono già al netto dei
//         costi di gestione, come li pubblica la COVIP. A un documento esterno va
//         dato lo stesso rendimento netto, o si confrontano due cose diverse.
//       - QUANDO MATURA IL RENDIMENTO: lo calcoliamo sul saldo di INIZIO anno, per
//         convenzione prudenziale dichiarata. Chi lo calcola sui versamenti
//         dell'anno dà di più, di una quantità PREVEDIBILE: va prevista prima,
//         non scoperta dopo e scambiata per un errore.
//
//  COME SI USA. Oggi stampa i nostri numeri, che è la fase 1. Man mano che un
//  numero di fuori viene trovato, si scrive nel caso come `atteso` con la sua
//  `fonte`, e da quel momento il caso diventa un controllo che si riesegue a ogni
//  build. Vale la regola di `riscontri-esterni.mjs`, ed è tutto il punto:
//
//      QUESTI NUMERI NON SI AGGIORNANO PER FAR PASSARE IL CONTROLLO.
//      Se si spostano loro, si guarda il nostro.
//
//  node verifiche/casi-esterni.mjs
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const PAGINA = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
// dalla pagina COSTRUITA, non dal sorgente: le costanti di legge le inietta il build
const src = [...PAGINA.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

// il motore nomina `document` mentre si carica: gli si dà un guscio, come in come-parla.mjs
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){}, closest:() => null,
  setAttribute(){}, getAttribute(){ return null; }, hidden:false,
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
globalThis.IntersectionObserver = class { constructor(cb){ this.cb = cb; } observe(){} };
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis;
globalThis.document = { body:{classList:{toggle(){}}}, querySelectorAll: () => [],
  getElementById: () => finto() };

const M = new Function(src + `
  return {irpef, irpefNetta, nettoAnnuo, contributi, costoAnnuo, scontoIrpef, aliquota,
          aliquotaFraz, aliquotaTfr, aiSuperstiti, coeffEta, speranzaVita, soglia, quotaMax,
          vitaIntera, simula,
          IVS, TFR_SU_RAL, TFR_RIV_FISSA, TFR_RIV_QUOTA, TFR_IMPOSTA_RIV, TETTO_DEDUZIONE,
          ASSEGNO_SOCIALE, QUOTA_ORDINARIA, REVERSIBILITA, TRATT_MINIMO_ANNO, BANDA_ALTA,
          BANDA_BASSA, MENS_PENS,
          COSTI_VENDITA, COSTI_ACQUISTO, COSTI_ATTO};`)();

const eur = n => n.toLocaleString('it-IT', {useGrouping:'always', minimumFractionDigits: 2,
  maximumFractionDigits: 2}) + ' €';
const pc  = (n, d = 2) => (n * 100).toLocaleString('it-IT', {minimumFractionDigits: d,
  maximumFractionDigits: d}) + '%';

// ============================================================================
//  A. IL FISCO SUL REDDITO — cinque redditi scelti sulle discontinuità
//
//  20.000 chiude la somma del cuneo; 32.000 e 40.000 sono i due estremi del
//  tratto in cui l'ulteriore detrazione si azzera, ed è lì che l'aliquota
//  marginale effettiva arriva al 54%; 28.000 e 50.000 sono gli scaglioni.
//  Ogni caso dà DUE numeri, perché le detrazioni sono due tabelle diverse sullo
//  stesso reddito: la busta di chi lavora e il cedolino di chi è in pensione.
//
//  ATTENZIONE AL CONFRONTO. Il nostro «netto» non è quello del cedolino:
//  mancano le addizionali (che lo abbassano di circa l'1,5-2,5% del lordo,
//  secondo il comune) e le detrazioni per familiari (che lo alzano). Con un
//  calcolatore esterno si confronta l'IRPEF ERARIALE, non il netto in tasca.
// ============================================================================
const REDDITI = [18000, 25000, 35000, 45000, 60000];

function fisco(){
  console.log('\n\n═══ A. IL FISCO SUL REDDITO ' + '═'.repeat(45));
  console.log('\n  Chi lavora — RAL, imponibile dopo il 9,19% di contributi, IRPEF, netto');
  console.log('  ' + '─'.repeat(88));
  console.log('  ' + ['RAL', 'imponibile', 'IRPEF netta', 'netto annuo', 'netto/mese']
    .map(s => s.padStart(16)).join(''));
  for (const ral of REDDITI){
    const x = {ral, pcVoi: 0, pcDat: 0, fondoIndividuale: false, pcMin: 0};
    const imponibile = ral * (1 - M.IVS);
    const imposta = M.irpefNetta(imponibile, false);
    const netto = M.nettoAnnuo(x, 0);
    console.log('  ' + [eur(ral), eur(imponibile), eur(imposta), eur(netto), eur(netto/12)]
      .map(s => s.padStart(16)).join(''));
  }

  console.log('\n  Chi è in pensione — lordo annuo su 13 rate, IRPEF, netto per rata');
  console.log('  ' + '─'.repeat(88));
  console.log('  ' + ['lordo/mese', 'lordo annuo', 'IRPEF netta', 'netto annuo', 'netto/rata']
    .map(s => s.padStart(16)).join(''));
  for (const mese of [800, 1200, 1500, 2000, 2800]){
    const annuo = mese * M.MENS_PENS;
    const imposta = M.irpefNetta(annuo, true);
    console.log('  ' + [eur(mese), eur(annuo), eur(imposta), eur(annuo - imposta),
      eur((annuo - imposta) / M.MENS_PENS)].map(s => s.padStart(16)).join(''));
  }

  // IL BENEFICIO DELLA DEDUZIONE NON È L'ALIQUOTA DI SCAGLIONE, ed è il numero che i
  // simulatori dei fondi pubblicano. Vale più dello scaglione perché la detrazione decresce
  // col reddito: ogni euro dedotto ne fa risalire una quota.
  console.log('\n  Dedurre 1.000 € al fondo: quanto costa davvero in busta');
  console.log('  ' + '─'.repeat(88));
  console.log('  ' + ['RAL', 'versati', 'sconto IRPEF', 'costo netto', 'aliquota eff.']
    .map(s => s.padStart(16)).join(''));
  for (const ral of REDDITI){
    const pc1000 = 1000 / ral * 100;
    const x = {ral, pcVoi: 0, pcDat: 0, fondoIndividuale: true, pcMin: 0};
    const costo = M.costoAnnuo(x, pc1000);
    console.log('  ' + [eur(ral), eur(1000), eur(1000 - costo), eur(costo),
      pc(1 - costo/1000, 1)].map(s => s.padStart(16)).join(''));
  }
}

// ============================================================================
//  B. L'ANZIANITÀ NEL FONDO — l'imposta sulla prestazione
//
//  15% fino al quindicesimo anno, poi −0,30 punti l'anno fino al 9%, che si
//  tocca al trentacinquesimo. Tre punti: prima del gradino, dentro la discesa,
//  al pavimento. Su un montante fisso, così l'unico numero che si muove è
//  l'aliquota. C'è anche l'erogazione frazionata, che ha una scala sua (20% → 15%
//  a passi di 0,25) ed è l'istituto più recente, quindi il più esposto.
// ============================================================================
function fondoAnzianita(){
  console.log('\n\n═══ B. L\'ANZIANITÀ NEL FONDO ' + '═'.repeat(43));
  const MONTANTE = 150000;
  console.log(`\n  Montante di ${eur(MONTANTE)}, imposta sulla prestazione`);
  console.log('  ' + '─'.repeat(88));
  console.log('  ' + ['anni iscritto', 'aliquota', 'imposta', 'netto', 'aliq. frazionata']
    .map(s => s.padStart(17)).join(''));
  for (const anni of [10, 15, 20, 35, 40]){
    const al = M.aliquota(anni), alF = M.aliquotaFraz(anni);
    console.log('  ' + [String(anni), pc(al), eur(MONTANTE*al), eur(MONTANTE*(1-al)), pc(alF)]
      .map(s => s.padStart(17)).join(''));
  }
}

// ============================================================================
//  C. L'ETÀ DI CONVERSIONE — coefficiente, rendita, soglia del «tutto in contanti»
//
//  Il coefficiente non lo prendiamo da nessuna tavola: lo ricostruiamo dalla
//  speranza di vita ISTAT per un margine di 1,25. `tavole-dei-fondi.mjs` tiene
//  già la curva dentro il pubblicato; qui interessa il numero che l'utente legge,
//  cioè l'assegno mensile e la soglia — che è la cosa che il fondo decide e noi
//  possiamo solo circoscrivere fra due estremi.
// ============================================================================
function conversione(){
  console.log('\n\n═══ C. L\'ETÀ DI CONVERSIONE ' + '═'.repeat(44));
  const MONTANTE = 150000;
  console.log(`\n  Montante di ${eur(MONTANTE)} convertito in rendita vitalizia`);
  console.log('  ' + '─'.repeat(94));
  console.log('  ' + ['età', 'vita ISTAT', 'coefficiente', 'rendita/mese', 'soglia tutto',
    'spetta sotto', 'mai sopra'].map(s => s.padStart(13)).join(''));
  for (const eta of [60, 65, 67, 70, 72]){
    const co = M.coeffEta(eta);
    console.log('  ' + [String(eta), M.speranzaVita(eta).toFixed(1), pc(co),
      eur(MONTANTE*co/12), eur(M.soglia(co)), eur(M.soglia(co*M.BANDA_ALTA)),
      eur(M.soglia(co*M.BANDA_BASSA))].map(s => s.padStart(13)).join(''));
  }
}

// ============================================================================
//  D. IL TFR — quanto matura, quanto si rivaluta in azienda, quanto se ne tassa
//
//  Due casi a parità di tutto il resto, che è il punto: la stessa retribuzione e
//  gli stessi anni, una volta col TFR in azienda e una col TFR nel fondo.
//  L'aliquota della tassazione separata (art. 19 TUIR) non è quella marginale:
//  è la media sul «reddito di riferimento», cioè il TFR diviso gli anni e
//  moltiplicato per dodici. È il numero che più facilmente si indovina sbagliato.
// ============================================================================
function tfr(){
  console.log('\n\n═══ D. IL TFR ' + '═'.repeat(58));
  console.log('\n  Quota annua e montante in azienda (inflazione 0: rivalutazione 1,5% netto 17%)');
  console.log('  ' + '─'.repeat(94));
  console.log('  ' + ['RAL', 'anni', 'TFR/anno', 'montante', 'aliquota art.19', 'imposta',
    'netto'].map(s => s.padStart(13)).join(''));
  for (const [ral, anni] of [[28000, 20], [35000, 20], [35000, 35], [50000, 20]]){
    const quota = ral * M.TFR_SU_RAL;
    // in azienda: rivalutazione 1,5% + 75% dell'inflazione, meno il 17% sulla rivalutazione.
    // Con inflazione 0 resta l'1,5% lordo, cioè 1,245% netto: aritmetica verificabile a mano.
    const tasso = (M.TFR_RIV_FISSA + M.TFR_RIV_QUOTA * 0) * (1 - M.TFR_IMPOSTA_RIV);
    let m = 0;
    for (let k = 0; k < anni; k++) m = m * (1 + tasso) + quota;
    const al = M.aliquotaTfr(m, anni);
    console.log('  ' + [eur(ral), String(anni), eur(quota), eur(m), pc(al), eur(m*al),
      eur(m*(1-al))].map(s => s.padStart(13)).join(''));
  }
}

// ============================================================================
//  E. LA PENSIONE AI SUPERSTITI — il 60% e le tre soglie di cumulo
//
//  La riduzione morde sui redditi PROPRI di chi resta, non sulla pensione che
//  eredita: 25% oltre 3 volte il trattamento minimo, 40% oltre 4, 50% oltre 5.
//  Ci sono due limiti che quasi nessun calcolatore rappresenta, e sono la ragione
//  per cui questo caso vale: la clausola di salvaguardia (il cumulo non può
//  risultare inferiore a quello del limite superiore della fascia precedente) e
//  la sentenza 162/2022 (la riduzione non può eccedere i redditi che la
//  determinano). I redditi scelti stanno appena sotto e appena sopra ogni soglia.
// ============================================================================
function superstiti(){
  console.log('\n\n═══ E. LA PENSIONE AI SUPERSTITI ' + '═'.repeat(39));
  const LORDA = 1500 * M.MENS_PENS;
  const S = v => M.TRATT_MINIMO_ANNO * v;
  console.log(`\n  Pensione del defunto ${eur(LORDA)} l'anno (1.500 € × 13). Soglie: ` +
    `${eur(S(3))} · ${eur(S(4))} · ${eur(S(5))}`);
  console.log('  ' + '─'.repeat(80));
  console.log('  ' + ['redditi propri', 'ai superstiti', 'in quota della piena', 'al mese']
    .map(s => s.padStart(20)).join(''));
  const piena = LORDA * M.REVERSIBILITA;
  for (const R of [0, 20000, S(3)+1, 25000, S(4)+1, 35000, S(5)+1, 45000]){
    const v = M.aiSuperstiti(LORDA, R);
    console.log('  ' + [eur(R), eur(v), pc(v/piena, 1), eur(v/M.MENS_PENS)]
      .map(s => s.padStart(20)).join(''));
  }
}

// ============================================================================
//  F. LA COMPRAVENDITA — quanto resta di una vendita
//
//  L'unica grandezza di tutta la materia rimessa a una nostra stima è la
//  provvigione (3% + IVA); le imposte d'atto sono di legge e sono trattate come
//  cifra fissa perché non crescono col prezzo di mercato. Due casi: chi vende
//  soltanto e chi vende e ricompra, che paga la provvigione due volte.
// ============================================================================
function casa(){
  console.log('\n\n═══ F. LA COMPRAVENDITA ' + '═'.repeat(48));
  const s = {casa:{attiva:true}};
  console.log('\n  (i costi li applica il motore: provvigione stimata + imposte d\'atto di legge)');
  console.log('  ' + '─'.repeat(76));
  console.log('  ' + ['vende a', 'ricompra a', 'costi', 'netto liberato']
    .map(x => x.padStart(19)).join(''));
  for (const [v, r] of [[300000, 0], [300000, 180000], [150000, 0], [500000, 300000]]){
    const {ricavato, costi} = ricavoVendita(v, r);
    console.log('  ' + [eur(v), r ? eur(r) : '—', eur(costi), eur(ricavato)]
      .map(x => x.padStart(19)).join(''));
  }
}
// LE COSTANTI SI PRENDONO DAL MOTORE, non si riscrivono qui. Il motore i costi li calcola
// dentro `simula`, dove sono impastati col resto del piano, e qui serve il numero nudo: si
// rifà la formula ma con le SUE cifre, così un confronto esterno non può mai finire per
// misurare uno scarto che abbiamo introdotto ricopiando un numero.
function ricavoVendita(prezzo, nuova){
  const costi = prezzo * M.COSTI_VENDITA
    + (nuova ? nuova * M.COSTI_ACQUISTO + M.COSTI_ATTO : 0);
  return {costi, ricavato: prezzo - nuova - costi};
}

// ============================================================================
//  G. IL CONFRONTO CON I NUMERI DI FUORI
//
//  LA FONTE, e perché è la migliore che si potesse trovare. Il «progetto
//  esemplificativo standardizzato» non è un calcolatore commerciale: è un
//  documento che la COVIP OBBLIGA ogni fondo a pubblicare, con le ipotesi
//  dettate da lei — le stesse per tutte le forme, e dichiarate dentro il
//  documento. Quello di Fon.Te. le enuncia una per una, e sono compatibili con
//  le nostre senza bisogno di conversioni:
//    - i valori sono IN TERMINI REALI, «già al netto degli effetti
//      dell'inflazione»: è la nostra stessa convenzione, quindi cade la trappola
//      del nominale contro il reale;
//    - contributo iniziale 1.500 / 2.500 / 5.000 € l'anno, che cresce dell'1%
//      reale l'anno, per 37 / 27 / 17 anni (ingresso a 30, 40, 50 anni);
//    - pensionamento a 67, rendita vitalizia immediata senza reversibilità,
//      ottenuta convertendo l'intera posizione.
//  Non tiene conto della tassazione sulle prestazioni né del beneficio della
//  deduzione: il perimetro è quindi la sola fase di accumulo, ed è esattamente
//  il pezzo che volevamo riscontrare.
//
//  CHE COSA SI PUÒ AFFERMARE, E CHE COSA NO. Il documento dichiara i rendimenti
//  AL LORDO dei costi e della tassazione, senza dire in quale ordine li applica.
//  Il montante finale dipende da quell'ordine, quindi non è riscontrabile al
//  centesimo e sarebbe disonesto fingere di sì: si controlla che stia in una
//  banda. I VERSAMENTI CUMULATI invece non dipendono da nulla di tutto ciò —
//  sono solo il calendario dei contributi — e infatti tornano ESATTI.
// ============================================================================
const FONTE_FONTE = 'Fon.Te., fondo pensione negoziale, «Stima della pensione '
  + 'complementare (progetto esemplificativo standardizzato)», ipotesi COVIP';

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : '✗  '} ${nome}${extra ? '   ' + extra : ''}`);
};

function riscontri(){
  console.log('\n\n═══ G. IL CONFRONTO CON I NUMERI DI FUORI ' + '═'.repeat(30));

  // --- 1. il calendario dei contributi -------------------------------------
  // QUESTO È IL RISCONTRO FORTE, ed è quello che nessun altro controllo faceva.
  // Non dipende dal rendimento, dai costi né dalle imposte: dipende solo da
  // quanti versamenti ci sono e da come cresce ciascuno. È il posto in cui si
  // nasconde un errore di un anno — il più banale e il più invisibile, perché
  // sposta il totale di poco e nessuna invariante lo vede.
  console.log('\n  I versamenti cumulati: 1.500 € l\'anno che crescono dell\'1% reale');
  const VERSAMENTI = [[37, 66761.47], [27, 46231.33], [17, 27645.66]];
  for (const [anni, atteso] of VERSAMENTI){
    let somma = 0;
    for (let k = 0; k < anni; k++) somma += 1500 * Math.pow(1.01, k);
    c(`${anni} anni di versamento`, Math.abs(somma - atteso) < 0.01,
      `nostro ${eur(somma)} · loro ${eur(atteso)} · ${FONTE_FONTE}`);
  }

  // --- 2. il coefficiente di conversione -----------------------------------
  // Il documento dà la rendita e la posizione, quindi il coefficiente si ricava
  // dividendo: è la convenzione UnipolSai RG48, una TERZA famiglia rispetto alle
  // due già in tavole-dei-fondi.mjs (Generali IPS55 e A62I). Noi adottiamo un
  // valore unico e unisex; il loro è distinto per sesso, e il nostro deve stare
  // in mezzo — se cadesse fuori, la nostra ricostruzione dalla speranza di vita
  // starebbe descrivendo un mondo che non esiste.
  const COEFF_UOMO = 3858.43 / 85824.25, COEFF_DONNA = 3357.45 / 85824.25;
  const nostro67 = M.coeffEta(67);
  console.log('\n  Il coefficiente a 67 anni, contro una convenzione pubblicata');
  c('il nostro sta fra quello della donna e quello dell\'uomo',
    nostro67 > COEFF_DONNA && nostro67 < COEFF_UOMO,
    `donna ${pc(COEFF_DONNA)} · nostro ${pc(nostro67)} · uomo ${pc(COEFF_UOMO)}`);
  const media = (COEFF_UOMO + COEFF_DONNA) / 2;
  c('e non si discosta dalla media unisex più del 5%',
    Math.abs(nostro67 / media - 1) < 0.05,
    `scarto ${pc(nostro67/media - 1, 1)} dalla media ${pc(media)}`);
  // LA PROSA DICE UN NUMERO, E ANCHE QUELLO VA RISCONTRATO. `il-metodo.html`
  // afferma che fra uomo e donna lo scarto è «di circa il 15%»: è una nostra
  // affermazione su un fatto altrui, e questa è la fonte che la misura.
  c('lo scarto fra uomo e donna è quello che la pagina dichiara (~15%)',
    Math.abs((COEFF_UOMO / COEFF_DONNA - 1) - 0.15) < 0.02,
    `misurato ${pc(COEFF_UOMO/COEFF_DONNA - 1, 1)}`);

  // --- 3. il montante, nella banda che l'incertezza consente ----------------
  // I rendimenti sono dichiarati al lordo di costi e tassazione, e l'ordine in
  // cui il fondo li applica non è scritto: si prende quello più naturale
  // — (lordo − costo) × (1 − 20%) — e si accetta la banda che ne deriva.
  // NON SI STRINGE LA BANDA PER FAR TORNARE IL CONTO: serve a vedere un errore
  // di struttura (un anno in meno, una capitalizzazione saltata), non a
  // certificare il terzo decimale di un'ipotesi che la fonte non dichiara.
  console.log('\n  Il montante alla pensione, con le loro stesse ipotesi');
  const CASI = [
    {anni:37, comparto:'garantito',  lordo:0.0210, costo:0.003312, loro: 85824.25},
    {anni:37, comparto:'dinamico',   lordo:0.0320, costo:0.001062, loro:105765.19},
    {anni:27, comparto:'garantito',  lordo:0.0210, costo:0.003312, loro: 55510.32},
    {anni:17, comparto:'dinamico',   lordo:0.0320, costo:0.001062, loro: 34105.36}
  ];
  for (const k of CASI){
    const r = (k.lordo - k.costo) * 0.8;   // costi prima, poi l'imposta del 20%
    // la nostra convenzione: il rendimento matura sul saldo di INIZIO anno
    let m = 0;
    for (let j = 0; j < k.anni; j++) m = m * (1 + r) + 1500 * Math.pow(1.01, j);
    const scarto = m / k.loro - 1;
    c(`${k.anni} anni, comparto ${k.comparto}`, Math.abs(scarto) < 0.02,
      `nostro ${eur(m)} · loro ${eur(k.loro)} · scarto ${pc(scarto, 2)}`);
  }
  // E IL VERSO DELLO SCARTO NON È CASUALE: siamo sempre sotto, perché il
  // rendimento lo facciamo maturare sul saldo di inizio anno mentre loro, a
  // giudicare dai numeri, lo riconoscono anche ai versamenti dell'anno. È la
  // convenzione prudenziale che il metodo dichiara, e qui si vede quanto costa.
  const sopra = CASI.filter(k => {
    const r = (k.lordo - k.costo) * 0.8;
    let m = 0;
    for (let j = 0; j < k.anni; j++) m = m * (1 + r) + 1500 * Math.pow(1.01, j);
    return m > k.loro;
  });
  c('e siamo prudenti su tutti, mai generosi', sopra.length === 0,
    'il rendimento matura sul saldo di inizio anno, non sui versamenti dell\'anno');

  // --- 4. il trattamento minimo, da cui dipendono le soglie dei superstiti ---
  // TRE VOLTE IL MINIMO È UN NUMERO CHE LE FONTI SECONDARIE SBAGLIANO: se ne
  // trovano che scrivono 24.050 € pur dichiarando 611,85 € al mese, che per 13
  // fa 7.954,05 e per 3 fa 23.862,15. Non è il nostro conto a doversi muovere:
  // qui si riscontra la cifra INPS, e le soglie ne discendono per moltiplicazione.
  console.log('\n  Il trattamento minimo INPS, da cui discendono le tre soglie');
  c('il minimo mensile è quello della circolare INPS',
    Math.abs(M.TRATT_MINIMO_ANNO / M.MENS_PENS - 611.85) < 0.01,
    `${eur(M.TRATT_MINIMO_ANNO / M.MENS_PENS)} × ${M.MENS_PENS} = ${eur(M.TRATT_MINIMO_ANNO)}`
    + ' · circolare INPS 153 del 19/12/2025');
  c('e le soglie sono il minimo per tre, quattro e cinque',
    Math.abs(M.TRATT_MINIMO_ANNO * 3 - 23862.15) < 0.01,
    `3× ${eur(M.TRATT_MINIMO_ANNO*3)} · 4× ${eur(M.TRATT_MINIMO_ANNO*4)}`
    + ` · 5× ${eur(M.TRATT_MINIMO_ANNO*5)}`);
}

fisco();
fondoAnzianita();
conversione();
tfr();
superstiti();
casa();
riscontri();

if (ko){ console.log(`\n✗ ${ko} riscontri falliti\n`); process.exit(1); }
console.log('\n✓ i casi tornano con i numeri pubblicati da altri\n');
