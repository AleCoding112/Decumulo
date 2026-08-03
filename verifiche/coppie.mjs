// ============================================================================
//  LE COPPIE: due piani che differiscono per UNA COSA SOLA, e il verso è
//  dichiarato prima di lanciare.
//
//  PERCHÉ ESISTE, e perché non assomiglia né ai test né alle invarianti.
//  I 326 controlli verificano che il conto sia quello che volevamo. Le
//  invarianti verificano che 4.000 piani rispettino proprietà che abbiamo
//  saputo scrivere. I riscontri esterni verificano che le nostre cifre stiano
//  nel mondo. **Nessuno dei tre chiede se la risposta abbia senso**, e il senso
//  non si automatizza — a meno di non ridurlo a qualcosa che si automatizza.
//
//  QUESTO È IL RIDUZIONISMO CHE FUNZIONA. Non «questo risultato è sensato?»,
//  che è un giudizio e richiede un'autorità che non abbiamo; ma **«spostando
//  questa cosa, il risultato deve muoversi DA QUESTA PARTE»**, che è un fatto e
//  non richiede di sapere la risposta giusta — solo il verso. Chi ha 10.000 €
//  in più non può stare peggio. Chi spende di più non può stare meglio. Chi si
//  è iscritto al fondo prima non può pagare più imposta. Sono affermazioni che
//  si scrivono senza far girare niente, ed è esattamente il punto: **il verso
//  va deciso prima, o si finisce a certificare quello che il codice già fa.**
//
//  DUE REGOLE CHE RENDONO LE COPPIE VERE INVECE CHE CERIMONIALI.
//
//  1. OGNI COPPIA GIRA SU PIÙ PIANI BASE, non su uno. Una monotonia che tiene
//     sul caso comodo può rompersi su chi è già in pensione, su chi ha il piano
//     che si esaurisce, su chi ha una persona sola. Dodici basi, scelte diverse
//     fra loro apposta.
//
//  2. UNA COPPIA CHE NON MUOVE MAI IL RISULTATO È SOSPETTA, e qui fallisce.
//     Se cambio il canone d'affitto e il patrimonio finale non si sposta di un
//     euro su nessuna delle dodici basi, quella coppia non sta provando niente:
//     o la variabile non morde, o non arriva al motore. È la stessa regola che
//     il progetto ha già imparato una volta — «se il confronto non fallisce mai
//     su niente, sospettare» — applicata al contrario: **un controllo che non
//     può fallire non è un controllo.**
//
//  node verifiche/coppie.mjs
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const src = [...fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8')
  .matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

let DATI = {};
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){},
  setAttribute(){}, getAttribute(){ return null; },
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis;
globalThis.document = {body:{classList:{toggle(){}}}, querySelectorAll: () => [],
  // LA CASELLA ASSENTE È VUOTA, NON ZERO. È la lezione appena imparata sulle invarianti:
  // riempire i buchi con un valore di comodo significa provare il valore di comodo. Qui
  // «non l'ho scritto» deve arrivare al motore come stringa vuota, che per certi campi
  // (il minimo del contratto, la crescita, la spesa in pensione) vuol dire un'altra cosa.
  getElementById: id => Object.assign(finto(), {value: String(DATI[id] ?? '')})};
const M = new Function(src + `\nreturn {leggi, simula, spesaSostenibile, contributi,
  costoAnnuo, aiSuperstiti, coeffEta, soglia, irpef, irpefNetta, nettoAnnuo, aliquota};`)();

// --- le dodici basi ---------------------------------------------------------
// Diverse per struttura, non per cifre: una persona e due, chi lavora e chi è già in
// pensione, il piano che regge e quello che si esaurisce, con e senza fondo, con e senza
// casa da cambiare. Se una monotonia vale solo sul caso comodo, qui si vede.
const COMUNE = {rend:4, infl:2, rendFondo:3, etaFine:95, nome0:'Anna', nome1:'Bruno'};
const BASI = {
  'coppia che regge': {...COMUNE, quanti:'2', nascita0:1975, nascita1:1977,
    ral0:38000, ral1:33000, pens0:1500, pens1:1300, annoPens0:2042, annoPens1:2044,
    pcVoi0:1.2, pcVoi1:1.5, pcDat0:2, pcDat1:2, iscr0:2005, iscr1:2007,
    fondo0:60000, fondo1:120000, cl3:200000, spesa:2500,
    quotaCap0:0.5, quotaCap1:0.5, forma0:'vita', forma1:'vita',
    tfrDove0:'fondo', tfrDove1:'fondo'},
  'coppia che si esaurisce': {...COMUNE, quanti:'2', nascita0:1975, nascita1:1977,
    ral0:28000, ral1:0, pens0:1100, pens1:700, annoPens0:2042, annoPens1:2044,
    pcVoi0:1, pcVoi1:0, pcDat0:1.5, pcDat1:0, iscr0:2010, iscr1:2012,
    fondo0:20000, fondo1:0, cl3:60000, spesa:3200,
    quotaCap0:1, quotaCap1:1, forma0:'vita', forma1:'vita',
    tfrDove0:'fondo', tfrDove1:'azienda'},
  'una persona sola': {...COMUNE, quanti:'1', nascita0:1980, ral0:35000, pens0:1400,
    annoPens0:2047, pcVoi0:2, pcDat0:2, iscr0:2008, fondo0:80000, cl3:120000, spesa:1900,
    quotaCap0:0.5, forma0:'vita', tfrDove0:'fondo'},
  'senza fondo pensione': {...COMUNE, quanti:'1', nascita0:1978, ral0:32000, pens0:1350,
    annoPens0:2045, pcVoi0:0, pcDat0:0, iscr0:'', fondo0:'', cl3:250000, spesa:2100,
    quotaCap0:0.5, forma0:'vita', tfrDove0:'azienda'},
  'già in pensione, sola': {...COMUNE, quanti:'1', nascita0:1956, ral0:'', pens0:1600,
    annoPens0:2020, pcVoi0:'', pcDat0:'', iscr0:'', fondo0:'', cl3:180000, spesa:2200,
    quotaCap0:0.5, forma0:'vita', tfrDove0:'fondo'},
  'coppia già in pensione': {...COMUNE, quanti:'2', nascita0:1954, nascita1:1958,
    ral0:'', ral1:'', pens0:1700, pens1:1200, annoPens0:2019, annoPens1:2023,
    pcVoi0:'', pcVoi1:'', pcDat0:'', pcDat1:'', iscr0:'', iscr1:'', fondo0:'', fondo1:'',
    cl3:300000, spesa:2800, quotaCap0:0.5, quotaCap1:0.5, forma0:'vita', forma1:'vita',
    tfrDove0:'fondo', tfrDove1:'fondo'},
  'reddito alto, fondo grosso': {...COMUNE, quanti:'1', nascita0:1968, ral0:90000,
    pens0:3200, annoPens0:2035, pcVoi0:3, pcDat0:1.5, iscr0:1998, fondo0:300000,
    cl3:400000, spesa:4200, quotaCap0:0.5, forma0:'vita', tfrDove0:'fondo'},
  'solo TFR, niente contributi': {...COMUNE, quanti:'1', nascita0:1979, ral0:30000,
    pens0:1250, annoPens0:2046, pcVoi0:0, pcDat0:2, iscr0:2009, fondo0:35000,
    cl3:90000, spesa:2000, quotaCap0:0.5, forma0:'vita', tfrDove0:'fondo'},
  'smette molto prima della pensione': {...COMUNE, quanti:'1', nascita0:1972, ral0:42000,
    pens0:1500, annoPens0:2039, ultimo0:2032, pcVoi0:2, pcDat0:2, iscr0:2002,
    fondo0:150000, cl3:250000, spesa:2400, quotaCap0:0.5, forma0:'vita',
    tfrDove0:'fondo'},
  'vende casa e va in affitto': {...COMUNE, quanti:'2', nascita0:1970, nascita1:1972,
    ral0:36000, ral1:30000, pens0:1450, pens1:1200, annoPens0:2037, annoPens1:2039,
    pcVoi0:1.5, pcVoi1:1.5, pcDat0:2, pcDat1:2, iscr0:2004, iscr1:2006,
    fondo0:90000, fondo1:70000, cl3:180000, spesa:2600,
    casaCosa:'affitto', casaAnno:2045, casaValore:300000, casaCanone:900,
    quotaCap0:0.5, quotaCap1:0.5, forma0:'vita', forma1:'vita',
    tfrDove0:'fondo', tfrDove1:'fondo'},
  'compra una casa più piccola': {...COMUNE, quanti:'1', nascita0:1966, ral0:34000,
    pens0:1500, annoPens0:2033, pcVoi0:1.5, pcDat0:2, iscr0:2000, fondo0:110000,
    cl3:150000, spesa:2300, casaCosa:'piccola', casaAnno:2040, casaValore:280000,
    casaNuova:170000, quotaCap0:0.5, forma0:'vita', tfrDove0:'fondo'},
  // SI CHIAMAVA «fondo sottoscritto per conto proprio», e il nome è cambiato col campo che lo
  // distingueva: senza `tipoFondo` sarebbe rimasto un caso identico a un altro con un'etichetta
  // che prometteva di provare qualcos'altro. Ora dichiara quello che è davvero — nessuna quota
  // dal datore — che è la via d'uscita di chi quel contributo non lo riceve.
  'nessuna quota dal datore': {...COMUNE, quanti:'1', nascita0:1974,
    ral0:45000, pens0:1700, annoPens0:2041, pcVoi0:2.5, pcDat0:'', iscr0:2006,
    fondo0:100000, cl3:160000, spesa:2500, quotaCap0:0.5, forma0:'vita',
    tfrDove0:'fondo'}
};

const gira = dati => { DATI = dati; const s = M.leggi(); return {s, r: M.simula(s)}; };

// --- le metriche che le coppie guardano ------------------------------------
// `annoZero` è `null` quando il patrimonio non si esaurisce mai: per confrontarlo si
// tratta come «oltre la fine», cioè il valore migliore possibile.
const MAI = 9999;
const METRICHE = {
  finale:      ({r}) => r.finale,
  durata:      ({r}) => r.annoZero ?? MAI,
  sostenibile: ({s}) => M.spesaSostenibile(s) ?? 0,
  nelFondo:    ({s, r}) => r.incassi.reduce((a, v) => a + (v.montante ?? 0), 0)
};

// ============================================================================
//  IL VERSO, DICHIARATO PRIMA. Ogni riga si legge: «cambiando QUESTO, la
//  metrica NON PUÒ andare in questa direzione». `su` = non può diminuire,
//  `giu` = non può aumentare, `uguale` = non si deve muovere affatto.
// ============================================================================
const COPPIE = [
  // --- quello che si ha, e quello che si spende ---------------------------
  {nome:'10.000 € di patrimonio in più', cambia:{cl3:+10000}, metrica:'finale', verso:'su',
   perché:'più soldi non possono lasciarne meno alla fine'},
  {nome:'10.000 € di patrimonio in più: il piano non finisce prima',
   cambia:{cl3:+10000}, metrica:'durata', verso:'su',
   perché:'e non possono far esaurire il patrimonio prima'},
  {nome:'100 € al mese di spesa in più', cambia:{spesa:+100}, metrica:'finale', verso:'giu',
   perché:'spendere di più non può lasciarne di più'},
  {nome:'100 € al mese di spesa in più: il piano non dura di più',
   cambia:{spesa:+100}, metrica:'durata', verso:'giu', perché:'né far durare il patrimonio di più'},
  {nome:'spesa più bassa in pensione', cambia:{spesaPens:'=spesa-400'}, metrica:'finale',
   verso:'su', perché:'la seconda fase costa meno, quindi alla fine resta di più'},

  // --- le entrate ----------------------------------------------------------
  {nome:'100 € lordi di pensione INPS in più', cambia:{pens0:+100}, metrica:'finale',
   verso:'su', perché:'l\'IRPEF non arriva al 100%: più lordo è più netto'},
  {nome:'2.000 € di RAL in più', cambia:{ral0:+2000}, metrica:'finale', verso:'su',
   perché:'più stipendio, più TFR e più contributi; l\'aliquota marginale non supera il 43%'},
  // SMETTERE PRIMA, non dopo: quasi tutte le basi lasciano l'ultimo anno vuoto, cioè lavorano
  // fino alla pensione, e «un anno in più» non aveva dove andare — si muoveva su una base su
  // dodici. Una coppia che morde su una base sola prova quasi quanto una che non morde mai.
  // UNA COPPIA SCRITTA COME VALORE ASSOLUTO NON È «UNA COSA CAMBIATA», È «UNA COSA IMPOSTA».
  // Scritta `ultimo0 = annoPens0 − 3` sembrava «smettere due anni prima», e lo era su undici
  // basi; sulla dodicesima, che smette già nel 2032 con la pensione nel 2039, voleva dire
  // smettere quattro anni DOPO — e il patrimonio finale saliva, giustamente, contro il verso
  // dichiarato. Il difetto era della coppia, non del motore: qui lo scostamento si calcola
  // dall'ultimo anno EFFETTIVO della base, che quando la casella è vuota è l'anno prima della
  // decorrenza.
  {nome:'smettere di lavorare due anni prima',
   cambia: d => ({ultimo0: (d.ultimo0 ? +d.ultimo0 : +d.annoPens0 - 1) - 2}),
   metrica:'finale', verso:'giu',
   perché:'due anni di stipendio in meno, e due anni a carico del patrimonio',
   soloSe: d => d.ral0 && +d.annoPens0 > 2030},

  // --- il fondo pensione ---------------------------------------------------
  {nome:'20.000 € nel fondo in più', cambia:{fondo0:+20000}, metrica:'finale', verso:'su',
   perché:'il montante esce comunque, al netto di un\'imposta che non arriva al 100%'},
  {nome:'iscritto al fondo cinque anni prima', cambia:{iscr0:-5}, metrica:'finale', verso:'su',
   perché:'l\'aliquota sulla prestazione scende di 0,30 punti l\'anno: mai un\'imposta maggiore'},
  {nome:'il datore mette un punto in più', cambia:{pcDat0:+1}, metrica:'nelFondo', verso:'su',
   perché:'è denaro che entra nel fondo senza uscire dalla busta'},
  {nome:'il datore mette un punto in più: e non peggiora il piano',
   cambia:{pcDat0:+1}, metrica:'finale', verso:'su', perché:'e non costa niente a chi lavora'},
  {nome:'il fondo rende un punto in più', cambia:{rendFondo:+1}, metrica:'nelFondo', verso:'su',
   perché:'lo stesso versamento produce un montante maggiore'},

  // --- le ipotesi ----------------------------------------------------------
  {nome:'il patrimonio rende un punto in più', cambia:{rend:+1}, metrica:'finale', verso:'su',
   perché:'a parità di tutto il resto'},
  {nome:'inflazione più alta, rendimenti nominali uguali', cambia:{infl:+1}, metrica:'finale',
   verso:'giu', perché:'i rendimenti sono al lordo dell\'inflazione: in termini reali scendono'},
  {nome:'orizzonte più lungo: l\'anno di esaurimento non si sposta',
   cambia:{etaFine:+5}, metrica:'durata', verso:'uguale',
   perché:'quando finiscono i soldi non dipende da quanto in là si guarda'},

  // --- l'abitazione --------------------------------------------------------
  {nome:'la casa vale 50.000 € in più', cambia:{casaValore:+50000}, metrica:'finale',
   verso:'su', perché:'chi vende incassa di più; chi resta non ne risente', soloSe: d => d.casaCosa},
  {nome:'il canone costa 200 € al mese in più', cambia:{casaCanone:+200}, metrica:'finale',
   verso:'giu', perché:'è spesa in più tutti gli anni dopo il cambio',
   soloSe: d => d.casaCosa === 'affitto'},
  {nome:'la casa nuova costa 30.000 € in più', cambia:{casaNuova:+30000}, metrica:'finale',
   verso:'giu', perché:'resta meno differenza da mettere nel patrimonio',
   soloSe: d => d.casaCosa === 'piccola'},

  // --- la forma della rendita ---------------------------------------------
  // Non è una questione di convenienza — quella dipende dalle ipotesi — ma di aritmetica:
  // una rendita che protegge qualcun altro paga meno al titolare, sempre.
  {nome:'rendita reversibile invece che vitalizia', cambia:{forma0:'rev'}, metrica:'finale',
   verso:'giu', perché:'protegge chi resta, e in cambio l\'assegno è più basso',
   soloSe: d => d.forma0 === 'vita' && +d.quotaCap0 < 1 && d.fondo0},
  {nome:'rendita certa per 10 anni invece che vitalizia', cambia:{forma0:'certa'},
   metrica:'finale', verso:'giu', perché:'garantisce dieci anni ai beneficiari, e paga meno',
   soloSe: d => d.forma0 === 'vita' && +d.quotaCap0 < 1 && d.fondo0},

  // --- la spesa sostenibile ------------------------------------------------
  {nome:'più patrimonio alza la spesa massima sostenibile', cambia:{cl3:+50000},
   metrica:'sostenibile', verso:'su', perché:'è la definizione stessa di sostenibile'},
  {nome:'più pensione alza la spesa massima sostenibile', cambia:{pens0:+200},
   metrica:'sostenibile', verso:'su', perché:'entrate ricorrenti maggiori'}
];

// ============================================================================
//  LE COPPIE CHE NON PASSANO DAL PIANO: funzioni pure, dove il verso è ancora
//  più netto perché non c'è un piano di mezzo a confondere.
// ============================================================================
const PURE = [
  // IL VERSO CHE AVEVO DICHIARATO ERA SBAGLIATO, E LA LEGGE AVEVA RAGIONE.
  // «Più reddito, più IRPEF» sembra ovvio e non è vero: l'art. 13 c. 1 TUIR dà 1.955 € di
  // detrazione fino a 15.000 € e passa alla formula 1.910 + 1.190 × (28.000 − RC)/13.000 da
  // 15.001, che a quel punto vale 3.100. La detrazione SALTA di 1.145 € in un euro di reddito,
  // e l'imposta netta scende da 1.495 a 350. È una discontinuità della norma, non nostra.
  // Quindi si controllano le due cose vere: che l'imposta LORDA sia monotona, e che l'unico
  // punto in cui la NETTA scende sia quello — se un giorno ne comparisse un altro, o se questo
  // sparisse, il modello si sarebbe scollato dal testo.
  {nome:'più reddito, più IRPEF lorda (sempre)', prova: () => {
    for (let y = 0; y < 200000; y += 250)
      if (M.irpef(y + 250) < M.irpef(y) - 1e-9) return `a ${y} €`;
    return null; }},
  // E I PUNTI IN CUI SCENDE SONO DUE, NON UNO, che è il verso facile da dichiarare sbagliato.
  // A 20.000 € subentra l'ulteriore detrazione di 1.000 € del taglio del cuneo, e
  // l'imposta cala di colpo — ma sotto quella soglia c'è la SOMMA del c. 4, che non passa
  // dall'imposta e quindi non compare qui: i due tratti sono una misura sola e si saldano fuori
  // dall'IRPEF. La prova che si saldano davvero è la coppia successiva, sul netto in busta, che
  // infatti è monotono. Il posto dove guardare non era l'imposta, era la busta.
  {nome:'l\'IRPEF netta scende in due punti soli, e sono i due gradini della norma', prova: () => {
    const cali = [];
    for (let y = 0; y < 200000; y++)
      if (M.irpefNetta(y + 1, false) < M.irpefNetta(y, false) - 1e-9) cali.push(y);
    if (cali.length !== 2) return `cali in ${cali.length} punti: ${cali.slice(0,6).join(', ')}`;
    if (cali[0] !== 15000) return `il primo calo è a ${cali[0]} € invece che a 15.000 (art. 13 c. 1)`;
    if (cali[1] !== 20000) return `il secondo è a ${cali[1]} € invece che a 20.000 (art. 1 c. 6 L. 207/2024)`;
    return null; }},
  {nome:'e il salto vale quanto dice l\'art. 13: da 1.955 € a 3.100 € di detrazione', prova: () => {
    const detr = y => M.irpef(y) - M.irpefNetta(y, false);
    if (Math.abs(detr(15000) - 1955) > 0.01) return `a 15.000 la detrazione è ${detr(15000).toFixed(2)}`;
    if (Math.abs(detr(15001) - (1910 + 1190 * 12999 / 13000)) > 0.01)
      return `a 15.001 la detrazione è ${detr(15001).toFixed(2)}`;
    return null; }},
  {nome:'più reddito, più netto in busta (la marginale non arriva al 100%)', prova: () => {
    for (let ral = 5000; ral < 200000; ral += 500){
      const a = M.nettoAnnuo({ral, pcVoi:0, pcDat:0, pcMin:null}, 0);
      const b = M.nettoAnnuo({ral: ral+500, pcVoi:0, pcDat:0, pcMin:null}, 0);
      if (b < a - 1e-9) return `fra ${ral} e ${ral+500} €`;
    }
    return null; }},
  {nome:'più anni di iscrizione, mai più imposta', prova: () => {
    for (let a = 0; a < 60; a++) if (M.aliquota(a+1) > M.aliquota(a) + 1e-12) return `a ${a} anni`;
    return null; }},
  {nome:'più età alla conversione, coefficiente più alto', prova: () => {
    for (let e = 55; e < 75; e++) if (M.coeffEta(e+1) < M.coeffEta(e) - 1e-12) return `a ${e} anni`;
    return null; }},
  {nome:'più età alla conversione, soglia del «tutto in contanti» più bassa', prova: () => {
    for (let e = 55; e < 75; e++)
      if (M.soglia(M.coeffEta(e+1)) > M.soglia(M.coeffEta(e)) + 1e-9) return `a ${e} anni`;
    return null; }},
  {nome:'più redditi propri, mai più pensione ai superstiti', prova: () => {
    const L = 19500;
    for (let R = 0; R < 120000; R += 100)
      if (M.aiSuperstiti(L, R + 100) > M.aiSuperstiti(L, R) + 1e-9) return `a ${R} € di redditi`;
    return null; }},
  {nome:'più pensione del defunto, mai meno ai superstiti', prova: () => {
    for (let L = 0; L < 60000; L += 200)
      if (M.aiSuperstiti(L + 200, 25000) < M.aiSuperstiti(L, 25000) - 1e-9) return `a ${L} €`;
    return null; }},
  {nome:'versare al fondo costa sempre meno di quanto entra', prova: () => {
    for (let ral = 15000; ral <= 120000; ral += 5000)
      for (let pc = 0.5; pc <= 12; pc += 0.5){
        const x = {ral, pcVoi:0, pcDat:0, pcMin:null};
        const costo = M.costoAnnuo(x, pc), entra = M.contributi(x, pc).tot;
        if (costo > entra + 1e-6) return `RAL ${ral}, ${pc}%: costa ${costo.toFixed(0)} e ne entrano ${entra.toFixed(0)}`;
      }
    return null; }},
  {nome:'raggiungere la soglia del datore fa un salto, non una salita', prova: () => {
    const x = {ral:35000, pcVoi:0, pcDat:2, pcMin:1.2};
    const sotto = M.contributi(x, 1.19).dat, sopra = M.contributi(x, 1.2).dat;
    const molto = M.contributi(x, 8).dat;
    if (sotto !== 0) return 'sotto la soglia il datore versa';
    if (!(sopra > 0)) return 'alla soglia il datore non versa';
    if (Math.abs(sopra - molto) > 1e-9) return 'sopra la soglia la quota cresce ancora';
    return null; }}
];

// --- l'esecuzione -----------------------------------------------------------
// DUE CONVENZIONI NELLO STESSO CAMPO SI SONO SCONTRATE, e il risultato non è esploso: è
// sembrato plausibile. Qui un numero vale come SCOSTAMENTO dalla base (`cl3: +10000` = diecimila
// in più), mentre una funzione restituisce valori ASSOLUTI. Finché non le ho distinte, l'anno
// 2030 tornato da una funzione è stato sommato al 2032 della base: `ultimo0 = 4062`. Il motore
// non ha protestato — lo riconduce, come deve fare con qualunque valore ostile — e ha prodotto
// un patrimonio finale di 422.041 €, che sembrava solo una monotonia violata.
// Regola: quando una convenzione dipende dal TIPO del valore, aggiungerne un secondo modo di
// scriverlo la rompe in silenzio. Il confine va dichiarato, non dedotto.
const applica = (base, cambia) => {
  const d = {...base};
  const assoluti = typeof cambia === 'function';   // le funzioni danno il valore finale, non lo scarto
  for (const [k, v] of Object.entries(assoluti ? cambia(base) : cambia)){
    if (assoluti){ d[k] = v; continue; }
    if (typeof v === 'string' && v.startsWith('=')){
      // riferimenti a un altro campo, per le coppie che spostano una data
      const [campo, segno, quanto] = v.slice(1).match(/^(\w+)([+-])(\d+)$/).slice(1);
      d[k] = Number(base[campo]) + (segno === '+' ? +quanto : -quanto);
    } else if (typeof v === 'number' && typeof base[k] !== 'string' && base[k] !== undefined)
      d[k] = Number(base[k]) + v;          // gli scostamenti si sommano al valore della base
    else d[k] = v;
  }
  return d;
};

let ko = 0, righe = 0;
console.log('\n— le coppie: una cosa cambiata, il verso dichiarato prima —\n');
for (const c of COPPIE){
  let mosse = 0, rotte = [], saltate = 0;
  for (const [nomeBase, base] of Object.entries(BASI)){
    if (c.soloSe && !c.soloSe(base)){ saltate++; continue; }
    const prima = METRICHE[c.metrica](gira(base));
    const dopo  = METRICHE[c.metrica](gira(applica(base, c.cambia)));
    const d = dopo - prima;
    if (Math.abs(d) > 1e-6) mosse++;
    const male = c.verso === 'su' ? d < -1e-6
               : c.verso === 'giu' ? d > 1e-6
               : Math.abs(d) > 1e-6;
    if (male) rotte.push(`${nomeBase}: ${Math.round(prima)} → ${Math.round(dopo)}`);
  }
  righe++;
  const provate = Object.keys(BASI).length - saltate;
  // UNA COPPIA CHE NON SI MUOVE MAI NON STA PROVANDO NIENTE, e qui è un errore come gli altri:
  // «verde» perché la variabile non arriva al motore è il modo più elegante di non accorgersene.
  if (!rotte.length && mosse === 0 && c.verso !== 'uguale'){
    ko++;
    console.log(`  ✗  ${c.nome}\n     NON SI MUOVE MAI su ${provate} basi: la coppia non prova niente`);
  } else if (rotte.length){
    ko++;
    console.log(`  ✗  ${c.nome}\n     ${c.perché}\n     ${rotte.join('\n     ')}`);
  } else {
    console.log(`  ok ${c.nome}   (${mosse}/${provate} basi si muovono)`);
  }
}

console.log('\n— le coppie sulle funzioni, senza un piano di mezzo —\n');
for (const p of PURE){
  const dove = p.prova();
  if (dove){ ko++; console.log(`  ✗  ${p.nome}   rotta ${dove}`); }
  else console.log(`  ok ${p.nome}`);
}

if (ko){ console.log(`\n✗ ${ko} versi sbagliati\n`); process.exit(1); }
console.log(`\n✓ ${righe} coppie su ${Object.keys(BASI).length} basi + ${PURE.length} sulle funzioni: `
  + 'ogni risultato si muove dalla parte dichiarata\n');
