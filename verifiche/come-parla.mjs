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
  // UNA TENDINA COSTRUITA A RUNTIME QUI DENTRO NON HA OPZIONI, e prenderne «la prima» faceva
  // morire l'armatura su un markup giusto. Il suo valore di partenza non è nessuna delle sue
  // voci: la tendina del comparto è una veduta del rendimento scritto accanto, e finché la
  // pagina non gira vale la stringa vuota — che è esattamente quello che riporta il browser
  // per un select senza opzioni. Nessuna scorciatoia: è il valore vero.
  const prima = s ? s[0] : (m[0].match(/<option[^>]*>/) || [''])[0];
  DEFAULT[m[1]] = (prima.match(/\bvalue="([^"]*)"/) || [, ''])[1];
}

// --- gli scenari: coprono i rami che scrivono frasi diverse ------------------
const BASE = {quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1975, nascita1:1977,
  ral0:38000, ral1:33000, pens0:1500, pens1:1300,
  annoPens0:2042, annoPens1:2044, pcVoi0:1.2, pcVoi1:1.5, pcDat0:2, pcDat1:2,
  iscr0:2005, iscr1:2007, cl3:200000, spesa:2500, rend:4, infl:2, rendFondo:3,
  cresc0:'', cresc1:'', spesaPens:'',
  tipoFondo0:'collettiva', tipoFondo1:'collettiva', ultimo0:'', ultimo1:'',
  etaFine:95, fondo0:60000, fondo1:120000, quotaCap0:0.5, quotaCap1:1,
  forma0:'vita', forma1:'rev', tfrDove0:'fondo', tfrDove1:'azienda', rita0:2042, rita1:2044};

const SCENARI = {
  'due persone, piano che regge':   BASE,
  'una persona sola':               {...BASE, quanti:'1', nome1:'', forma0:'certa'},
  'modulo vuoto':                   {},
  'patrimonio che si esaurisce':    {...BASE, cl3:40000, spesa:4200, rend:1},
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
                                      ral0:'', rita0:0},
  'coppia, uno già in pensione':     {...BASE, annoPens0:2015, ral0:'', rita0:0},
  'coppia, tutti e due già in pensione': {...BASE, annoPens0:2015, annoPens1:2022,
                                      ral0:'', ral1:'', rita0:0, rita1:0},
  'già in pensione col fondo scritto lo stesso': {...BASE, quanti:'1', nome1:'',
                                      annoPens0:2015, fondo0:250000, rita0:0},
  'decorrenza nell\'anno in corso':  {...BASE, quanti:'1', nome1:'', annoPens0:2026,
                                      ral0:'', rita0:0},
  // LE FORME CHE CONSUMANO IL MONTANTE. Scrivono frasi che nessun altro scenario produce: la
  // durata in anni interi, l'avvertenza sulla sopravvivenza, la casella degli anni che compare
  // solo per una delle due, e le rate che nelle fasi non sono «anticipate».
  'rendita a durata definita':      {...BASE, forma0:'durata', forma1:'durata'},
  'erogazione frazionata':          {...BASE, forma0:'frazionata', forma1:'frazionata',
                                     anniFraz0:12, anniFraz1:12},
  'una converte e l\'altra consuma': {...BASE, forma0:'durata', forma1:'rev'},
  'durata definita, tutto in capitale dove si può':
                                    {...BASE, forma0:'durata', forma1:'durata',
                                     fondo0:15000, fondo1:15000, quotaCap0:1, quotaCap1:1},
  // GLI ANNI SCRITTI A METÀ. Sono lo stato in cui la pagina si trova a ogni tasto premuto, e
  // valgono uno scenario come gli altri: prima «207» diventava 1900, cioè una decorrenza
  // passata, e il calcolatore rispondeva col paragrafo di chi ha già riscosso tutto.
  'decorrenza scritta a metà':      {...BASE, annoPens0:'207'},
  'erogazione anticipata scritta a metà': {...BASE, rita0:'204'},
  'ultimo anno scritto a metà':     {...BASE, ultimo0:'203'},
  // L'ABITAZIONE. Scrive prosa che nessun altro scenario produce: il ricavato coi costi in
  // chiaro, la fase «abitazione in locazione», la riga-evento nella tabella e il pareggio in
  // rendimento. I quattro casi coprono i quattro rami della frase.
  'casa venduta per una più piccola': {...BASE, casaCosa:'piccola', casaAnno:2045,
                                       casaValore:300000, casaNuova:180000},
  'casa venduta, si va in affitto':   {...BASE, casaCosa:'affitto', casaAnno:2045,
                                       casaValore:300000, casaCanone:900},
  // il ramo in cui il canone pesa più di quanto il ricavato possa rendere: la pagina deve
  // dirlo, non tacere né consigliare
  'affitto caro, la vendita peggiora il piano': {...BASE, casaCosa:'affitto', casaAnno:2045,
                                       casaValore:120000, casaCanone:1800},
  // l'abitazione lasciata a qualcuno: la scelta è compiuta, il valore no. È il caso descritto
  // dall'istruzione accanto alla casella, e un'istruzione va provata sul caso che descrive.
  'casa lasciata ai figli, si va in affitto': {...BASE, casaCosa:'affitto', casaAnno:2045,
                                       casaValore:'', casaCanone:900},
  // l'anno scritto a metà, come per le altre date: «204» non deve valere una vendita nel 204
  'cambio di casa scritto a metà':    {...BASE, casaCosa:'affitto', casaAnno:'204',
                                       casaValore:300000, casaCanone:900},
  // e la scelta che resta aperta a chi ha la decorrenza alle spalle: è la ragione per cui la
  // sezione delle scelte non sparisce più del tutto
  'già in pensione, e cambia casa':   {...BASE, quanti:'1', nome1:'', annoPens0:2015,
                                       ral0:'', rita0:0, casaCosa:'affitto',
                                       casaAnno:2030, casaValore:250000, casaCanone:800}
};

// --- il calcolatore, eseguito senza browser ---------------------------------
function esegui(DATI){
  const scritte = {}, avvisi = [];
  const osservatori = {};
  const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
    min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){}, closest:() => null,
    // stessa ragione dell'armatura in test.mjs: i nomi accessibili si scrivono con `setAttribute`
    setAttribute(){}, getAttribute(){ return null; },
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

// LA RISCRITTURA LASCIATA A METÀ. Il 02/08/2026 il ramo dell'erogazione a rate scriveva, in
// pagina e in produzione, «il residuo è di 32.092 €, cioè la solo la rivalutazione maturata nel
// frattempo»: un pezzo di frase vecchia rimasto sotto quella nuova. Nessun controllo la vedeva —
// non ci sono `undefined`, i numeri sono giusti, il registro è impersonale — e nel sorgente la
// frase è spezzata su tre righe dentro un template literal, dove l'occhio non la ricompone.
// Quello che resta sempre falso, in italiano, è un articolo seguito da un altro articolo o da un
// avverbio che non concorda: sono i due detriti che una sostituzione a metà lascia dietro.
// Poche coppie, scelte perché non hanno un uso legittimo: «il solo» esiste, «la solo» no.
const ROTTA = /\b(?:(?:il|lo|un|dei|degli)\s+(?:sola|sole|le|gli|la)|(?:la|le|una|i|gli)\s+(?:solo|il|lo|gli|le)|(?:il|la|lo|i|gli|le|un|una|uno)\s+(?:anche|però|quindi|invece|infatti|comunque))\b|\b(\w{3,})\s+\1\b/i;

console.log('\n— quello che il calcolatore scrive, scenario per scenario —');
for (const [nome, DATI] of Object.entries(SCENARI)){
  const {scritte, avvisi} = esegui(DATI);
  const testo = Object.values(scritte).join(' ').replace(/<[^>]+>/g, ' ');
  const persona = testo.match(PERSONA);
  const sporco = testo.match(SPORCO);
  c(`${nome}: nessun elemento mancante`, avvisi.length === 0, avvisi.join(' · '));
  c(`${nome}: registro impersonale`, !persona, persona ? persona.join(', ') : '');
  c(`${nome}: nessun valore rotto in pagina`, !sporco, sporco ? sporco[0] : '');
  // ELEMENTO PER ELEMENTO, E I TAG FANNO DA MURO. Due riquadri accanto portano tutti e due il
  // nome della persona: unendoli nasce un «Anna Anna» che nessuno ha scritto, e due celle di
  // tabella danno «Rendita del fondo | Fondo e TFR». Non sono frasi, sono accostamenti. Una
  // frase vive dentro un elemento e non attraversa un tag, quindi i tag si sostituiscono con un
  // separatore che la ricerca non può scavalcare, non con uno spazio.
  const rotta = Object.entries(scritte)
    .map(([k, v]) => [k, String(v).replace(/<[^>]+>/g, ' | ').match(ROTTA)])
    .find(([, m]) => m);
  c(`${nome}: nessuna frase lasciata a metà`, !rotta,
    rotta ? `«${rotta[1][0]}» in #${rotta[0]}` : '');
  // 1900 è il valore a cui il taglio riconduce un anno troppo piccolo: se compare in pagina,
  // un numero che nessuno ha scritto è diventato una risposta. Non è un formato sbagliato —
  // `SPORCO` non lo vedrebbe — è una data inventata, ed è peggio.
  const inventata = testo.match(/\b1[0-8]\d\d\b|\b19[0-4]\d\b/);
  c(`${nome}: nessuna data inventata`, !inventata, inventata ? inventata[0] : '');
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

  const rotto = esegui({...BASE, cl3:40000, spesa:4200, rend:1});
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

// --- l'avviso sul contributo del datore: nessuna combinazione muta ----------
// TRE CASI SU OTTO NON DICEVANO NIENTE, e nessun controllo se n'era accorto perché tutti i rami
// reagivano alla casella VUOTA. Chi scriveva 0 nella quota del datore — cioè chi ha aderito col
// solo TFR, la persona che questa sezione esiste per servire — non incontrava alcun messaggio,
// e nemmeno il riquadro «quanto stai lasciando lì», che pretende una quota positiva.
// Il controllo prende la tabella per intero: ogni combinazione di vuoto / zero / valore, e per
// ciascuna se l'avviso parla e con quale frase. Un ramo muto qui si vede subito.
console.log('\n— l\'avviso sul contributo del datore, combinazione per combinazione —');
for (const [nome, DATI, atteso] of [
  ['solo TFR: 0 e 0',            {...BASE, quanti:'1', pcVoi0:0, pcDat0:0},  /dal datore non entra niente/],
  ['0 e datore vuoto',           {...BASE, quanti:'1', pcVoi0:0, pcDat0:''}, /dal datore non entra niente/],
  ['versa, ma datore a zero',    {...BASE, quanti:'1', pcVoi0:3, pcDat0:0},  /dal datore non entra niente/],
  ['versa, datore vuoto',        {...BASE, quanti:'1', pcVoi0:3, pcDat0:''}, /dal datore non entra niente/],
  ['datore sì, propria vuota',   {...BASE, quanti:'1', pcVoi0:'', pcDat0:2}, /va scritto .*0/],
  ['tutte e due vuote',          {...BASE, quanti:'1', pcVoi0:'', pcDat0:''},/non affluisce alcun contributo/],
  ['fondo sottoscritto da sé',   {...BASE, quanti:'1', pcVoi0:3, pcDat0:2, tipoFondo0:'individuale'},
                                                                            /non viene conteggiata/],
  ['tutto a posto: nessun avviso', {...BASE, quanti:'1', pcVoi0:1.2, pcDat0:2}, null]
]){
  const {scritte, elementi} = esegui(DATI);
  const frase = (scritte.avvisoDatore || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (atteso === null)
    c(`${nome}`, elementi.avvisoDatore.hidden === true, frase.slice(0, 60));
  else
    c(`${nome}`, elementi.avvisoDatore.hidden === false && atteso.test(frase), frase.slice(0, 78));
}

// --- la quota minima del contratto, nelle frasi -----------------------------
// LA FRASE CHE DICEVA IL FALSO, e che questi controlli tengono chiusa: chi versa il 3% avendo un
// minimo contrattuale dell'1,2% leggeva «sotto il 3% versato oggi il datore non versa». Il
// gradino stava su quello che si versa perché il minimo non lo sapevamo. Ora è una casella, e la
// frase deve nominare la soglia — ma solo quando la soglia è stata scritta: a chi lascia vuoto
// dev'essere identica a prima, o si sarebbe cambiato il testo di quasi tutti per servire pochi.
console.log('\n— la quota minima del contratto, nelle frasi —');
for (const [nome, DATI, atteso] of [
  ['casella vuota: la frase resta quella di prima',
   {...BASE, quanti:'1', pcVoi0:3, pc0:2}, /sotto il 3% versato oggi il datore non versa/],
  // IL CASO CHE DÀ IL NOME A TUTTO IL BLOCCO: cursore FRA il minimo e quello che si versa. Prima
  // qui usciva l'allarme in rosso, e la quota del datore spariva dai numeri; ora né l'uno né
  // l'altra, perché all'1,2% il datore versa. È l'unico punto in cui il difetto si vedeva.
  ['fra il minimo e quello versato: nessun allarme, la quota c\'è',
   {...BASE, quanti:'1', pcVoi0:3, pcMin0:1.2, pc0:2}, /fa scattare 760 € l.anno dal datore/],
  ['e nei numeri il datore versa davvero, non solo nella frase',
   {...BASE, quanti:'1', pcVoi0:3, pcMin0:1.2, pc0:2}, /più .*del datore/],
  ['sotto il minimo, invece, la frase nomina il contratto',
   {...BASE, quanti:'1', pcVoi0:3, pcMin0:1.2, pc0:1}, /sotto l.1,2% chiesto dal contratto/],
  ['chi non versa niente si sente dire la cifra, non «la quota minima»',
   {...BASE, quanti:'1', pcVoi0:0, pcMin0:1.2}, /basta versare l.1,2% chiesto dal contratto/],
  ['e senza il minimo scritto la nomina soltanto',
   {...BASE, quanti:'1', pcVoi0:0}, /basta versare la quota minima prevista dal contratto/],
  // lo ZERO scritto è la terza informazione: non «non l'ho compilato» e non una percentuale
  ['minimo zero scritto: non si chiede di versare lo 0%',
   {...BASE, quanti:'1', pcVoi0:0, pcMin0:0}, /basta un versamento di qualunque entità/]
]){
  const {scritte} = esegui(DATI);
  const dove = /del datore/.test(String(atteso)) ? 'cVers0Ora' : 'cVers0Picco';
  const frase = (scritte[dove] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  c(nome, atteso.test(frase), frase.slice(0, 95));
}
// --- e QUANDO la domanda sul minimo compare -------------------------------
// Non è nel modulo: era una casella la cui etichetta conteneva la propria condizione («se si
// versa di più»), e stava fra i due numeri a cui serve. Ora è una reazione, e compare
// esattamente dove la pagina afferma dove sta il gradino — cioè col cursore sotto quello che si
// versa. Se comparisse sempre sarebbe la terza casella di prima con un vestito nuovo; se non
// restasse visibile dopo la risposta, un numero scritto diventerebbe non più correggibile.
console.log('\n— la domanda sul minimo compare dove serve —');
for (const [nome, DATI, atteso] of [
  ['col cursore fermo su quello che si versa, no', {...BASE, quanti:'1', pcVoi0:3}, false],
  ['portandolo sotto, sì',                         {...BASE, quanti:'1', pcVoi0:3, pc0:2}, true],
  ['e resta visibile dopo aver risposto',          {...BASE, quanti:'1', pcVoi0:3, pcMin0:1.2}, true],
  ['a chi non versa niente no: lì è vera comunque',{...BASE, quanti:'1', pcVoi0:0, pc0:0}, false],
  ['e senza quota del datore nemmeno, perché non c\'è gradino',
   {...BASE, quanti:'1', pcVoi0:3, pc0:2, pcDat0:''}, false],
  ['né su un fondo sottoscritto per conto proprio',
   {...BASE, quanti:'1', pcVoi0:3, pc0:2, tipoFondo0:'individuale'}, false]
]){
  const {elementi} = esegui(DATI);
  c(nome, elementi.chiediMin0.hidden === !atteso,
    `compare: ${!elementi.chiediMin0.hidden}, atteso: ${atteso}`);
}

// e il numero che la frase promette dev'essere quello che il conto usa davvero
{
  const {scritte} = esegui({...BASE, quanti:'1', pcVoi0:3, pcMin0:1.2, pc0:1.19});
  const frase = (scritte.cVers0Ora || '').replace(/<[^>]+>/g, ' ');
  c('un millesimo sotto il minimo la quota sparisce davvero, non solo a parole',
    /niente dal datore/.test(frase), frase.replace(/\s+/g, ' ').slice(0, 80));
}

// --- un ottimo non si indica su un piano che si esaurisce -------------------
// IL DIFETTO CHE QUESTI CONTROLLI TENGONO CHIUSO, misurato il 02/08/2026: su un piano che si
// esauriva nel 2028 la pagina scriveva «il punto più alto è il 50%, vale 32.082 € in più», col
// pulsante che ci portava — e seguendolo il patrimonio si esauriva nel 2027, un anno PRIMA. Il
// verdetto in cima diceva «non sostenibile» e il cursore, venti righe sotto, consigliava di
// accelerare. La causa: sotto zero il patrimonio smette di rendere, quindi massimizzare il
// finale su una traiettoria già negativa premia i versamenti più alti.
// I tre rami hanno tre frasi diverse, e il terzo — il piano che REGGE grazie al versamento — è
// il più prezioso: trasforma un «non sostenibile» in una cosa da fare. Costa cercarlo (serve un
// fondo che renda molto più del patrimonio), ma esiste, e senza questo controllo la frase più
// utile della sezione può sparire senza che nessuno se ne accorga.
console.log('\n— nessun ottimo su un piano che si esaurisce —');
for (const [nome, DATI, atteso] of [
  ['il piano regge: si dicono gli euro', {...BASE}, /vale .* in più rispetto al versamento di oggi/],
  ['non regge con nessun versamento: non si indica niente',
   {...BASE, quanti:'1', spesa:4200, cl3:60000}, /nessun livello di versamento/],
  // IL CASO SI SPOSTA QUANDO IL MODELLO MIGLIORA. Questo scenario stava sul filo, e con le
  // detrazioni dell'art. 13 il piano ha cominciato a reggere da solo: il ramo non era rotto, era
  // il fixture a non essere più al limite. Ritarato cercando di nuovo il bordo.
  ['regge alzando il versamento: è la frase che vale',
   {...BASE, quanti:'1', spesa:2800, cl3:150000, rendFondo:7, rend:0, etaFine:75, fondo0:50000},
   /e da lì .*il piano regge/]
]){
  const {scritte, elementi} = esegui(DATI);
  const grezza = scritte.cVers0Piu || '';
  const frase = grezza.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  c(`${nome}`, atteso.test(frase), frase.slice(0, 95));
  // e il pulsante non deve MAI portare a un punto su un piano che non arriva in fondo
  const nonRegge = /nessun livello di versamento/.test(grezza);
  c(`${nome}: il pulsante tace quando non c'è un punto`,
    !nonRegge || elementi.cVers0Vai.hidden, elementi.cVers0Vai.textContent);
}

// --- il punto più alto dell'erogazione, e la premessa che lo annuncia -------
// LA PREMESSA E IL RIQUADRO SI SONO GIÀ CONTRADDETTI UNA VOLTA. Fino al 02/08/2026 la premessa
// diceva «per la seconda non è possibile [individuare un ottimo]» mentre il passo 1 scriveva
// «il punto più alto è cominciare nel …». Ed è una distinzione di sostanza, non di parole: sul
// passo 1 i due rami finiscono tutti e due in patrimonio, quindi il metro non favorisce nessuno;
// sui passi 2 e 3 si confronta un lascito con un assegno, ed è lì che il metro non decide.
// Il controllo tiene insieme le tre cose: la frase, la promessa e il pulsante.
console.log('\n— il punto più alto dell\'erogazione anticipata —');
for (const [nome, DATI] of Object.entries({
  'finestra aperta':          {...BASE, quanti:'1', ultimo0:2032, rita0:0},
  'già sul punto più alto':   {...BASE, quanti:'1', ultimo0:2032, rita0:2033},
  'senza finestra':           {...BASE, quanti:'1'},
  'fondo che rende più':      {...BASE, quanti:'1', ultimo0:2032, rita0:0, rendFondo:7, rend:2}
})){
  const {scritte, elementi} = esegui(DATI);
  const frase = (scritte.cQuando0Picco || '').replace(/<[^>]+>/g, '');
  const promessa = (scritte.premessaScelte || '').replace(/<[^>]+>/g, '');
  const b = elementi.cQuando0Vai;
  // se un punto più alto viene indicato, la premessa non deve dire che non ce n'è uno
  const indica = /punto più alto è cominciare/.test(frase);
  c(`${nome}: la premessa non smentisce quello che il passo 1 scrive`,
    !indica || !/per la seconda non è possibile/.test(promessa), frase.slice(0, 80));
  // e quando lo indica, dice anche quanto vale: un anno senza cifra non fa decidere nessuno
  c(`${nome}: il punto indicato porta con sé quanto vale`,
    !indica || /€ in più/.test(frase), frase.slice(0, 90));
  if (!b.hidden){
    const dove = +b.dataset.anno;
    c(`${nome}: il pulsante porta a un anno che il cursore può raggiungere`,
      dove >= +elementi.cQuando0.min && dove <= +elementi.cQuando0.max,
      `${dove} su un cursore ${elementi.cQuando0.min}–${elementi.cQuando0.max}`);
    c(`${nome}: il pulsante dice lo stesso anno della frase`,
      frase.includes(String(dove)), b.textContent);
  } else {
    c(`${nome}: senza pulsante non c'è un punto da raggiungere`,
      !indica || /già/.test(nome), frase.slice(0, 60));
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
// COME SI RICONOSCE UNA PROMESSA, e perché non basta nominare l'azienda. Fino al 02/08/2026
// questo controllo cercava anche la stringa «dall'azienda», e ha dato rosso su un codice giusto
// appena quella è diventata il NOME DI UNA VOCE DEL MENU: la frase che dice «l'adesione va
// segnata dall'azienda» nomina un'opzione, non promette un euro. Cercava un indizio invece del
// fatto. Restano i quattro marcatori che una promessa la fanno davvero — «scattino», «fa
// scattare», «andrebbe perso», «che oggi non arrivano» — e tutti portano una cifra con sé.
console.log('\n— il tipo di fondo, in quello che la pagina scrive —');
for (const [nome, DATI] of Object.entries({
  'fondo di categoria':      BASE,
  'aperto, accordo aziendale': {...BASE, tipoFondo0:'aziendale', tipoFondo1:'aziendale'},
  'fondo scelto da sé':      {...BASE, tipoFondo0:'individuale', tipoFondo1:'individuale'}
})){
  const {scritte} = esegui(DATI);
  const tutto = Object.values(scritte).join(' ').replace(/<[^>]+>/g, ' ');
  const promette = /scattin\w+|andrebbe perso|fa scattare|che oggi non arrivano/.test(tutto);
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
  // il piano che regge sulla media ma non sulla sequenza. LA SOGLIA SI SPOSTA QUANDO IL MODELLO
  // MIGLIORA: 4.300 non bastava più a rompere il piano dopo che il netto da lavoro ha smesso di
  // perdere le mensilità aggiuntive. Quarta volta in due giorni, e sempre lo stesso errore di
  // lettura: il rosso non diceva «il ramo è rotto», diceva «lo scenario non è più al confine».
  const rotto = conSpesa(4400);
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
  // CON RENDIMENTI REALI NON POSITIVI LA PROVA NON HA NIENTE DA TOGLIERE, e fino al 02/08/2026
  // la riga taceva. Ora dice perché: col listino delle classi in quel ramo ci finiscono chi ha
  // molta liquidità e chi sta in un comparto garantito — le persone più prudenti, cioè il cuore
  // di chi legge — e vedersi sparire una riga senza spiegazione è peggio che leggere che non
  // serve. Quello che NON deve fare resta quello di prima: confrontare un piano con sé stesso.
  const {scritte: piatto} = esegui({...BASE, rend: 2, rendFondo: 1, infl: 2});
  const testoPiatto = (piatto.tenuta || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  c('con rendimenti reali non positivi la riga dice perché non si applica',
    /Non si applica/.test(testoPiatto)
    && !/regge lo stesso|anziché|si esaurisce/.test(testoPiatto), testoPiatto.slice(0, 90));
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
    cl3: 'il patrimonio investito',
    nascita0:   "l'anno di nascita",
    annoPens0:  'la decorrenza del trattamento',
    ral0:       'la retribuzione annua lorda',
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
  const PIENO = {quanti:'1', spesa:2500, cl3:400000, nascita0:1958, annoPens0:2030,
                 ral0:42000, pens0:1800};
  c('col modulo completo il verdetto esce', !senzaVerdetto(esegui(PIENO)));
  for (const id of Object.keys(CASELLE))
    c(`senza ${CASELLE[id]} il verdetto resta sospeso`,
      senzaVerdetto(esegui({...PIENO, [id]: ''})));

  // VUOTO E ZERO RESTANO DUE INFORMAZIONI DIVERSE: chi non ha patrimonio, o non prende ancora
  // un trattamento, scrive 0 e il conto lo prende alla lettera. Senza questa distinzione la
  // guardia avrebbe chiuso fuori proprio chi ha più bisogno della risposta.
  c('uno zero scritto è una risposta, e il verdetto esce',
    !senzaVerdetto(esegui({...PIENO, cl3:0, ral0:0, pens0:0})));

  // e non si chiede quello che il piano non usa: chi ha già smesso di lavorare non ha una
  // retribuzione da scrivere
  c('a chi ha già smesso di lavorare la retribuzione non viene chiesta',
    !senzaVerdetto(esegui({...PIENO, ral0:'', ultimo0:2024})));
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
  // copre il disavanzo, quindi il patrimonio cresce mentre il flusso è negativo.
  // LA SPESA È SALITA DA 2.800 A 3.200 il 02/08/2026: contando la pensione su tredici rate le
  // entrate sono cresciute e il disavanzo era sparito, cioè lo scenario non provava più il ramo
  // che gli sta a cuore. Terza volta in due giorni che un fixture al limite smette di esserlo
  // perché il modello migliora: quando un controllo cade, prima si guarda se è ancora al bordo.
  const copre = esegui({quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1955, nascita1:1958,
    annoPens0:2015, annoPens1:2020, pens0:2100, pens1:1250, cl3:380000, spesa:3200,
    etaFine:95, fondo0:'', fondo1:'', ral0:'', ral1:''});
  const dati = pulito(copre.scritte.calcolato), verdetto = pulito(copre.scritte.titolo);
  c('col disavanzo coperto dal rendimento la frase non annuncia una riduzione',
    /eccede le entrate/.test(dati) && !/patrimonio è in riduzione/.test(dati), dati.trim());
  c('e non contraddice il verdetto, che dice l\'opposto',
    /non si riduce/.test(verdetto) && !/in riduzione/.test(dati), verdetto.trim().slice(0, 60));
  // e quando cala davvero lo deve dire: la prudenza non è tacere
  const cala = esegui({quanti:'1', nascita0:1955, annoPens0:2015, pens0:900,
    cl3:60000, spesa:2600, etaFine:95, fondo0:'', ral0:''});
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
  const UNO = {quanti:'1', spesa:2500, cl3:400000, nascita0:1955, pens0:1800,
               fondo0:90000, iscr0:2005};
  const testo = r => ((r.scritte.titolo || '') + ' ' + (r.scritte.sottotitolo || ''))
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const spente = (r, ids) => ids.every(k => r.elementi[k] && r.elementi[k].disabled === true);
  const attive = (r, ids) => ids.every(k => r.elementi[k] && r.elementi[k].disabled === false);
  const ATTIVITA = ['ral0','cresc0','ultimo0'];
  const FONDO    = ['tipoFondo0','fondo0','iscr0','pcVoi0','pcDat0','tfrDove0'];

  const gia = esegui({...UNO, annoPens0:2015});
  c('il verdetto esce, invece di chiedere una casella già compilata',
    !/Dati incompleti/.test(gia.scritte.titolo || ''), testo(gia).slice(0, 80));
  c('l\'avviso compare, e dice che il fondo non è rappresentato',
    gia.elementi.avvisoPensione.hidden === false
    && /non è rappresentato/.test(gia.scritte.avvisoPensione || ''));
  c('le caselle di attività e del fondo sono disattivate, non ignorate',
    spente(gia, [...ATTIVITA, ...FONDO]));
  // I DUE RIQUADRI DEL FONDO SPARISCONO, LA SEZIONE NO — ed è cambiato quando è arrivata la
  // scelta sull'abitazione. Contribuzione ed erogazione sono decisioni sul futuro lavorativo,
  // già compiute da chi ha la decorrenza alle spalle; cambiare casa resta aperta, ed è proprio
  // a chi è in decumulo che serve. Prima qui si controllava che sparisse tutto: quel controllo
  // codificava un'ipotesi che non vale più, e portarselo dietro avrebbe impedito la feature.
  c('i due riquadri del fondo spariscono: sono decisioni già compiute',
    gia.elementi.decContrib.hidden === true && gia.elementi.decErog.hidden === true);
  c('ma la sezione resta, perché la scelta sull\'abitazione è ancora aperta',
    gia.elementi.decisioni.hidden === false && gia.elementi.decCasa.hidden === false);
  c('e la premessa conta le scelte che ci sono davvero, non tre',
    /^Una scelta che incide/.test(gia.scritte.premessaScelte || ''),
    (gia.scritte.premessaScelte || '').slice(0, 60));
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
  const futuro = esegui({...UNO, annoPens0:2035, ral0:42000});
  c('correggendo l\'anno le caselle tornano in gioco',
    attive(futuro, [...ATTIVITA, ...FONDO]) && futuro.elementi.avvisoPensione.hidden === true
    && futuro.elementi.decisioni.hidden === false);

  // LA COPPIA MISTA: le scelte restano per chi lavora ancora, e l'avviso nomina solo l'altro.
  const DUE = {...UNO, quanti:'2', nome0:'Anna', nome1:'Bruno', nascita1:1968, pens1:1500,
               annoPens1:2035, ral1:36000, fondo1:70000, iscr1:2008};
  const mista = esegui({...DUE, annoPens0:2015});
  const av = (mista.scritte.avvisoPensione || '').replace(/<[^>]+>/g, '');
  c('nella coppia mista l\'avviso nomina solo chi ci è dentro',
    /Anna/.test(av) && !/Bruno/.test(av), av.slice(0, 60));
  c('e le scelte restano, perché uno lavora ancora',
    mista.elementi.decisioni.hidden === false
    && mista.elementi.fondo1.disabled === false && mista.elementi.fondo0.disabled === true);
}

// --- L'ABITAZIONE: tre difetti trovati LEGGENDO L'OUTPUT, non il codice ---------------
// Nessuno dei controlli generici li vedeva: erano frasi vere in un ramo e false in un altro.
{
  const CASA = {casaAnno:2045, casaValore:300000};
  const piccola = esegui({...BASE, ...CASA, casaCosa:'piccola', casaNuova:180000});
  const affitto = esegui({...BASE, ...CASA, casaCosa:'affitto', casaCanone:900});
  const figli   = esegui({...BASE, casaAnno:2045, casaValore:'', casaCosa:'affitto', casaCanone:900});
  const nudo = r => (k) => (r.scritte[k] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // 1. LA PREMESSA PROMETTEVA UNA SOGLIA CHE IL RIQUADRO NEGA. Il pareggio in rendimento esiste
  //    solo per l'affitto: per la casa più piccola non c'è nulla di ricorrente da bilanciare, e
  //    il riquadro lo dichiara. La premessa diceva il contrario di quello che introduce.
  c('la premessa promette la soglia solo dove la soglia c\'è',
    /sotto quale rendimento/.test(nudo(affitto)('premessaScelte'))
    && !/sotto quale rendimento/.test(nudo(piccola)('premessaScelte')),
    nudo(piccola)('premessaScelte').slice(-70));
  c('e per la casa più piccola dichiara che non indica se convenga',
    /senza indicare se convenga/.test(nudo(piccola)('premessaScelte'))
    && /non c'è una soglia da dichiarare/.test(nudo(piccola)('casaScambio')));

  // 2. e 3. «VENDITA» DOVE NON C'È STATA NESSUNA VENDITA. Chi lascia l'abitazione a qualcuno
  //    sceglie l'affitto senza scrivere il valore: la riga-evento diceva «vendita
  //    dell'abitazione: nessun ricavato», e il pareggio confrontava il canone con un ricavato
  //    che non esiste. Due fatti raccontati, nessuno dei due avvenuto.
  const evento = r => (nudo(r)('tabella').match(/2045 — [^—]{0,120}/) || [''])[0];
  c('senza valore la tabella non annuncia una vendita',
    /abitazione lasciata/.test(evento(figli)) && !/vendita/.test(evento(figli)),
    evento(figli).slice(0, 64));
  c('mentre col valore scritto la vendita si dice',
    /vendita dell'abitazione/.test(evento(affitto)));
  c('e il pareggio non confronta il canone con un ricavato che non c\'è',
    /nulla che la compensi/.test(nudo(figli)('casaScambio'))
    && !/il ricavato possa rendere/.test(nudo(figli)('casaScambio')));

  // IL CONFRONTO DICHIARA SU COSA È FATTO, ed è la riparazione del difetto più grave della
  // feature: misurato sul solo patrimonio investito, il confronto ignorava che chi resta
  // possiede ancora la casa, e dava il SEGNO OPPOSTO (+127.984 € invece di −192.016 €).
  c('il confronto dichiara di contare anche l\'abitazione',
    /contando anche l'abitazione/.test(nudo(affitto)('casaEsito'))
    && /contando anche l'abitazione/.test(nudo(piccola)('casaEsito')));
  c('e senza il valore dichiara che non è confrontabile per intero',
    /solo patrimonio investito/.test(nudo(figli)('casaEsito'))
    && !/contando anche l'abitazione/.test(nudo(figli)('casaEsito')),
    nudo(figli)('casaEsito').slice(-70));
  // IL VERSO, che è la cosa che quel difetto rovesciava: su questo scenario vendere e andare in
  // affitto PEGGIORA la ricchezza, e la pagina deve dirlo col segno giusto.
  c('e su questo scenario il segno è negativo, come dev\'essere',
    /−[\d.]+ € alla fine del piano/.test(nudo(affitto)('casaEsito')),
    (nudo(affitto)('casaEsito').match(/[+−][\d.]+ € alla fine/) || [''])[0]);

  // I COSTI RESTANO IN CHIARO: sono l'unica stima nostra della sezione, e chi ha spuntato
  // condizioni diverse deve poterli vedere per correggere il valore che scrive.
  c('i costi della compravendita si mostrano, e sono dichiarati stima',
    /costi della compravendita \(stima\)/.test(nudo(affitto)('casaEsito')));
  c('chi compra ne paga di più di chi vende soltanto',
    /22.068/.test(nudo(piccola)('casaEsito')) && /10.980/.test(nudo(affitto)('casaEsito')));
  // la fase si spezza dove cambia la spesa, o il flusso medio mescolerebbe due regimi diversi
  c('la locazione taglia una fase e la nomina',
    /abitazione in locazione/.test(nudo(affitto)('fasi')));
  c('e chi resta proprietario non la vede nominata',
    !/locazione/.test(nudo(piccola)('fasi')));
}

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n✓ il calcolatore parla come deve');
if (ko) process.exitCode = 1;
