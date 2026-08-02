// ============================================================================
//  SECONDA IMPLEMENTAZIONE, scritta dalle REGOLE e non dal codice della pagina.
//
//  Serve a un confronto cieco: se due implementazioni indipendenti danno lo
//  stesso numero, un eventuale errore sta nelle regole, non nell'aritmetica.
//
//  ATTENZIONE: va tenuta al passo. Una seconda implementazione ferma a una
//  versione vecchia del modello è PEGGIO di nessuna, perché dà un falso
//  «scarto zero» mentre calcola un'altra cosa. È già successo il 31/07/2026.
//
//  node verifiche/seconda-implementazione.mjs
// ============================================================================
import fs from 'fs';
import { REGOLE } from '../regole.mjs';

const V = k => REGOLE[k].val;

// ---------------------------------------------------------------- le regole
const irpef = y => {
  let t = 0, sotto = 0;
  for (const [tetto, al] of V('SCAGLIONI')){
    if (y <= sotto) break;
    t += (Math.min(y, tetto) - sotto) * al;
    sotto = tetto;
  }
  return t;
};
// LE DETRAZIONI DELL'ART. 13, riscritte dalle bande e non copiate dal motore. La forma è la
// stessa perché la legge è una sola — base + quota × (fino − reddito) / denominatore — ma i
// numeri arrivano da `regole.mjs`, quindi qui si sbaglia solo se si sbaglia là.
// L'imposta LORDA resta senza detrazione, perché la usa anche il TFR (art. 19, altro regime).
const detrazione = (tab, R) => {
  for (const [fino, base, quota, den] of tab)
    if (R <= fino) return base + (den > 0 ? quota * (fino - R) / den : 0);
  return 0;
};
const irpefNetta = (reddito, pensione) => {
  const R = Math.max(0, reddito);
  const piu = pensione && R > 25000 && R <= 29000 ? V('DETRAZIONE_PENS_PIU') : 0;
  // l'ulteriore detrazione del cuneo spetta al solo lavoro: i pensionati sono esclusi per legge
  const cuneo = pensione ? 0 : detrazione(V('ULTERIORE_DETRAZIONE'), R);
  return Math.max(0, irpef(R)
    - detrazione(pensione ? V('DETRAZIONE_PENS') : V('DETRAZIONE_LAV'), R) - piu - cuneo);
};
// la somma non passa dall'imposta: si aggiunge al netto
const sommaCuneo = R => {
  for (const [fino, q] of V('SOMMA_CUNEO')) if (R <= fino) return Math.max(0, R) * q;
  return 0;
};
const aliqFondo = anni => Math.min(V('ALIQ_FONDO_MAX'),
  Math.max(V('ALIQ_FONDO_MIN'), V('ALIQ_FONDO_MAX') - V('ALIQ_FONDO_PASSO') * (anni - 15)));
const coeffEta = eta => {
  const C = V('COEFF_ETA');
  if (!(eta > C[0][0])) return C[0][1];
  if (eta >= C.at(-1)[0]) return C.at(-1)[1];
  for (let i = 1; i < C.length; i++){
    const [a1, c1] = C[i-1], [a2, c2] = C[i];
    if (eta <= a2) return c1 + (c2 - c1) * (eta - a1) / (a2 - a1);
  }
  return C.at(-1)[1];
};
const soglia = c => (0.5 * V('ASSEGNO_SOCIALE')) / (0.7 * c);
// L'erogazione frazionata ha una sua aliquota, peggiore: dal 20% al 15%, 0,25 punti l'anno.
const aliqFraz = anni => Math.min(V('ALIQ_FRAZ_MAX'),
  Math.max(V('ALIQ_FRAZ_MIN'), V('ALIQ_FRAZ_MAX') - V('ALIQ_FRAZ_PASSO') * (anni - 15)));
// art. 11 c. 3-ter: la durata della rendita a durata definita è la vita attesa in anni INTERI.
// Tavola letta da `regole.mjs`, non ricopiata: qui si riscrivono le regole, non i dati.
const vitaIntera = eta => {
  const T = V('VITA_INTERA');
  if (!(eta > T[0][0])) return T[0][1];
  if (eta >= T.at(-1)[0]) return T.at(-1)[1];
  return (T.find(([e]) => e === Math.floor(eta)) || T.at(-1))[1];
};
// le due famiglie: chi converte in rendita e chi tiene il montante e lo consuma a rate
const consumo = x => x.forma === 'durata'
    ? {n: vitaIntera(x.annoPens - x.nascita), al: aliqFondo}
  : x.forma === 'frazionata'
    ? {n: Math.max(V('FRAZ_ANNI_MIN'), x.anniFraz || V('FRAZ_ANNI_MIN')), al: aliqFraz}
  : null;
const FATT = {vita: 1, rev: V('FATT_REV'), certa: V('FATT_CERTA')};

// ------------------------------------------------------------------ il piano
function piano(D){
  const infl = D.infl;
  const r    = (1 + D.rend) / (1 + infl) - 1;
  const rf   = (1 + D.rendFondo) / (1 + infl) - 1;
  const rTfr = (1 + (V('TFR_RIV_FISSA') + V('TFR_RIV_QUOTA') * infl) * (1 - V('TFR_IMPOSTA_RIV')))
             / (1 + infl) - 1;
  // ciascuno lavora fino al proprio ultimo anno: vuoto vuol dire fino alla propria decorrenza,
  // e comunque mai oltre di essa
  const ult = D.p.map(x => x.ultimo == null ? x.annoPens - 1
                                            : Math.min(x.ultimo, x.annoPens - 1));
  // le due spese si scambiano quando ha smesso l'ultimo: prima di allora in casa entra ancora
  // un reddito da lavoro
  const ultimo = Math.max(...ult);
  const fine   = Math.max(...D.p.map(x => x.nascita)) + D.etaFine;

  // PROVA DI TENUTA: i primi esercizi a rendimento reale nullo. Il TFR lasciato in azienda
  // resta fuori, perché si rivaluta per legge (art. 2120 c.c.) e non sul mercato.
  const fermo = a => a < V('ANNO0') + (D.prova || 0);
  // LO SCENARIO DEL SUPERSTITE, riscritto dalle regole: chi manca non lavora e non percepisce la
  // propria pensione; a chi resta va il 60% di quella del defunto, ridotta se ha redditi propri
  // elevati (Tabella F); la spesa scende al coefficiente della scala di equivalenza.
  const manca = D.manca || null;
  const morto = (i, a) => manca !== null && i === manca.chi && a >= manca.anno;
  const resta = manca === null ? -1 : D.p.findIndex((_, j) => j !== manca.chi);
  const TMA = V('TRATT_MINIMO') * V('TRATT_MINIMO_MENS');
  const superstiti = (lordaDef, propri) => {
    const piena = Math.max(0, lordaDef) * V('REVERSIBILITA');
    if (!(piena > 0)) return 0;
    const R = Math.max(0, propri);
    let taglio = 0, pav = 0, prima = 0;
    for (const [n, t] of V('CUMULO_SUPERSTITI'))
      if (R > TMA * n){ pav = Math.max(pav, TMA * n + piena * (1 - prima) - R); prima = t; taglio = t; }
    return Math.min(piena, Math.max(piena * (1 - taglio), pav, piena - R));
  };

  let patr = D.patrimonio;
  // L'ABITAZIONE, ricostruita dalle cifre grezze. Il calcolatore passa quello che sta scritto
  // nelle caselle — non `attiva`, non `ricavato`, non `spesaAnnua` — altrimenti questa
  // implementazione erediterebbe la decisione dell'altra invece di verificarla.
  const casa = (() => {
    const c = D.casa;
    if (!c || c.cosa === 'resto' || c.anno === null || c.anno === undefined) return null;
    const anno = Math.max(V('ANNO0'), c.anno);
    const costiV = c.valore > 0 ? c.valore * V('COSTI_VENDITA') : 0;
    const costiA = c.cosa === 'piccola' && c.nuova > 0
      ? c.nuova * V('COSTI_ACQUISTO') + V('COSTI_ATTO') : 0;
    return {anno,
      ricavato: c.valore - costiV - (c.cosa === 'piccola' ? c.nuova + costiA : 0),
      canoneAnno: c.cosa === 'affitto' ? c.canone * 12 : 0};
  })();
  // CHI HA LA DECORRENZA GIÀ TRASCORSA NON HA FONDO DENTRO IL PIANO. La prestazione è stata
  // riscossa prima dell'anno iniziale, quindi quel capitale sta già nel patrimonio: contarlo
  // qui lo conterebbe due volte, e per giunta col coefficiente di un'età che non è più quella.
  // Regola scritta da capo, non ereditata: è il mestiere di questa implementazione.
  const dentro = D.p.map(x => x.annoPens < V('ANNO0') ? 0 : x.fondo);
  const F = dentro.map(m => ({m, v: m, rend: 0, da: null, rata: null,
                              rate: 0, alCons: null, daCons: null}));
  const T = D.p.map(() => ({pot: 0, messo: 0, anni: 0}));
  const righe = [], inc = [], liq = [];

  for (let a = V('ANNO0'); a <= fine; a++){
    const ini = patr;
    let E = 0;

    D.p.forEach((x, i) => {
      const lavora = a <= ult[i] && !morto(i, a), inPens = a >= x.annoPens && !morto(i, a);
      // la retribuzione cresce: in euro di oggi conta la crescita al netto dell'inflazione
      const k    = Math.pow(1 + (x.cresc || 0), a - V('ANNO0'));
      const ral  = Math.max(0, x.ral) * k;
      const tfrA = ral * V('TFR_SU_RAL');

      // Il datore versa a due condizioni: che il fondo sia quello individuato dal contratto
      // collettivo, e che versi anche il lavoratore. Oltre quella soglia non cresce.
      const quota = pc => {
        const lav = ral * Math.max(0, pc) / 100;
        const scatta = x.pcVoi > 0 ? pc >= x.pcVoi - 1e-9 : pc > 0;
        const spetta = scatta && !x.fondoIndividuale;
        return {lav, dat: spetta ? ral * Math.max(0, x.pcDat) / 100 : 0};
      };
      const q = quota(x.pc), qOggi = quota(x.pcVoi);
      const vers = q.lav + q.dat;

      if (lavora){
        // QUELLO CHE RESTA IN BUSTA, ricavato dalla RAL come nel motore ma riscritto dalle
        // regole: lorda meno i contributi obbligatori, meno la quota versata al fondo, meno
        // l'IRPEF sull'imponibile che ne resta. Prima qui c'era `x.stip * k * 12`, cioè la
        // casella del netto scalata: quando la casella è sparita questo file ha continuato a
        // leggerla e ha prodotto NaN per sessanta casi su sessanta, dichiarandoli tutti uguali.
        const base = Math.max(0, ral * (1 - V('IVS')));
        const ded  = c => Math.min(c.lav, Math.max(0, V('TETTO_DEDUZIONE') - c.dat));
        const R = base - ded(q);
        E += base - q.lav - irpefNetta(R, false) + sommaCuneo(R);
      }
      if (inPens && !(manca !== null && a >= manca.anno && i === resta))
        E += x.pens * V('MENSILITA_PENSIONE')
             - irpefNetta(x.pens * V('MENSILITA_PENSIONE'), true);

      // TFR lasciato in azienda: rivalutazione propria, liquidazione all'ultimo anno
      if (!x.tfrAlFondo){
        if (lavora){ T[i].pot = T[i].pot * (1 + rTfr) + tfrA; T[i].messo += tfrA; T[i].anni++; }
        if (a === ult[i] && T[i].pot > 0){
          const rif = (T[i].messo / T[i].anni) * 12;
          const al  = irpef(rif) / rif;
          E += T[i].pot - T[i].messo * al;
          liq.push({chi: i, a, lordo: T[i].pot, al, netto: T[i].pot - T[i].messo * al});
          T[i].pot = 0;
        }
      }

      // il fondo
      const AI = Math.max(x.annoPens, V('ANNO0'));
      const daRita = Math.min(Math.max(x.rita || AI, V('ANNO0')), AI);
      const nRate  = AI - daRita;
      if (a <= AI){
        if (a > V('ANNO0')) F[i].v /= (1 + infl);
        if (lavora){
          const tfrDentro = x.tfrAlFondo ? tfrA : 0;
          F[i].m += vers + tfrDentro;
          // art. 11 c. 6: quello che non si è dedotto non rientra nella base imponibile
          F[i].v += Math.min(vers, V('TETTO_DEDUZIONE')) + tfrDentro;
        }
        if (nRate > 0 && a >= daRita && a < AI && F[i].m > 0){
          if (F[i].rata === null) F[i].rata = F[i].m / nRate;
          const lorda = Math.min(F[i].rata, F[i].m);
          const imponibile = lorda * Math.min(F[i].v / F[i].m, 1);
          F[i].m -= lorda; F[i].v -= imponibile;
          E += lorda - imponibile * aliqFondo(a - x.iscr);
        }
        F[i].m *= (1 + (fermo(a) ? Math.min(0, rf) : rf));
      }
      // art. 14 c. 3 D.Lgs. 252/2005: chi manca prima della prestazione lascia tutta la
      // posizione a chi resta, in capitale, senza quota da convertire e senza soglia
      const preMorte = manca !== null && i === manca.chi && a === manca.anno && a < AI;
      if ((a === AI || preMorte) && F[i].m > 0){
        const base = Math.min(F[i].v, F[i].m), al = aliqFondo((preMorte ? a : AI) - x.iscr);
        const netto = F[i].m - base * al;
        const ce = coeffEta(x.annoPens - x.nascita);
        const qmax = F[i].m < soglia(ce) ? 1 : V('QUOTA_ORDINARIA');
        const qCap = preMorte ? 1 : Math.min(x.quotaCap, qmax);
        E += netto * qCap;
        const cons = preMorte ? null : consumo(x);
        inc.push({chi: i, a, mont: F[i].m, base, al, cap: netto * qCap, qmax});
        if (cons && netto * (1 - qCap) > 0){
          // CHI CONSUMA non converte e non si tassa adesso: il residuo resta nel fondo, e
          // l'imposta la paga rata per rata, con l'anzianità dell'anno in cui la rata esce.
          // Qui la quota si applica al MONTANTE e alla BASE separatamente: tassare il tutto e
          // poi dividere darebbe lo stesso capitale ma una base residua sbagliata.
          F[i].m = F[i].m * (1 - qCap);
          F[i].v = base * (1 - qCap);
          F[i].rate = Math.max(1, Math.round(cons.n) || 0);
          F[i].alCons = cons.al;
          F[i].daCons = a;
        } else {
          F[i].rend = netto * (1 - qCap) * ce * (FATT[x.forma] ?? 1);
          F[i].da = a;
          F[i].m = 0;
        }
      }
      // le rate della forma che consuma: montante diviso le rate che restano, e il residuo
      // continua a rendere. La rata non è fissa, ed è la differenza con la RITA.
      if (F[i].rate > 0 && F[i].m > 0 && a >= F[i].daCons){
        const lorda = F[i].m / F[i].rate;
        const imponibile = lorda * Math.min(F[i].v / F[i].m, 1);
        F[i].m -= lorda; F[i].v -= imponibile; F[i].rate--;
        E += lorda - imponibile * F[i].alCons(a - x.iscr);
        if (F[i].rate > 0 && a > F[i].daCons) F[i].m *= (1 + (fermo(a) ? Math.min(0, rf) : rf));
      }
      // la rendita del defunto continua solo se la forma la protegge
      const dura = !morto(i, a) || x.forma === 'rev'
                || (x.forma === 'certa' && a < F[i].da + V('CERTA_ANNI'));
      if (F[i].da !== null && a >= F[i].da && dura)
        E += F[i].rend / Math.pow(1 + infl, a - F[i].da);
    });

    // il superstite: pensione propria e reversibilità fanno capo a un solo contribuente
    if (manca !== null && a >= manca.anno && resta >= 0){
      const sup = D.p[resta], def = D.p[manca.chi];
      const kS = Math.pow(1 + (sup.cresc || 0), a - V('ANNO0'));
      const propria = a >= sup.annoPens ? sup.pens * V('MENSILITA_PENSIONE') : 0;
      const propri = propria + (a <= ult[resta] ? Math.max(0, sup.ral) * kS : 0);
      const rev = a >= def.annoPens ? superstiti(def.pens * V('MENSILITA_PENSIONE'), propri) : 0;
      const lorda = propria + rev;
      if (lorda > 0) E += lorda - irpefNetta(lorda, true);
    }

    // L'ABITAZIONE. La regola si riapplica qui da capo e NON si eredita dal calcolatore: il
    // ricavato si ricalcola dalle cifre grezze, e il canone si somma DOPO la scala di
    // equivalenza. Se un giorno la pagina lo mettesse dentro il moltiplicatore, questo confronto
    // deve poter fallire — è tutto il suo mestiere.
    if (casa !== null && a === casa.anno) E += casa.ricavato;
    // due spese: quella di adesso vale finché lavora almeno uno dei due, compreso il suo
    // ultimo esercizio
    const spesaAnno = (a <= ultimo ? D.spesa : (D.spesaPens ?? D.spesa)) * 12
                      * (manca !== null && a >= manca.anno ? manca.equiv : 1)
                      + (casa !== null && a >= casa.anno ? casa.canoneAnno : 0);
    patr = ini + Math.max(ini, 0) * (fermo(a) ? Math.min(0, r) : r) + E - spesaAnno;
    righe.push({a, patr});
  }
  return {righe, fine, finale: patr, inc, liq, ultimo};
}

// --------------------------------------------------- il motore della pagina
const PAGINA = new URL('../sito/index.html', import.meta.url).pathname;
// LA PAGINA HA PIÙ DI UNO <script>. Da quando il piè di pagina porta con sé il banner del
// consenso, il primo è quello: prendere «il primo» faceva caricare quaranta righe di banner al
// posto del motore, e l'armatura falliva su un codice giusto.
// Si sceglie dicendo COSA si vuole — il blocco che contiene il motore — invece di fidarsi
// dell'ordine in cui il build monta i pezzi.
const src = [...fs.readFileSync(PAGINA, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));
let DATI = {};
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, hidden:false, style:{}, addEventListener(){}, setAttribute(){},
  closest(){ return finto(); }, classList:{toggle(){}, add(){}, remove(){}},
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
// `addEventListener` sulla finestra: la pagina lo usa per aprire il dettaglio prima della
// stampa. Nei DOM finti non esiste, ed è la quinta volta che un'armatura incompleta fa
// cadere codice buono: si completa l'armatura, non si indebolisce la pagina.
globalThis.addEventListener = globalThis.addEventListener || (() => {});
// `window` esiste sempre in un browser, e la pagina lo nomina per l'evento della misurazione.
// Nei DOM finti non c'era: sesta volta che un'armatura incompleta fa cadere codice buono.
// Puntato a `globalThis`, così `window.gtag` resta indefinito e l'evento non parte mai qui.
globalThis.window = globalThis;
globalThis.document = {
  body: {classList: {toggle(){}}},
  getElementById: id => Object.assign(finto(), {value: String(DATI[id] ?? 0)}),
  querySelectorAll: () => []
};
const M = new Function(src + '\nreturn {leggi, simula};')();

// ------------------------------------------------------------------- i casi
const base = {quanti:'2', cl3:100000, spesa:3300, spesaPens:'', cresc0:'', cresc1:'', rend:5, infl:2, rendFondo:4, etaFine:95,
  forma0:'vita', forma1:'vita', nome0:'A', nome1:'B', pc0:'', pc1:'',
  // Caso inventato, come quello di `test.mjs` e diverso da quello: due implementazioni
  // confrontate sempre sugli stessi numeri si accorderebbero anche su un caso particolare.
  nascita0:1974, ral0:70000, pens0:3200, annoPens0:2041,
  fondo0:80000, pcVoi0:1.5, pcDat0:2, tfrDove0:'fondo', iscr0:2011, rita0:2041, quotaCap0:0.6,
  nascita1:1984, ral1:32000, pens1:1500, annoPens1:2052,
  fondo1:20000, pcVoi1:1, pcDat1:1.5, tfrDove1:'fondo', iscr1:2016, rita1:2052, quotaCap1:1,
  // scritto per esteso, non lasciato mancante: su una casella nuova un fixture muto fa passare
  // il confronto senza confrontare nulla
  tipoFondo0:'collettiva', tipoFondo1:'collettiva',
  // vuoto, non assente: assente varrebbe '0' e vorrebbe dire «smesso nel 1900»
  ultimo0:'', ultimo1:'',
  // L'ABITAZIONE, scritta per esteso anche quando non si usa. È la settima volta che questa
  // regola serve: un campo assente vale '0', e per `casaAnno` zero non è «nessuna scelta» —
  // sotto le quattro cifre vale come non compilato, quindi passerebbe lo stesso, ma `casaCosa`
  // a '0' non è nemmeno una delle tre opzioni e il ripiego renderebbe il caso illeggibile.
  casaCosa:'resto', casaAnno:'', casaValore:'', casaNuova:'', casaCanone:''};

const casi = {
  'i due, come stanno':       {},
  'una persona sola':         {quanti:'1'},
  'TFR in azienda':           {tfrDove0:'azienda', tfrDove1:'azienda'},
  'contribuzione al tetto':   {pc0:8, pc1:14},
  'oltre il tetto':           {pc0:30, pc1:35},
  'nessuno versa':            {pcVoi0:0, pcVoi1:0},
  'rendite diverse':          {forma0:'rev', forma1:'certa', quotaCap1:0.5},
  'zero in capitale':         {quotaCap0:0, quotaCap1:0},
  'RITA per uno':             {rita0:2034},
  'inflazione 5%':            {infl:5},
  'inflazione 0%':            {infl:0},
  'pensione a 62 anni':       {annoPens0:2034, annoPens1:2041},
  'pensione a 72 anni':       {annoPens0:2044, annoPens1:2051},
  'fondi piccoli':            {fondo0:9000, fondo1:4000},
  // --- l'abitazione. Il caso dell'affitto è il solo in cui la spesa cambia dentro il piano
  // per una ragione che non è il pensionamento, quindi il solo che possa scoprire un canone
  // finito per sbaglio dentro un moltiplicatore.
  'casa venduta, una più piccola': {casaCosa:'piccola', casaAnno:2045, casaValore:300000, casaNuova:180000},
  'casa venduta, in affitto':      {casaCosa:'affitto', casaAnno:2045, casaValore:300000, casaCanone:900},
  'casa lasciata, in affitto':     {casaCosa:'affitto', casaAnno:2045, casaValore:'', casaCanone:900},
  'casa cambiata subito':          {casaCosa:'piccola', casaAnno:2026, casaValore:300000, casaNuova:180000},
  'casa nuova più cara di quella venduta': {casaCosa:'piccola', casaAnno:2040, casaValore:200000, casaNuova:320000},
  'casa venduta oltre l\'orizzonte': {casaCosa:'affitto', casaAnno:2090, casaValore:300000, casaCanone:900},
  'spesa che rompe il piano': {spesa:7000},
  'in pensione si spende meno':  {spesaPens:2200},
  'in pensione si spende di più':{spesaPens:4200},
  'la retribuzione cresce':      {cresc0:4, cresc1:3.5},
  'la retribuzione si ferma':    {cresc0:0, cresc1:0},
  // il fondo sottoscritto per conto proprio: la quota del datore non spetta, e deve sparire
  // anche da quello che entra nel fondo e dallo spazio deducibile
  'uno dei due ha un fondo aperto': {tipoFondo0:'individuale'},
  'tutti e due per conto proprio':  {tipoFondo0:'individuale', tipoFondo1:'individuale'},
  'fondo aperto e contribuzione al tetto': {tipoFondo0:'individuale', pc0:8, pc1:14},
  // l'ultimo anno di lavoro, che dal 31/07/2026 è di ciascuno
  'uno smette dieci anni prima':   {ultimo0:2029},
  'smettono in due anni diversi':  {ultimo0:2031, ultimo1:2037},
  'uno ha gia smesso':             {ultimo0:2024},
  'scritto oltre la propria pensione (va ricondotto)': {ultimo0:2050},
  'smettono insieme, come prima':  {ultimo0:2038, ultimo1:2038},
  // LA DECORRENZA GIÀ TRASCORSA. Il montante resta scritto nella casella apposta: se una delle
  // due implementazioni lo riscuotesse nel 2026 il confronto salterebbe, ed è proprio quello
  // che deve controllare. Il caso a un anno dal confine tiene ferma la direzione della regola.
  'uno è già in pensione':            {annoPens0:2015},
  'tutti e due già in pensione':      {annoPens0:2015, annoPens1:2022},
  'una persona sola, già in pensione':{quanti:'1', annoPens0:2010},
  'decorrenza nell\'anno in corso':   {annoPens0:2026},
  'decorrenza l\'anno scorso':        {annoPens0:2025},
  'già in pensione, e il fondo scritto lo stesso': {annoPens0:2015, fondo0:250000},
  // LE FORME CHE CONSUMANO IL MONTANTE invece di convertirlo. Sono il caso in cui le due
  // implementazioni possono divergere di più, perché il residuo resta investito e l'imposta
  // si paga rata per rata: un ordine diverso fra rendimento e prelievo si vede subito.
  'rendita a durata definita':        {forma0:'durata', forma1:'durata'},
  'durata definita con capitale al massimo': {forma0:'durata', forma1:'durata', quotaCap0:0.6, quotaCap1:0.6},
  'durata definita, zero in capitale':{forma0:'durata', forma1:'durata', quotaCap0:0, quotaCap1:0},
  'erogazione frazionata al minimo':  {forma0:'frazionata', forma1:'frazionata'},
  'erogazione frazionata su vent\'anni': {forma0:'frazionata', forma1:'frazionata', anniFraz0:20, anniFraz1:20},
  'una converte e l\'altra consuma':  {forma0:'durata', forma1:'rev'},
  'consuma dopo aver preso la RITA':  {forma0:'durata', rita0:2034},
  'consuma, e uno manca durante le rate': {forma0:'durata', forma1:'durata'},
};


let peggio = 0, nomePeggio = '', rotti = 0;
// LA PROVA DI TENUTA non è una casella: è un secondo giro del motore sugli stessi dati. Va
// confrontata lo stesso, o la riga che compare sotto il verdetto poggia su un calcolo solo.
// LO SCENARIO DEL SUPERSTITE: come la prova di tenuta, un secondo giro sugli stessi dati.
// I casi coprono i rami che divergono: la forma della rendita, la Tabella F che morde, e il
// riscatto per premorienza (chi manca prima di riscuotere il fondo).
const SUP = {
  'manca il primo, rendita vitalizia':   {chi:0, anno:2055, equiv:0.60},
  'manca il secondo, rendita vitalizia': {chi:1, anno:2058, equiv:0.60},
  'manca il primo, rendita reversibile': {chi:0, anno:2055, equiv:0.60, o:{forma0:'rev', forma1:'rev'}},
  'manca il primo, rendita certa':       {chi:0, anno:2045, equiv:0.60, o:{forma0:'certa'}},
  'con la scala di equivalenza alta':    {chi:0, anno:2055, equiv:0.667},
  'pensioni alte: la Tabella F morde':   {chi:0, anno:2055, equiv:0.60, o:{pens0:3400, pens1:3000}},
  // LA CASA INSIEME AL SUPERSTITE, e senza questo caso la copertura era finta. I casi della
  // casa avevano `equiv` sempre a 1 e quelli del superstite non avevano casa: spostando il
  // canone dentro il moltiplicatore della scala di equivalenza — l'errore preciso contro cui
  // quella riga è scritta — il confronto restava verde su tutti e 58.
  // Un appartamento già affittato costa uguale in uno o in due: la scala vale sui consumi.
  'manca uno, e si è in affitto':        {chi:0, anno:2050, equiv:0.60,
    o:{casaCosa:'affitto', casaAnno:2045, casaValore:300000, casaCanone:900}},
  'manca uno prima del cambio di casa':  {chi:0, anno:2040, equiv:0.667,
    o:{casaCosa:'affitto', casaAnno:2045, casaValore:280000, casaCanone:750}},
  'manca PRIMA di riscuotere il fondo':  {chi:0, anno:2035, equiv:0.60},
  'manca prima di andare in pensione':   {chi:0, anno:2030, equiv:0.60},
};

const PROVE = {'prova di tenuta, dieci esercizi fermi': [10, {}],
               'prova di tenuta su un piano stretto':   [10, {spesa: 5200}],
               'prova di tenuta lunga, venti esercizi': [20, {}]};
const tutti = [...Object.entries(casi).map(([n,o]) => [n, o, 0, null]),
               ...Object.entries(PROVE).map(([n,[pr,o]]) => [n, o, pr, null]),
               ...Object.entries(SUP).map(([n,m]) => [n, m.o || {}, 0, m])];
for (const [nome, over, prova, manca] of tutti){
  DATI = {...base, ...over};
  const s0 = M.leggi();
  const s = {...s0, ...(prova ? {prova} : {}),
             ...(manca ? {manca: {chi: manca.chi, anno: manca.anno, equiv: manca.equiv}} : {})};
  const R = M.simula(s);
  // `D` NON È UN MODULO DA COMPILARE, è l'ingresso dell'altra implementazione: qui la chiave si
  // chiama `patrimonio` perché è la grandezza, non la casella. Le caselle stanno in `base`, e
  // lì il patrimonio non esiste più — è la somma delle quattro classi.
  const D = {patrimonio:s.patrimonio, spesa:s.spesa, spesaPens:s.spesaPens, rend:s.rendNom, infl:s.infl,
    prova:s.prova, manca:s.manca,
    // SI PASSANO LE CIFRE SCRITTE, non `attiva`/`ricavato`/`spesaAnnua`: quelli sono già il
    // risultato delle regole che questa implementazione deve rifare per conto suo.
    casa: {cosa:s.casa.cosa, anno:s.casa.anno, valore:s.casa.valore,
           nuova:s.casa.nuova, canone:s.casa.canone},
    rendFondo:s.rendFondoNom, etaFine:s.etaFine,
    p: s.p.map(x => ({nascita:x.nascita, ral:x.ral, pens:x.pensLorda,
      // SI PASSA IL VALORE SCRITTO, NON QUELLO GIÀ AZZERATO. `leggi()` toglie il fondo a chi ha
      // la decorrenza alle spalle: prendendo `x.fondo` questa implementazione erediterebbe la
      // decisione dell'altra e non verificherebbe più niente. La regola la riapplica da sé,
      // qui sotto, ed è l'unico modo perché il confronto possa ancora fallire.
      annoPens:x.annoPens, fondo:x.fondoScritto, pcVoi:x.pcVoi, pcDat:x.pcDat, pc:x.pc, cresc:x.cresc,
      anniFraz:x.anniFraz,
      fondoIndividuale:x.fondoIndividuale, ultimo:x.ultimo,
      tfrAlFondo:x.tfrAlFondo, iscr:x.iscr, rita:x.rita, quotaCap:x.quotaCap, forma:x.forma}))};
  const P = piano(D);

  const rel = Math.abs(P.finale - R.finale) / Math.max(Math.abs(R.finale), 1);
  const guai = [];
  // UN CONFRONTO CIECO AI NaN NON È UN CONFRONTO. `NaN > 1e-9` è FALSO, quindi uno scarto
  // indefinito passava come uguaglianza: il 02/08/2026 questa implementazione ha smesso di
  // calcolare — leggeva una casella che non esisteva più — e per sessanta casi su sessanta ha
  // dichiarato «0 divergenti» producendo NaN. È la seconda volta che tace invece di fallire:
  // la prima dava «scarto 0.0e+0» mentre non produceva alcun incasso.
  // La regola vale oltre questo file: una soglia interrogata con un valore non finito risponde
  // sempre di sì, e va perciò sempre preceduta dal controllo che il valore esista.
  if (!Number.isFinite(P.finale) || !Number.isFinite(R.finale))
    guai.push(`valore non finito: ${P.finale} contro ${R.finale}`);
  else if (rel > 1e-9) guai.push(`finale ${Math.round(R.finale)} contro ${Math.round(P.finale)}`);
  if (P.inc.length !== R.incassi.length)
    guai.push(`incassi ${R.incassi.length} contro ${P.inc.length}`);
  if (P.liq.length !== R.liquidazioni.length)
    guai.push(`liquidazioni ${R.liquidazioni.length} contro ${P.liq.length}`);
  R.incassi.forEach((v, k) => {
    const w = P.inc[k]; if (!w) return;
    if (Math.abs(v.montante - w.mont) > 1e-6) guai.push(`montante ${k}: ${Math.round(v.montante)} contro ${Math.round(w.mont)}`);
    if (Math.abs(v.capitale - w.cap)   > 1e-6) guai.push(`capitale ${k}: ${Math.round(v.capitale)} contro ${Math.round(w.cap)}`);
    if (Math.abs(v.al - w.al)          > 1e-12) guai.push(`aliquota ${k}: ${v.al} contro ${w.al}`);
  });
  R.liquidazioni.forEach((v, k) => {
    const w = P.liq[k]; if (!w) return;
    if (Math.abs(v.netto - w.netto) > 1e-6) guai.push(`TFR ${k}: ${Math.round(v.netto)} contro ${Math.round(w.netto)}`);
  });

  if (rel > peggio){ peggio = rel; nomePeggio = nome; }
  if (guai.length){
    rotti++;
    console.log(`  DIVERGE  ${nome}`);
    for (const g of guai) console.log(`             ${g}`);
  } else {
    console.log(`  ok       ${nome.padEnd(26)} ${Math.round(R.finale).toLocaleString('it-IT').padStart(12)} €`);
  }
}

// LA GUARDIA SI PROVA DA SÉ. Una guardia contro i NaN che non venisse mai esercitata sarebbe
// esattamente il difetto che vuole impedire: verde perché non guarda. Qui le si dà in pasto un
// valore indefinito e si pretende che lo dichiari.
{
  const finto = (a, b) => {
    const rel = Math.abs(a - b) / Math.max(Math.abs(b), 1);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 'non finito';
    return rel > 1e-9 ? 'diverso' : 'uguale';
  };
  const esiti = [finto(NaN, 100), finto(100, NaN), finto(100, 100), finto(100, 200)].join(' ');
  if (esiti !== 'non finito non finito uguale diverso'){
    console.log(`  ✗ la guardia sui valori non finiti non funziona: ${esiti}`);
    rotti++;
  } else console.log('\n  ok  la guardia sui valori non finiti scatta, provata su NaN da entrambi i lati');
}
console.log(`\n${tutti.length} casi, ${rotti} divergenti.`);
console.log(`Scarto relativo massimo ${peggio.toExponential(1)}` +
  (nomePeggio ? ` (${nomePeggio})` : '') +
  (peggio < 1e-9 ? ' — rumore di virgola mobile' : ' — DA GUARDARE'));
if (rotti) process.exitCode = 1;
