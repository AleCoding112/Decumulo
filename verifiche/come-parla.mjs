// ============================================================================
//  QUELLO CHE IL CALCOLATORE DICE, non quello che calcola.
//
//  I 155 controlli guardano i numeri; nessuno guarda le frasi. Ma metà del testo
//  del calcolatore non sta nell'HTML: nasce da template literal dentro il
//  codice, quindi non si trova con una ricerca nel sorgente e non si vede
//  finché non si apre la pagina con i dati giusti.
//
//  Qui il calcolatore viene ESEGUITO su alcuni scenari, si raccoglie tutto
//  quello che scrive, e si controllano quattro cose che a mano si dimenticano:
//
//   1. nessun elemento cercato dal codice manca dalla pagina (EL() lo direbbe
//      in console, e in console non guarda nessuno);
//   2. il registro resta impersonale: niente «voi», niente «tu». Il modulo
//      prevede una persona sola, e lì il plurale è proprio sbagliato;
//   3. la riga in alto compare solo quando serve;
//   4. nessun «undefined», «NaN» o «[object Object]» finito in pagina.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const PAGINA = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
// LA PAGINA HA PIÙ DI UNO <script>. Da quando il piè di pagina porta con sé il banner del
// consenso, il primo è quello: prendere «il primo» faceva caricare quaranta righe di banner al
// posto del motore, e l'armatura falliva su un codice giusto.
// Si sceglie dicendo COSA si vuole — il blocco che contiene il motore — invece di fidarsi
// dell'ordine in cui il build monta i pezzi.
const src = [...PAGINA.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

// I VALORI DI PARTENZA STANNO NELL'HTML, NON NEGLI SCENARI. Rendimenti, inflazione e orizzonte
// hanno un `value` scritto nel modulo: uno scenario che non li nomina deve vedere quelli, non
// lo zero. Senza, «modulo vuoto» non era il modulo che si apre davvero, e un fixture che
// dimenticava l'orizzonte finiva nel ramo «orizzonte già superato» invece che dove doveva.
const DEFAULT = {};
for (const m of PAGINA.matchAll(/<input\b[^>]*\bid="(\w+)"[^>]*>/g))
  DEFAULT[m[1]] = (m[0].match(/\bvalue="([^"]*)"/) || [, ''])[1];
for (const m of PAGINA.matchAll(/<select\b[^>]*\bid="(\w+)"[\s\S]*?<\/select>/g)){
  // senza `selected` vale la prima opzione, come nel browser
  const s = m[0].match(/<option[^>]*\bselected\b[^>]*>/);
  DEFAULT[m[1]] = ((s ? s[0] : m[0].match(/<option[^>]*>/)[0])
                   .match(/\bvalue="([^"]*)"/) || [, ''])[1];
}

// --- gli scenari: coprono i rami che scrivono frasi diverse ------------------
const BASE = {quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1975, nascita1:1977,
  ral0:38000, ral1:33000, stip0:2200, stip1:1900, pens0:1500, pens1:1300,
  annoPens0:2042, annoPens1:2044, pcVoi0:1.2, pcVoi1:1.5, pcDat0:2, pcDat1:2,
  iscr0:2005, iscr1:2007, patrimonio:200000, spesa:2500, rend:4, infl:2, rendFondo:3,
  cresc0:'', cresc1:'', spesaPens:'',
  tipoFondo0:'collettiva', tipoFondo1:'collettiva', ultimo0:'', ultimo1:'',
  etaFine:95, fondo0:60000, fondo1:120000, quotaCap0:0.5, quotaCap1:1,
  forma0:'vita', forma1:'rev', tfrDove0:'fondo', tfrDove1:'azienda', rita0:2042, rita1:2044};

const SCENARI = {
  'due persone, piano che regge':   BASE,
  'una persona sola':               {...BASE, quanti:'1', nome1:'', forma0:'certa'},
  'modulo vuoto':                   {},
  'patrimonio che si esaurisce':    {...BASE, patrimonio:40000, spesa:4200, rend:1},
  'fondo piccolo, tutto in contanti':{...BASE, fondo0:15000, fondo1:15000},
  'fondo grosso, tagliato al massimo di legge': {...BASE, fondo0:300000, fondo1:300000},
  'nessun contributo, solo TFR':    {...BASE, pcVoi0:'', pcVoi1:'', pcDat0:'', pcDat1:''},
  'la quota del datore senza la propria': {...BASE, pcVoi0:'', pcVoi1:''},
  'erogazione anticipata in corso': {...BASE, rita0:2035, rita1:2037, fondo0:200000, fondo1:200000},
  'patrimonio che cala ma arriva in fondo': {...BASE, spesa:3600},
  'retribuzione che cresce e spesa che cala in pensione': {...BASE, cresc0:4, cresc1:3, spesaPens:1800},
  // com'è per chi arriva la prima volta: una persona, nessun nome, e la prestazione ancora
  // tutta in rendita — è il caso in cui saltavano fuori «il fondo di il primo» e «il 0%»
  'prima visita: una persona, nomi vuoti': {...BASE, quanti:'1', nome0:'', nome1:'',
    quotaCap0:0, quotaCap1:0},
  // col rendimento basso il pareggio capitale/rendita si rovescia: è il ramo in cui la frase
  // scrive «la rendita è già avanti» invece di una soglia
  'rendimento basso: la rendita si riprende': {...BASE, rend:1},
  // il fondo sottoscritto per conto proprio: niente quota del datore, e la sezione 1 non deve
  // parlare di un gradino che lì non c'è
  'fondo aperto, con la quota del datore scritta lo stesso':
    {...BASE, tipoFondo0:'individuale', tipoFondo1:'individuale'},
  'fondo aperto, senza quota del datore':
    {...BASE, tipoFondo0:'individuale', tipoFondo1:'individuale', pcDat0:'', pcDat1:''},
  // l'ultimo anno di lavoro di ciascuno: il caso in cui resta un tratto senza reddito da
  // lavoro né trattamento, che è la ragione per cui la casella esiste
  'uno smette molto prima della propria pensione': {...BASE, ultimo0:2030},
  'smettono in due anni diversi':                  {...BASE, ultimo0:2030, ultimo1:2036},
  'scritto oltre la propria decorrenza':           {...BASE, ultimo0:2060},
  // LA DECORRENZA GIÀ TRASCORSA. È il caso che scrive più prose nuove di tutti: l'avviso
  // accanto alla casella, la riga sulla cessazione che non c'è, la seconda spesa che si spegne.
  // Vanno esercitati tutti e tre gli assetti, perché le frasi cambiano con quanti sono.
  'una persona, già in pensione':    {...BASE, quanti:'1', nome1:'', annoPens0:2015,
                                      stip0:'', ral0:'', rita0:0},
  'coppia, uno già in pensione':     {...BASE, annoPens0:2015, stip0:'', ral0:'', rita0:0},
  'coppia, tutti e due già in pensione': {...BASE, annoPens0:2015, annoPens1:2022,
                                      stip0:'', stip1:'', ral0:'', ral1:'', rita0:0, rita1:0},
  'già in pensione col fondo scritto lo stesso': {...BASE, quanti:'1', nome1:'',
                                      annoPens0:2015, fondo0:250000, rita0:0},
  'decorrenza nell\'anno in corso':  {...BASE, quanti:'1', nome1:'', annoPens0:2026,
                                      stip0:'', ral0:'', rita0:0}
};

// --- il calcolatore, eseguito senza browser ---------------------------------
function esegui(DATI){
  const scritte = {}, avvisi = [];
  const osservatori = {};
  const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
    min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){}, closest:() => null,
    hidden:false, get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
  const elementi = {};
  globalThis.IntersectionObserver = class {
    constructor(cb){ this.cb = cb; }
    observe(el){ osservatori[el.__id] = this.cb; }
  };
// `addEventListener` sulla finestra: la pagina lo usa per aprire il dettaglio prima della
// stampa. Nei DOM finti non esiste, ed è la quinta volta che un'armatura incompleta fa
// cadere codice buono: si completa l'armatura, non si indebolisce la pagina.
globalThis.addEventListener = globalThis.addEventListener || (() => {});
// `window` esiste sempre in un browser, e la pagina lo nomina per l'evento della misurazione.
// Nei DOM finti non c'era: sesta volta che un'armatura incompleta fa cadere codice buono.
// Puntato a `globalThis`, così `window.gtag` resta indefinito e l'evento non parte mai qui.
globalThis.window = globalThis;
  globalThis.document = {
    body:{classList:{toggle(){}}}, querySelectorAll: () => [],
    getElementById: id => elementi[id] ??= new Proxy(
      Object.assign(finto(), {__id: id,
        value: DATI[id] === undefined ? (DEFAULT[id] ?? '') : String(DATI[id])}),
      {set(t, k, v){
        if ((k === 'textContent' || k === 'innerHTML') && String(v).trim()) scritte[id] = String(v);
        t[k] = v; return true;
      }})
  };
  const warn = console.warn, err = console.error;
  console.warn = (...a) => avvisi.push(a.join(' '));
  console.error = (...a) => avvisi.push(a.join(' '));
  try { new Function(src + '\nreturn {calc};')().calc(); }
  finally { console.warn = warn; console.error = err; }
  return {scritte, avvisi, elementi, osservatori};
}

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

// seconda persona, singolare e plurale: le desinenze che contano più i possessivi
const PERSONA = /\b(vostr\w+|voi|avete|siete|potete|dovete|scrivete|versate|muovete|percepite|prevedete|indicatela|lasciate|smettiate|perdereste|tuo|tua|tuoi|tue|puoi|devi|hai)\b/gi;
const SPORCO  = /\b(undefined|NaN|\[object|Infinity)\b/;

console.log('\n— quello che il calcolatore scrive, scenario per scenario —');
for (const [nome, DATI] of Object.entries(SCENARI)){
  const {scritte, avvisi} = esegui(DATI);
  const testo = Object.values(scritte).join(' ').replace(/<[^>]+>/g, ' ');
  const persona = testo.match(PERSONA);
  const sporco = testo.match(SPORCO);
  c(`${nome}: nessun elemento mancante`, avvisi.length === 0, avvisi.join(' · '));
  c(`${nome}: registro impersonale`, !persona, persona ? persona.join(', ') : '');
  c(`${nome}: nessun valore rotto in pagina`, !sporco, sporco ? sporco[0] : '');
}

console.log('\n— il sommario in alto —');
{
  const pieno = esegui(BASE);
  const riga = () => (pieno.elementi.sommarioRiga.innerHTML || '').replace(/<[^>]+>/g, '');
  c('in cima alla pagina resta nascosto', pieno.elementi.sommario.hidden === true);
  pieno.osservatori.titolo([{isIntersecting: false}]);
  c('col titolo del sito ancora in vista resta nascosto', pieno.elementi.sommario.hidden === true,
    'in cima non c\'è niente da tenere sott\'occhio');
  pieno.osservatori.cima([{isIntersecting: false}]);
  c('passato il titolo, e col risultato fuori schermo, compare',
    pieno.elementi.sommario.hidden === false, riga());
  // IL SOMMARIO È IL TITOLO ACCORCIATO: se dicono due cose diverse, chi legge non sa quale vale.
  // Qui si controlla proprio quello, non la formula del testo: verdetto uguale, e la cifra del
  // sommario dev'essere una di quelle che compaiono nel titolo o nel sottotitolo.
  const pulisci = t => (t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const cifre = t => (pulisci(t).match(/[\d.]+ €/g) || []);
  const risultato = pulisci(pieno.scritte.titolo) + ' ' + pulisci(pieno.scritte.sottotitolo);
  c('il verdetto del sommario è quello del risultato',
    /Sostenibile/.test(riga()) && /Decumulo sostenibile/.test(risultato));
  c('la cifra del sommario compare anche nel risultato',
    cifre(riga()).length > 0 && cifre(riga()).every(n => risultato.includes(n)),
    `sommario ${cifre(riga()).join(', ')}`);
  c('il sommario non porta cifre che il risultato non ha',
    !/spesa massima/.test(riga()), 'la spesa sostenibile è un\'ipotesi, non un dato loro');
  pieno.osservatori.titolo([{isIntersecting: true}]);
  c('tornando sul risultato sparisce', pieno.elementi.sommario.hidden === true);

  const vuoto = esegui({});
  vuoto.osservatori.cima([{isIntersecting: false}]);
  vuoto.osservatori.titolo([{isIntersecting: false}]);
  c('col modulo vuoto non compare mai', vuoto.elementi.sommario.hidden === true,
    'senza verdetto non c\'è niente da tenere sott\'occhio');

  const cala = esegui({...BASE, spesa:3600});
  cala.osservatori.cima([{isIntersecting: false}]);
  cala.osservatori.titolo([{isIntersecting: false}]);
  const testoCala = (cala.elementi.sommarioRiga.innerHTML || '').replace(/<[^>]+>/g, '');
  c('sul piano che cala ma regge dice quanto resta alla fine',
    /Sostenibile/.test(testoCala) && /restano/.test(testoCala)
    && (pulisci(cala.scritte.titolo) + pulisci(cala.scritte.sottotitolo))
       .includes((testoCala.match(/[\d.]+ €/) || [''])[0]),
    testoCala);

  const rotto = esegui({...BASE, patrimonio:40000, spesa:4200, rend:1});
  rotto.osservatori.cima([{isIntersecting: false}]);
  rotto.osservatori.titolo([{isIntersecting: false}]);
  const testoRotto = (rotto.elementi.sommarioRiga.innerHTML || '').replace(/<[^>]+>/g, '');
  c('su un piano che non regge cambia verdetto e colore',
    /Non sostenibile/.test(testoRotto) && / giu\b|giu$/.test(rotto.elementi.sommario.className),
    testoRotto);
}

// --- la frase del punto più alto, e il pulsante che ci porta il cursore ---
// La frase scriveva la percentuale DUE VOLTE («il punto più alto è il 12,0% — il 12,0% — …»)
// ogni volta che il punto non cadeva su uno dei due riferimenti. E il pulsante deve portare a un
// valore che il cursore possa davvero raggiungere: il passo è 0,1.
console.log('\n— il punto più alto della contribuzione —');
for (const [nome, DATI] of Object.entries({
  'chi già versa':            {...BASE, quanti:'1'},
  'chi non versa niente':     {...BASE, quanti:'1', pcVoi0:''},
  'senza quota del datore':   {...BASE, quanti:'1', pcDat0:'', rendFondo:2, rend:7},
  'fondo che rende più':      {...BASE, quanti:'1', rendFondo:7, rend:2}
})){
  const {scritte, elementi} = esegui(DATI);
  const frase = (scritte.cVers0Piu || '').replace(/<[^>]+>/g, '');
  const pc = (frase.match(/\d+(,\d+)?%/g) || []);
  c(`${nome}: la percentuale non è scritta due volte`, pc.length <= 1, frase.slice(0, 90));
  const b = elementi.cVers0Vai;
  if (!b.hidden){
    const dove = +b.dataset.pc, max = +elementi.cVers0.max;
    c(`${nome}: il pulsante porta a un punto che il cursore può raggiungere`,
      dove >= 0 && dove <= max + 1e-9 && Math.abs(dove * 10 - Math.round(dove * 10)) < 1e-9,
      `${dove}% su un cursore che arriva al ${max}%`);
    c(`${nome}: il pulsante dice la stessa cifra della frase`,
      frase.includes(String(dove).replace('.', ',')) ||
      frase.includes(String(Math.round(dove))), b.textContent);
  }
}

// --- il pareggio fra capitale e rendita ------------------------------------
// LA DIREZIONE È LA COSA CHE SI SBAGLIA. Vivere più a lungo rende la rendita MENO svantaggiosa,
// quindi la soglia di rendimento sotto cui conviene deve SALIRE con l'età. Scriverla al
// contrario darebbe una frase perfettamente sensata e completamente falsa, e nessun altro
// controllo se ne accorgerebbe: lo stesso difetto già capitato con la soglia del «tutto in
// contanti», dove il verso era invertito.
// E l'età va nominata per quello che è: la seconda NON è «l'orizzonte scritto sopra», perché
// nella casella c'è l'età della persona più giovane.
console.log('\n— il pareggio fra capitale e rendita —');
for (const [nome, DATI] of Object.entries({
  'due persone':            BASE,
  'una persona sola':       {...BASE, quanti:'1'},
  'rendimento basso':       {...BASE, rend:1},
  'rendimento alto':        {...BASE, rend:8},
  'orizzonte corto':        {...BASE, etaFine:82}
})){
  const {scritte} = esegui(DATI);
  const frase = (scritte.cScambio0 || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  if (!/Quanto pesa vivere a lungo/.test(frase)){
    c(`${nome}: la frase del pareggio c'è`, false, frase.slice(0, 80)); continue;
  }
  const dopo = frase.slice(frase.indexOf('Quanto pesa vivere a lungo'));
  const eta  = [...dopo.matchAll(/arrivando a (\d+)/g)].map(m => +m[1]);
  const soglie = [...dopo.matchAll(/sotto (−?-?\d+(?:,\d+)?)%/g)]
    .map(m => +m[1].replace('−', '-').replace(',', '.'));
  c(`${nome}: le età sono in ordine crescente`,
    eta.length >= 1 && eta.every((v, k) => k === 0 || v > eta[k-1]), eta.join(' → '));
  if (soglie.length === 2)
    c(`${nome}: vivendo di più la soglia sale`, soglie[1] > soglie[0],
      `${soglie[0]}% → ${soglie[1]}%`);
  else
    c(`${nome}: un solo estremo, e non è un numero mancante`, eta.length === 1 || /già avanti|non recupera/.test(dopo),
      dopo.slice(0, 110));
  c(`${nome}: le percentuali sono dichiarate reali`, /al netto dell'inflazione/.test(dopo));
  c(`${nome}: la seconda età non è spacciata per la casella`,
    !/l'orizzonte scritto sopra/.test(dopo));
}

// --- il tipo di fondo: quello che la pagina PROMETTE, non solo quello che calcola ---
// Il modello è coperto dai controlli e dalle invarianti. Qui si guarda un'altra cosa: che
// nessuna frase continui a dire «basta versare la quota minima perché scattino X € dall'azienda»
// a chi quei soldi non li prenderà. Il numero giusto sotto una frase sbagliata resta una
// promessa falsa, e la sezione 1 esiste apposta per fare quella promessa.
console.log('\n— il tipo di fondo, in quello che la pagina scrive —');
for (const [nome, DATI] of Object.entries({
  'fondo di categoria':  BASE,
  'fondo aperto':        {...BASE, tipoFondo0:'individuale', tipoFondo1:'individuale'}
})){
  const {scritte} = esegui(DATI);
  const tutto = Object.values(scritte).join(' ').replace(/<[^>]+>/g, ' ');
  const promette = /scattin\w+|dall'azienda|andrebbe perso|fa scattare/.test(tutto);
  const individuale = DATI.tipoFondo0 === 'individuale';
  c(`${nome}: la quota dell'azienda ${individuale ? 'non va promessa' : 'va promessa'}`,
    promette === !individuale, promette ? 'la promette' : 'non la promette');
  if (individuale)
    c(`${nome}: e la pagina dice perché`,
      /non viene conteggiata/.test(tutto) && /non spetta/.test(tutto));
}

// --- la prova di tenuta, nei suoi tre rami ---------------------------------
// I tre rami dicono cose opposte. Quello che conta è che «regge lo stesso» non compaia mai su un
// piano che alla prova non regge: sarebbe la peggiore delle rassicurazioni. Gli scenari sono
// costruiti dai numeri, non indovinati — la fascia fra le due spese sostenibili è per
// costruzione quella in cui il verdetto si rovescia.
console.log('\n— la prova di tenuta —');
{
  const conSpesa = spesa => {
    const {scritte} = esegui({...BASE, spesa});
    return (scritte.tenuta || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  };
  const comodo = conSpesa(2500);
  c('su un piano comodo dice che regge lo stesso, e di quanto scende la spesa',
    /regge lo stesso/.test(comodo) && /spesa massima sostenibile passa da/.test(comodo), comodo);
  c('e dichiara che cosa ha fatto, senza lasciarlo indovinare',
    /primi \d+ esercizi a rendimento reale nullo/.test(comodo));
  // il piano che regge sulla media ma non sulla sequenza
  const rotto = conSpesa(4300);
  c('dove il verdetto si rovescia lo dice, e non dice «regge lo stesso»',
    !/regge lo stesso/.test(rotto), rotto);
  // due sotto-rami: la prova anticipa la fine, oppure la fine cade nello stesso esercizio.
  // «si esaurisce nel 2029 anziché nel 2029» era una frase che non diceva niente, ed è uscita
  // solo eseguendo: nessuna lettura del codice l'avrebbe mostrata.
  const anticipa = conSpesa(5000), subito = conSpesa(9000);
  c('quando la prova anticipa la fine, dice i due anni',
    /anziché nel/.test(anticipa) && !/regge lo stesso/.test(anticipa), anticipa);
  c('quando la fine non si muove, non mette due volte lo stesso anno',
    /si esaurisce comunque nel/.test(subito) && !/anziché/.test(subito), subito);
  // con rendimenti reali gia non positivi non c'è niente da spegnere: la riga tace invece di
  // confrontare un piano con sé stesso
  const {scritte: piatto} = esegui({...BASE, rend: 2, rendFondo: 1, infl: 2});
  c('con rendimenti reali non positivi la riga non compare',
    !(piatto.tenuta || '').trim(), (piatto.tenuta || '').replace(/<[^>]+>/g,' ').slice(0, 80));
  c('e i rami non si sovrappongono mai',
    [comodo, rotto, anticipa, subito].every(t => t.split('Prova di tenuta').length === 2));
}

// --- il contributo dell'azienda che non arriva -----------------------------
// La riga in alto porta il FATTO, la sezione in fondo la DECISIONE. Il rischio di una feature
// così è che diventi un doppione: due volte lo stesso conto, e chi legge non sa quale vale.
// Qui si controlla che compaia SOLO a chi ci è dentro, che dica il vero, e che non ripeta.
console.log('\n— il contributo dell\'azienda che non arriva —');
{
  const riga = DATI => {
    const {scritte, elementi} = esegui(DATI);
    return {testo: (elementi.lasciato.innerHTML || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
            visibile: elementi.lasciato.hidden === false, scritte};
  };
  // chi versa gia: la riga non deve esistere
  c('chi versa la sua quota non vede niente', !riga(BASE).visibile, riga(BASE).testo.slice(0,60));
  // chi ha scritto ZERO: è il caso della feature
  const zero = riga({...BASE, pcVoi0: 0, pcVoi1: 0});
  c('chi ha scritto 0 la vede', zero.visibile, zero.testo.slice(0, 120));
  c('e porta la cifra annua e il totale fino alla cessazione',
    /€ l'anno dall'azienda/.test(zero.testo) && /in euro di oggi/.test(zero.testo));
  c('e rimanda dove si decide, invece di rifare il conto',
    /Quanto costa attivarlo/.test((riga({...BASE, pcVoi0:0, pcVoi1:0}).scritte.lasciato || '')));
  // la casella VUOTA è un'altra cosa: lì risponde l'istruzione accanto alla casella
  c('con la casella vuota tace: al vuoto risponde il modulo, non il risultato',
    !riga({...BASE, pcVoi0:'', pcVoi1:''}).visibile);
  // su un fondo sottoscritto per conto proprio quella quota non esiste
  c('su un fondo aperto non promette niente',
    !riga({...BASE, pcVoi0:0, pcVoi1:0, tipoFondo0:'individuale', tipoFondo1:'individuale'}).visibile);
  // chi ha gia smesso non ha piu niente da attivare
  c('a chi ha gia smesso di lavorare non compare',
    !riga({...BASE, pcVoi0:0, pcVoi1:0, ultimo0:2024, ultimo1:2024}).visibile);
  // senza quota del datore indicata non c'è un gradino da nominare
  c('senza quota del datore indicata non compare',
    !riga({...BASE, pcVoi0:0, pcVoi1:0, pcDat0:'', pcDat1:''}).visibile);
  // NON DEVE ESSERE UN DOPPIONE: la riga in alto e la sezione in fondo non possono portare la
  // stessa frase. Si confrontano le due, cercando sequenze lunghe in comune.
  const {scritte} = esegui({...BASE, pcVoi0: 0, pcVoi1: 0});
  const pul = t => (t || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const alto = pul(scritte.lasciato), basso = pul(scritte.cVers0Picco);
  const parole = alto.split(' ');
  let comune = 0;
  for (let i = 0; i < parole.length; i++)
    for (let j = i + 6; j <= parole.length; j++)
      if (basso.includes(parole.slice(i, j).join(' '))) comune = Math.max(comune, j - i);
  c('la riga in alto non ripete la frase della sezione in fondo', comune < 6,
    comune ? `${comune} parole di fila in comune` : 'nessuna sequenza in comune');
}

// --- il sommario porta dove dice di portare --------------------------------
// È diventato un link (31/07): la pagina è lunga sette schermate e l'unico salto lungo è tornare
// al risultato. Un'ancora che punta a un id inesistente non dà errore, non fa niente e nessuno
// se ne accorge finché non ci clicca qualcuno.
console.log('\n— il sommario, che ora è un link —');
{
  const pagina = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
  const tag = (pagina.match(/<(\w+)[^>]*id="sommario"/) || [])[1];
  const href = (pagina.match(/id="sommario"[^>]*href="([^"]+)"/)
             || pagina.match(/href="([^"]+)"[^>]*id="sommario"/) || [])[1];
  c('il sommario è un elemento interattivo', tag === 'a', tag);
  c('e porta un\'ancora', !!href && href.startsWith('#'), href);
  c('l\'ancora esiste davvero nella pagina',
    !!href && new RegExp('id="' + href.slice(1) + '"').test(pagina), href);
  // il testo duplica quello che sta sotto: per un lettore di schermo dev'essere muto, ma il
  // link no, o sarebbe una voce senza nome
  c('il testo resta muto per i lettori di schermo, il link no',
    /id="sommarioRiga"[^>]*aria-hidden="true"/.test(pagina)
    && /id="sommario"[^>]*aria-label=/.test(pagina));
  // diventando <a> ha preso display:block, che da solo vincerebbe sull'attributo hidden
  c('e nascosto resta nascosto anche col display esplicito',
    /\.sommario\[hidden\]\{display:none\}/.test(pagina));
}

// --- se uno dei due mancasse -----------------------------------------------
// La riga confronta due discese: le entrate di chi resta e la spesa. Le cose che si possono
// sbagliare sono due, e nessuna la vedrebbe un controllo sui numeri: dire «tenore mantenuto»
// quando il rapporto sta sotto la soglia, e comparire con una persona sola, dove non resta
// nessuno di cui parlare.
console.log('\n— se uno dei due mancasse —');
{
  const riga = o => { const {scritte} = esegui({...BASE, ...o});
    return (scritte.superstite || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); };
  const due = riga({});
  c('con due persone la riga c\'è', /Se uno dei due mancasse/.test(due), due.slice(0, 130));
  c('e dichiara l\'ipotesi invece di darla per scontata', /speranza di vita ISTAT/.test(due));
  c('e porta la soglia con cui confrontarsi', /spesa che scende fra il/.test(due));
  c('CON UNA PERSONA SOLA TACE: non resta nessuno di cui dire qualcosa',
    !riga({quanti:'1', nome1:''}), riga({quanti:'1', nome1:''}).slice(0, 60));
  c('col modulo vuoto tace', !riga({...Object.fromEntries(Object.keys(BASE).map(k => [k, '']))}));
  // il verdetto deve seguire il numero peggiore, non il primo
  const quadra = t => {
    const q = [...t.matchAll(/(\d+)% mancando/g)].map(m => +m[1]);
    if (!q.length) return true;
    const peggio = Math.min(...q);
    if (/tenore di vita è mantenuto/.test(t)) return peggio >= 67;
    if (/attingere al patrimonio/.test(t))    return peggio < 60;
    return peggio >= 60 && peggio < 67;
  };
  for (const [nome, o] of Object.entries({
    'pensioni equilibrate': {},
    'pensioni squilibrate': {pens0:3400, pens1:500},
    'pensioni alte':        {pens0:3400, pens1:3000},
    'pensioni basse':       {pens0:900,  pens1:800}
  })) c(`${nome}: il verdetto segue il rapporto peggiore`, quadra(riga(o)), riga(o).slice(-150));
}

// --- ogni casella deve avere un nome, anche per chi non vede lo schermo ---
// Ventinove campi su trentotto non avevano un'etichetta collegata: il testo stava in un `<div>`
// accanto, che si vede ma non si annuncia, e in due colonne non diceva nemmeno di chi fosse.
// Il nome lo compone `calc()` leggendo la `.voce` della riga.
//
// QUI SI VERIFICA UNA PROPRIETÀ SEMPLICE E ROBUSTA: che ogni campo stia in uno dei posti che il
// meccanismo copre. Un controllo più fine sulla struttura dell'HTML l'ho scritto e buttato:
// dava due falsi positivi su campi che in Chrome il nome ce l'avevano. Le regex sull'HTML
// promettono una precisione che non hanno; la resa vera si guarda con `verifiche/a-schermo.mjs`.
console.log('\n— ogni casella ha un nome —');
{
  const pagina = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
  const html = pagina.replace(/<script>[\s\S]*?<\/script>/g, '');
  const perFor = new Set([...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(m => m[1]));
  const dentroLabel = new Set();
  for (const m of html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g))
    for (const q of m[1].matchAll(/id="([^"]+)"/g)) dentroLabel.add(q[1]);
  // i campi delle due colonne: stanno tutti dentro una `.cella`, ed è quella che `calc()` nomina
  const inCella = new Set();
  for (const m of html.matchAll(/<div class="cella[^"]*">([\s\S]{0,400}?)<\/div>/g))
    for (const q of m[1].matchAll(/<(?:input|select)[^>]*id="([^"]+)"/g)) inCella.add(q[1]);

  const campi = [...html.matchAll(/<(?:input|select)([^>]*)id="([^"]+)"([^>]*)>/g)]
    .filter(m => !/type="hidden"/.test(m[1] + m[3])).map(m => m[2]);
  const orfani = campi.filter(id => !perFor.has(id) && !dentroLabel.has(id) && !inCella.has(id));
  c('nessun campo resta fuori dai tre modi di essere nominato', orfani.length === 0,
    orfani.length ? orfani.join(', ')
      : `${campi.length} campi: ${perFor.size} con <label for>, ${dentroLabel.size} dentro un `
        + `<label>, ${inCella.size} in una cella che il codice nomina`);
  c('e il meccanismo che li nomina è in piedi',
    /setAttribute\('aria-label'/.test(pagina) && /etichettaDi/.test(pagina)
    && /aria-label', `\$\{che\}/.test(pagina));
}

// --- il nome di una classe non è libero solo perché non lo si è ancora usato ---
// Il 31/07/2026 una regola `position:fixed` è finita su `.barra`, che era già la classe di
// ogni blocco col cursore: risultato, tutti i cursori inchiodati in cima allo schermo. Chi sta
// fisso sul vetro dev'essere UNO. Il conteggio guarda anche il codice, perché metà delle classi
// le scrivono i template literal e nel solo HTML non si vedono.
console.log('\n— chi sta fisso sullo schermo —');
{
  const pagina = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');
  // TUTTI i blocchi di stile, non il primo: il banner del consenso porta il proprio, e una
  // regola `position:fixed` scritta là dentro sarebbe sfuggita a questo controllo.
  const stile = [...pagina.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const fisse = [...stile.matchAll(/\.([\w-]+)[^{}]*\{[^}]*position:\s*fixed/g)].map(m => m[1]);
  c('c\'è almeno un elemento fisso, ed è dichiarato', fisse.length > 0, fisse.join(', '));
  // SI CONFRONTA LA CLASSE INTERA, non la parola dentro l'attributo. Con `\b` il trattino è un
  // confine, quindi `.consenso` risultava applicata anche a `consenso-b` e `pie-consenso`: tre
  // usi invece di uno, e il controllo dava rosso su un codice giusto. È il settimo falso
  // positivo degli strumenti di questo progetto, e ancora una volta della stessa famiglia:
  // una regex che promette una precisione che non ha.
  const classi = [...pagina.matchAll(/class="([^"$]*)"/g)]
    .map(m => m[1].trim().split(/\s+/));
  for (const cl of fisse){
    const usi = classi.filter(v => v.includes(cl)).length;
    c(`la classe fissa .${cl} è applicata a un elemento solo`, usi === 1,
      usi === 1 ? '' : `applicata ${usi} volte: il nome era già occupato`);
  }
}

// --- le caselle da cui il verdetto dipende, e la frase che le promette ---
// Il 01/08/2026 la pagina scriveva «per il verdetto bastano tre dati» e la guardia ne
// controllava tre: chi si fermava lì riceveva un verdetto pieno calcolato con patrimonio zero
// e nessuna entrata, cioè «decumulo non sostenibile, il patrimonio si esaurisce nel <oggi>».
// Lo scostamento andava sempre nella direzione più allarmante, perché le entrate mancanti
// valgono zero e la spesa no.
// Qui si tiene ferma la sola proprietà che conta: LA PROMESSA E LA GUARDIA SONO LA STESSA
// COSA. Non si controlla la formula della frase, si contano le caselle che chiede.
console.log('\n— le caselle che il verdetto richiede —');
{
  const CASELLE = {
    spesa:      'la spesa mensile',
    patrimonio: 'il patrimonio investito',
    nascita0:   "l'anno di nascita",
    annoPens0:  'la decorrenza del trattamento',
    stip0:      'la retribuzione netta mensile',
    pens0:      "l'importo del trattamento INPS"
  };
  const NUMERO = {quattro:4, cinque:5, sei:6, sette:7, otto:8, nove:9, dieci:10};
  // le frasi nascono da template literal e vanno a capo dove capita: si normalizza, altrimenti
  // il controllo fallisce per un ritorno a capo e sembra un difetto della pagina
  const piano = t => (t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const testo = r => piano(r.scritte.sottotitolo);
  const senzaVerdetto = r => /Dati incompleti/.test(r.scritte.titolo || '');
  // quante volte le etichette compaiono in una frase: con due persone quelle di persona ci
  // stanno due volte, ed è proprio il conto che interessa
  const conta = t => Object.values(CASELLE).reduce((n, v) => n + (t.split(v).length - 1), 0);

  for (const [quanti, atteso] of [['1', 6], ['2', 10]]){
    const r = esegui({quanti});
    const detto = piano(r.scritte.bastano);
    const promesse = NUMERO[(detto.match(/bastano (\w+) dati/) || [, ''])[1]];
    // a modulo vuoto la guardia le chiede tutte: si confronta il numero promesso, le etichette
    // nominate nella promessa e quelle pretese dalla guardia. Devono coincidere tutti e tre.
    // il numero promesso e quello preteso devono coincidere. Le ETICHETTE nella promessa si
    // contano a parte, come insieme e non come somma: con due persone che vogliono le stesse
    // caselle la frase dice «per ciascuno» e le nomina una volta, ed è una contrazione lecita.
    const nominate = new Set(Object.values(CASELLE).filter(v => detto.includes(v)));
    c(`${quanti === '1' ? 'una persona' : 'due persone'}: la frase promette quello che la guardia chiede`,
      promesse === atteso && conta(testo(r)) === atteso && nominate.size === 6,
      `promesse ${promesse}, chieste ${conta(testo(r))}, etichette ${nominate.size}/6`);
  }

  // E CON UNA DECORRENZA GIÀ TRASCORSA IL NUMERO CAMBIA: a chi è in pensione la retribuzione non
  // si chiede, quindi la coppia mista ne vuole nove e non dieci. Era l'incoerenza che ha imposto
  // di far uscire promessa e guardia dallo stesso elenco invece di contarle a mano.
  {
    const r = esegui({quanti:'2', nome0:'Anna', nome1:'Bruno',
                      nascita0:1955, nascita1:1968, annoPens0:2015});
    const detto = piano(r.scritte.bastano);
    c('con uno già in pensione la promessa scende a nove, e le nomina per persona',
      NUMERO[(detto.match(/bastano (\w+) dati/) || [, ''])[1]] === 9 && conta(detto) === 9,
      detto.slice(0, 110));
    c('e non promette «per ciascuno» quando a ciascuno serve una cosa diversa',
      !/per ciascuno/.test(detto));
  }

  // il caso da cui è nato tutto: i tre dati di prima non bastano più
  c('con la sola spesa, nascita e decorrenza il verdetto resta sospeso',
    senzaVerdetto(esegui({quanti:'1', spesa:2500, nascita0:1975, annoPens0:2042})),
    'erano i «tre dati» promessi dalla pagina');

  // ogni casella richiesta, tolta da sola, sospende il verdetto: nessuna vale zero in silenzio
  const PIENO = {quanti:'1', spesa:2500, patrimonio:400000, nascita0:1958, annoPens0:2030,
                 stip0:2400, pens0:1800};
  c('col modulo completo il verdetto esce', !senzaVerdetto(esegui(PIENO)));
  for (const id of Object.keys(CASELLE))
    c(`senza ${CASELLE[id]} il verdetto resta sospeso`,
      senzaVerdetto(esegui({...PIENO, [id]: ''})));

  // VUOTO E ZERO RESTANO DUE INFORMAZIONI DIVERSE: chi non ha patrimonio, o non prende ancora
  // un trattamento, scrive 0 e il conto lo prende alla lettera. Senza questa distinzione la
  // guardia avrebbe chiuso fuori proprio chi ha più bisogno della risposta.
  c('uno zero scritto è una risposta, e il verdetto esce',
    !senzaVerdetto(esegui({...PIENO, patrimonio:0, stip0:0, pens0:0})));

  // e non si chiede quello che il piano non usa: chi ha già smesso di lavorare non ha una
  // retribuzione da scrivere
  c('a chi ha già smesso di lavorare la retribuzione non viene chiesta',
    !senzaVerdetto(esegui({...PIENO, stip0:'', ultimo0:2024})));
}

// --- due frasi che parlano dello stesso patrimonio non possono dire il contrario ---
// Trovato guardando uno screenshot: nel riquadro dei dati «la spesa eccede le entrate: il
// patrimonio è già in riduzione», e settecento pixel più sotto «il patrimonio non si riduce in
// nessuno dei 28 esercizi». La prima leggeva le sole entrate ricorrenti, e un disavanzo di
// flusso non è un patrimonio che cala: se il rendimento lo copre, il patrimonio sale.
// È la seconda volta che questo difetto si presenta, e la prima fu su «anni scoperti».
console.log('\n— il disavanzo di flusso non è un patrimonio che cala —');
{
  const pulito = t => (t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // due persone già in pensione, spesa sopra le entrate ma patrimonio ampio: il rendimento
  // copre il disavanzo, quindi il patrimonio cresce mentre il flusso è negativo
  const copre = esegui({quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1955, nascita1:1958,
    annoPens0:2015, annoPens1:2020, pens0:2100, pens1:1250, patrimonio:380000, spesa:2800,
    etaFine:95, fondo0:'', fondo1:'', stip0:'', stip1:'', ral0:'', ral1:''});
  const dati = pulito(copre.scritte.calcolato), verdetto = pulito(copre.scritte.titolo);
  c('col disavanzo coperto dal rendimento la frase non annuncia una riduzione',
    /eccede le entrate/.test(dati) && !/patrimonio è in riduzione/.test(dati), dati.trim());
  c('e non contraddice il verdetto, che dice l\'opposto',
    /non si riduce/.test(verdetto) && !/in riduzione/.test(dati), verdetto.trim().slice(0, 60));
  // e quando cala davvero lo deve dire: la prudenza non è tacere
  const cala = esegui({quanti:'1', nascita0:1955, annoPens0:2015, pens0:900,
    patrimonio:60000, spesa:2600, etaFine:95, fondo0:'', stip0:'', ral0:''});
  c('mentre quando il patrimonio cala davvero la frase lo dice',
    /in riduzione già dal primo esercizio/.test(pulito(cala.scritte.calcolato)),
    pulito(cala.scritte.calcolato).trim());
}

// --- chi è già in pensione ---
// Fino al 01/08/2026 la pagina pretendeva una decorrenza futura: chi era in pensione da anni
// riceveva «Dati incompleti. Per il calcolo serve la decorrenza del trattamento», cioè gli si
// diceva che aveva lasciato in bianco una casella che aveva compilato. Su un sito che si chiama
// decumulo, era chiuso fuori proprio chi è in decumulo.
// Qui si tengono ferme le proprietà del caso nuovo. Quelle sui numeri stanno nelle invarianti:
// queste guardano cosa la pagina DICE e cosa lascia toccare.
console.log('\n— chi è già in pensione —');
{
  const UNO = {quanti:'1', spesa:2500, patrimonio:400000, nascita0:1955, pens0:1800,
               fondo0:90000, iscr0:2005};
  const testo = r => ((r.scritte.titolo || '') + ' ' + (r.scritte.sottotitolo || ''))
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const spente = (r, ids) => ids.every(k => r.elementi[k] && r.elementi[k].disabled === true);
  const attive = (r, ids) => ids.every(k => r.elementi[k] && r.elementi[k].disabled === false);
  const ATTIVITA = ['stip0','ral0','cresc0','ultimo0'];
  const FONDO    = ['tipoFondo0','fondo0','iscr0','pcVoi0','pcDat0','tfrDove0'];

  const gia = esegui({...UNO, annoPens0:2015});
  c('il verdetto esce, invece di chiedere una casella già compilata',
    !/Dati incompleti/.test(gia.scritte.titolo || ''), testo(gia).slice(0, 80));
  c('l\'avviso compare, e dice che il fondo non è rappresentato',
    gia.elementi.avvisoPensione.hidden === false
    && /non è rappresentato/.test(gia.scritte.avvisoPensione || ''));
  c('le caselle di attività e del fondo sono disattivate, non ignorate',
    spente(gia, [...ATTIVITA, ...FONDO]));
  c('la sezione delle scelte sparisce: sono decisioni già compiute',
    gia.elementi.decisioni.hidden === true);
  c('la seconda spesa si spegne, perché non c\'è una seconda fase',
    gia.elementi.spesaPens.disabled === true
    && /già tutto in pensione/.test(gia.scritte.spesaPensNota || ''));

  // LA PROPRIETÀ CHE VALE PIÙ DI TUTTE: quello che resta scritto nelle caselle spente non deve
  // muovere il conto. Se un giorno rientrasse da una porta laterale, il verdetto cambierebbe
  // senza che nulla in pagina lo annunci, e sarebbe un errore in direzione ottimistica.
  const conFondo  = esegui({...UNO, annoPens0:2015, fondo0:500000});
  const conSpesa2 = esegui({...UNO, annoPens0:2015, spesaPens:800});
  c('il montante scritto non muove il piano di chi è già in pensione',
    testo(conFondo) === testo(gia), testo(conFondo).slice(0, 70));
  c('e nemmeno la spesa della seconda fase, che non esiste',
    testo(conSpesa2) === testo(gia));

  // IL CONFINE. Chi decorre NELL'ANNO IN CORSO riscuote dentro il piano, all'età giusta: non è
  // questo caso, e confonderli toglierebbe il fondo a chi ce l'ha ancora tutto.
  const ora = esegui({...UNO, annoPens0:2026});
  c('la decorrenza nell\'anno in corso non è «già in pensione»',
    ora.elementi.avvisoPensione.hidden === true && attive(ora, FONDO));
  c('e il fondo entra davvero nel conto', testo(ora) !== testo(gia), testo(ora).slice(0, 70));

  // REVERSIBILITÀ: correggere l'anno rimette tutto in gioco. Una disattivazione che non si
  // disfa sarebbe peggio di nessuna, perché chi sbaglia a digitare resta chiuso fuori.
  const futuro = esegui({...UNO, annoPens0:2035, stip0:2400});
  c('correggendo l\'anno le caselle tornano in gioco',
    attive(futuro, [...ATTIVITA, ...FONDO]) && futuro.elementi.avvisoPensione.hidden === true
    && futuro.elementi.decisioni.hidden === false);

  // LA COPPIA MISTA: le scelte restano per chi lavora ancora, e l'avviso nomina solo l'altro.
  const DUE = {...UNO, quanti:'2', nome0:'Anna', nome1:'Bruno', nascita1:1968, pens1:1500,
               annoPens1:2035, stip1:2200, ral1:36000, fondo1:70000, iscr1:2008};
  const mista = esegui({...DUE, annoPens0:2015});
  const av = (mista.scritte.avvisoPensione || '').replace(/<[^>]+>/g, '');
  c('nella coppia mista l\'avviso nomina solo chi ci è dentro',
    /Anna/.test(av) && !/Bruno/.test(av), av.slice(0, 60));
  c('e le scelte restano, perché uno lavora ancora',
    mista.elementi.decisioni.hidden === false
    && mista.elementi.fondo1.disabled === false && mista.elementi.fondo0.disabled === true);
}

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n✓ il calcolatore parla come deve');
if (ko) process.exitCode = 1;
