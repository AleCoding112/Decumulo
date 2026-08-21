// ============================================================================
//  L'ARMATURA, IN UN POSTO SOLO.
//
//  Il DOM finto con cui i controlli eseguono il motore era copiato in nove
//  file, e ogni metodo mancante è costato una caccia in più punti: «settima
//  volta che un'armatura incompleta fa cadere codice buono» sta scritto quasi
//  con le stesse parole in tre file diversi. Qui c'è UNA armatura — la più
//  completa fra le nove — e chi la importa dichiara soltanto due cose: da dove
//  vengono i valori delle caselle, e cosa fare di quello che la pagina scrive.
//
//  LA CASELLA NON DICHIARATA NON VALE PIÙ UN RIPIEGO. Nei DOM finti un campo
//  assente valeva '0' (o '', secondo il file): la casella nuova leggeva zero,
//  e cinque casi diversi finivano sullo stesso numero senza che nessun
//  controllo fallisse. È successo otto volte, e la difesa era una regola di
//  disciplina scritta nel README («si scrive campo:'' esplicitamente») —
//  cioè affidata alla memoria. Adesso la pretende l'armatura: leggere il
//  `value` di una casella che il caso di prova non dichiara FA CADERE il
//  controllo, per nome. Per elencarle tutte in un giro solo invece di
//  scoprirle una alla volta:  ARMATURA_ELENCA=1 node <file>
//
//  E VALE ANCHE AL CONTRARIO: un caso di prova che dichiara una casella che la
//  pagina non ha più — un campo rimosso, un id battuto male — sta provando
//  qualcosa che non esiste, in silenzio. `controllaChiavi` confronta le chiavi
//  del caso con le caselle vere della pagina costruita, comprese quelle che il
//  motore fabbrica a runtime (cl0…, pcMin…, anniFraz…). Al primo giro ha
//  trovato due morti veri: `tipoFondo` nei casi di come-parla (il menù non
//  esiste dal 03/08/2026) e `patrimonio` nei moduli ostili — che per questo
//  giravano quasi tutti senza patrimonio, cioè senza mai arrivare al verdetto.
// ============================================================================
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));

let _pagina = null;
export const pagina = () => _pagina ??= fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8');

// LA PAGINA HA PIÙ DI UNO <script>. Da quando il piè di pagina porta con sé il banner del
// consenso, il primo è quello: prendere «il primo» faceva caricare quaranta righe di banner al
// posto del motore, e l'armatura falliva su un codice giusto.
// Si sceglie dicendo COSA si vuole — il blocco che contiene il motore — invece di fidarsi
// dell'ordine in cui il build monta i pezzi.
let _sorgente = null;
export const sorgente = () => _sorgente ??= [...pagina()
  .matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));

// I VALORI DI PARTENZA STANNO NELL'HTML, NON NEGLI SCENARI. Rendimenti, inflazione e orizzonte
// hanno un `value` scritto nel modulo: uno scenario che non li nomina deve vedere quelli, non
// lo zero. Senza, «modulo vuoto» non era il modulo che si apre davvero, e un fixture che
// dimenticava l'orizzonte finiva nel ramo «orizzonte già superato» invece che dove doveva.
// (Era il DEFAULT di come-parla; sta qui perché è la pagina a dettarlo, non uno dei controlli.)
let _valori = null;
export function valoriPagina(){
  if (_valori) return _valori;
  const P = pagina(), v = {};
  for (const m of P.matchAll(/<input\b[^>]*\bid="(\w+)"[^>]*>/g))
    v[m[1]] = (m[0].match(/\bvalue="([^"]*)"/) || [, ''])[1];
  for (const m of P.matchAll(/<select\b[^>]*\bid="(\w+)"[\s\S]*?<\/select>/g)){
    // senza `selected` vale la prima opzione, come nel browser.
    // UNA TENDINA COSTRUITA A RUNTIME QUI DENTRO NON HA OPZIONI, e prenderne «la prima» faceva
    // morire l'armatura su un markup giusto: finché la pagina non gira vale la stringa vuota,
    // che è esattamente quello che riporta il browser per un select senza opzioni.
    const s = m[0].match(/<option[^>]*\bselected\b[^>]*>/);
    const prima = s ? s[0] : (m[0].match(/<option[^>]*>/) || [''])[0];
    v[m[1]] = (prima.match(/\bvalue="([^"]*)"/) || [, ''])[1];
  }
  return _valori = v;
}

// LO STATO DELLA PAGINA APPENA APERTA: i valori del markup più le caselle che il motore
// fabbrica a runtime, che nascono vuote. Serve a chi esegue lo script intero — il `new
// Function` fa girare anche il caricamento, e in quel giro la pagina legge il modulo com'è
// da nuova. Quante siano le caselle a runtime lo dice la pagina stessa: le classi del
// patrimonio sono le voci di CLASSI (generata, quindi JSON valido), le altre una per persona,
// contando le colonne del modulo. Elencarle a mano qui sarebbe la divergenza di sempre.
export function moduloIniziale(){
  const v = {...valoriPagina()};
  const persone = Object.keys(v).filter(k => /^nascita\d+$/.test(k)).length;
  const classi = JSON.parse((sorgente().match(/const CLASSI = (\[[\s\S]*?\]);/) || [, '[]'])[1]).length;
  for (const m of sorgente().matchAll(/<input\b[^>]*\bid="([a-zA-Z]\w*?)\$\{/g)){
    const n = m[1] === 'cl' ? classi : persone;
    for (let i = 0; i < n; i++) v[m[1] + i] ??= '';
  }
  return v;
}

// LE CASELLE CHE LA PAGINA HA DAVVERO: quelle scritte nel markup, più quelle che il motore
// fabbrica a runtime dentro i template literal (`id="cl${i}"`), riconosciute per prefisso.
// Il prefisso pretende almeno una lettera: `id="${id}"` — l'id passato per parametro — darebbe
// un prefisso vuoto che renderebbe valida qualunque chiave.
let _campi = null;
export function campi(){
  if (_campi) return _campi;
  const esatti = new Set();
  for (const m of pagina().matchAll(/<(?:input|select)\b[^>]*\bid="(\w+)"/g)) esatti.add(m[1]);
  const prefissi = new Set();
  for (const m of sorgente().matchAll(/id="([a-zA-Z]\w*?)\$\{/g)) prefissi.add(m[1]);
  return _campi = {esatti, prefissi: [...prefissi]};
}

// Ogni chiave del caso di prova deve essere una casella vera: esatta, o un prefisso a runtime
// seguito da sole cifre. Un caso che dichiara una casella inesistente prova il nulla.
export function controllaChiavi(dati, dove = 'il caso di prova'){
  const {esatti, prefissi} = campi();
  const ignote = Object.keys(dati).filter(k => !esatti.has(k)
    && !prefissi.some(p => k.startsWith(p) && /^\d+$/.test(k.slice(p.length))));
  if (ignote.length) throw new Error(`${dove} dichiara caselle che la pagina non ha: `
    + `${ignote.join(', ')}. O sono state rimosse dal modulo, o l'id è battuto male: `
    + `in entrambi i casi il valore non arriva da nessuna parte.`);
}

// L'ELEMENTO FINTO, superset di tutti e nove: tutto quello che la pagina tocca deve esserci,
// o lo script non arriva in fondo («si completa l'armatura, non si indebolisce la pagina»).
// `innerHTML` fa seguire `textContent`, come in un browser vero: è la lezione di scarica.mjs —
// il foglio prende il verdetto da `textContent`, e con un textContent sempre vuoto il controllo
// avrebbe dichiarato buono un file col risultato in bianco.
export const finto = () => {
  const o = {value:'', className:'', checked:false, min:'', max:'', disabled:false,
    hidden:false, style:{}, dataset:{}, addEventListener(){},
    setAttribute(){}, getAttribute(){ return null; },
    closest(){ return finto(); }, classList:{toggle(){}, add(){}, remove(){}},
    get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }};
  let html = '', testo = '';
  Object.defineProperty(o, 'innerHTML', {get: () => html,
    set: v => { html = String(v); testo = html.replace(/<[^>]*>/g, ' ')
                                              .replace(/\s+/g, ' ').trim(); }});
  Object.defineProperty(o, 'textContent', {get: () => testo,
    set: v => { testo = String(v); }});
  return o;
};

// `addEventListener` sulla finestra (la pagina apre il dettaglio prima della stampa) e
// `window` (l'evento della misurazione): puntato a `globalThis`, così `window.gtag` resta
// indefinito e l'evento non parte mai qui. Erano la quinta e la sesta caccia.
export function prepara(){
  globalThis.addEventListener = globalThis.addEventListener || (() => {});
  globalThis.window = globalThis;
}

// Il risolutore severo: il valore viene dalla prima fonte che dichiara la chiave, e una chiave
// che nessuna fonte dichiara resta `undefined` — che per `documento` vuol dire «se la pagina
// lo legge, si ferma tutto e lo dice per nome».
export const dichiarate = (...fonti) => id => {
  for (const f of fonti) if (f && id in f) return String(f[id]);
  return undefined;
};

const ELENCA = !!process.env.ARMATURA_ELENCA;
const mancanti = new Set();
if (ELENCA) process.on('exit', () => { if (mancanti.size)
  console.log(`\n[armatura] caselle lette ma non dichiarate (${mancanti.size}): `
    + [...mancanti].sort().join(', ')); });

// IL DOCUMENTO. `valore(id)` dice cosa c'è scritto nella casella; `undefined` è la casella non
// dichiarata, e leggerla fa cadere il controllo. `memoizza` restituisce sempre lo stesso
// elemento per lo stesso id — serve a chi rilegge quello che la pagina ha scritto — mentre il
// caso base ne crea uno nuovo a ogni richiesta, come le armature dei controlli sul motore.
// `suScrittura(id, via, testo)` intercetta innerHTML e textContent non vuoti.
export function documento(valore = () => '', {memoizza = false, suScrittura = null} = {}){
  const elementi = {};
  const crea = id => {
    let e = finto();
    e.__id = id;
    const v = valore(id);
    if (v === undefined){
      // CONTA LA LETTURA, NON LA CREAZIONE: anche gli elementi di uscita — il titolo, il
      // grafico — nascono senza valore dichiarato, ma il loro `value` non lo legge nessuno.
      // La casella vera è quella di cui la pagina viene a chiedere il contenuto.
      Object.defineProperty(e, 'value', {configurable: true,
        get(){
          if (ELENCA){ mancanti.add(id); return ''; }
          throw new Error(`l'armatura non dichiara la casella #${id}. Un campo assente `
            + `non vale più '0' né vuoto: si scrive nel caso di prova cosa c'è nella casella `
            + `(ARMATURA_ELENCA=1 le elenca tutte in un giro solo).`);
        },
        // la pagina può scrivere un value prima di rileggerlo: da lì in poi vale lo scritto
        set(x){ Object.defineProperty(e, 'value',
          {value: String(x), writable: true, configurable: true, enumerable: true}); }});
    } else e.value = String(v);
    if (suScrittura) e = new Proxy(e, {set(t, k, val){
      if ((k === 'textContent' || k === 'innerHTML') && String(val).trim())
        suScrittura(id, k, String(val));
      t[k] = val; return true;
    }});
    return e;
  };
  return {
    body: {classList: {toggle(){}}},
    querySelectorAll: () => [],
    getElementById: id => memoizza ? (elementi[id] ??= crea(id)) : crea(id),
    // per i controlli che vogliono rileggere gli elementi scritti
    elementi
  };
}
