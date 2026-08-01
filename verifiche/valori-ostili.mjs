// ============================================================================
//  QUELLO CHE SUCCEDE QUANDO NEI CAMPI FINISCE DI TUTTO.
//
//  Gli altri controlli provano piani sensati. Questo prova il contrario: un
//  modulo pubblico, il primo giorno, prende addosso numeri incollati male,
//  campi lasciati a metà, testo dentro le caselle numeriche, e nomi che nomi
//  non sono. Il calcolatore non deve mai:
//
//   · piantarsi o esaurire la memoria (successo il 31/07/2026: bastava
//     scrivere 1e308 nell'orizzonte del piano e il ciclo degli anni girava
//     finché la scheda non moriva);
//   · scrivere in pagina «NaN», «undefined» o «Infinity»;
//   · restare muto: o dà un verdetto, o dice cosa manca;
//   · lasciar finire dentro innerHTML quello che uno ha scritto nel nome.
//
//  Non si cercano risultati giusti — su questi dati non esistono. Si cerca che
//  la pagina resti in piedi e continui a dire cose sensate.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/g)
  .map(t => t.replace(/<\/?script>/g, '')).find(t => /function simula\(/.test(t));

const CAMPI = ['quanti','nome0','nome1','nascita0','nascita1','stip0','stip1','ral0','ral1',
  'pens0','pens1','annoPens0','annoPens1','fondo0','fondo1','iscr0','iscr1','pcVoi0','pcVoi1',
  'pcDat0','pcDat1','cresc0','cresc1','tfrDove0','tfrDove1','tipoFondo0','tipoFondo1',
  'ultimo0','ultimo1',
  'patrimonio','spesa','spesaPens',
  'rend','rendFondo','infl','etaFine','quotaCap0','quotaCap1','forma0','forma1','rita0','rita1',
  'pc0','pc1'];
// i valori che fanno male: quelli fuori scala, quelli che non sono numeri, e il vuoto
const OSTILI = ['', '0', '-1', '-999999', '999999999', '1e308', 'abc', ' ', '.', '-', '1,5',
  '0.0000001', '2100', '1900', 'NaN', 'Infinity', '99999999999999999999', '50%'];
// per ciascuno, l'impronta che NON deve comparire dentro la pagina. Cercare il nome intero
// darebbe falsi allarmi: la prosa del sito contiene già «all'altro», e un nome innocuo come
// «l'altro» finirebbe per accusare una frase scritta da noi.
// Cercare un'impronta nel testo non funziona: «<b>» lo scrive già il sito, e «onerror=» senza
// il «<» davanti è testo inerte. Il criterio giusto è un altro: **un nome non deve aggiungere
// nemmeno un tag** alla pagina. Si contano i tag con un nome innocuo e si confronta.
const NOMI_CATTIVI = ['<img src=x onerror="alert(1)">', '<script>alert(1)</script>',
  '"><b>x', 'A & B', "l'altro", '<<>>&&""', '<svg onload=alert(1)>'];

const scelta = a => a[Math.floor(Math.random() * a.length)];

// esegue il calcolatore su un modulo qualunque e riferisce cosa ne è uscito
function prova(DATI){
  const scritte = {}, avvisi = [], el = {};
  const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
    min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){},
    closest:() => null, hidden:false,
    get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
  globalThis.IntersectionObserver = class { constructor(){} observe(){} };
// `addEventListener` sulla finestra: la pagina lo usa per aprire il dettaglio prima della
// stampa. Nei DOM finti non esiste, ed è la quinta volta che un'armatura incompleta fa
// cadere codice buono: si completa l'armatura, non si indebolisce la pagina.
globalThis.addEventListener = globalThis.addEventListener || (() => {});
// `window` esiste sempre in un browser, e la pagina lo nomina per l'evento della misurazione.
// Nei DOM finti non c'era: sesta volta che un'armatura incompleta fa cadere codice buono.
// Puntato a `globalThis`, così `window.gtag` resta indefinito e l'evento non parte mai qui.
globalThis.window = globalThis;
  globalThis.document = {body:{classList:{toggle(){}}}, querySelectorAll: () => [],
    getElementById: id => el[id] ??= new Proxy(Object.assign(finto(), {value: DATI[id] ?? ''}),
      {set(o, k, v){
        if ((k === 'textContent' || k === 'innerHTML') && String(v).trim())
          scritte[id] = {via: k, testo: String(v)};
        o[k] = v; return true;
      }})};
  const w = console.warn, e = console.error;
  console.warn = (...a) => avvisi.push(a.join(' '));
  console.error = (...a) => avvisi.push(a.join(' '));
  let esploso = null;
  try { new Function(src + '\nreturn {calc};')().calc(); }
  catch (err){ esploso = err.message; }
  finally { console.warn = w; console.error = e; }
  return {scritte, avvisi, esploso};
}

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

// --- 1. i casi che hanno fatto male davvero, tenuti per nome -----------------
console.log('\n— i casi che una volta rompevano —');
const REGRESSIONI = {
  'orizzonte incollato male (1e308)':      {etaFine:'1e308'},
  'orizzonte enorme (999.999.999)':        {etaFine:'999999999'},
  'orizzonte già superato (età 20 a 50 anni)': {nascita0:'1975', etaFine:'20'},
  'anno di nascita di un secolo fa':       {nascita0:'1901'},
  'inflazione al −99%':                    {infl:'-99'},
  'RAL negativa':                          {ral0:'-50000'},
  'tutto vuoto':                           {}
};
const SANO = {quanti:'1', nascita0:'1975', annoPens0:'2042', spesa:'2000', ral0:'35000',
  stip0:'2000', pens0:'1500', fondo0:'50000', iscr0:'2010', pcVoi0:'1.2', pcDat0:'2',
  patrimonio:'100000', rend:'4', rendFondo:'3', infl:'2', etaFine:'95'};
for (const [nome, over] of Object.entries(REGRESSIONI)){
  const t0 = Date.now();
  const {scritte, avvisi, esploso} = prova({...SANO, ...over});
  const ms = Date.now() - t0;
  const testo = Object.values(scritte).map(x => x.testo).join(' ').replace(/<[^>]+>/g, ' ');
  const sporco = (testo.match(/\b(undefined|NaN|Infinity|\[object)\b/) || [])[0];
  c(`${nome}: risponde, in fretta e senza rompersi`,
    !esploso && !sporco && !!scritte.titolo && avvisi.length === 0 && ms < 3000,
    esploso ? 'ESPLOSO: ' + esploso
      : sporco ? 'in pagina c\'è «' + sporco + '»'
      : !scritte.titolo ? 'non ha detto niente'
      : `${ms} ms · ${(scritte.titolo.testo || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim().slice(0, 46)}`);
}

// --- 2. il nome non è un pezzo di pagina ------------------------------------
console.log('\n— quello che si scrive nel nome resta testo —');
const tagDi = scritte => Object.values(scritte)
  .filter(x => x.via === 'innerHTML')
  .reduce((n, x) => n + (x.testo.match(/</g) || []).length, 0);
const innocuo = tagDi(prova({...SANO, nome0: 'Anna'}).scritte);
for (const cattivo of NOMI_CATTIVI){
  const {scritte, esploso} = prova({...SANO, nome0: cattivo});
  const quanti = tagDi(scritte);
  c(`«${cattivo.slice(0, 26)}» non aggiunge un solo tag alla pagina`,
    quanti === innocuo && !esploso && !!scritte.titolo,
    esploso ? 'ESPLOSO' : quanti === innocuo ? '' : `${quanti} «<» invece di ${innocuo}`);
}

// --- 3. il caos, tanto per vedere ------------------------------------------
console.log('\n— duemila moduli riempiti a caso —');
let esplosi = 0, sporchi = 0, muti = 0, lento = 0;
const primo = {};
for (let t = 0; t < 2000; t++){
  const DATI = {};
  for (const campo of CAMPI)
    DATI[campo] = campo.startsWith('nome') ? scelta(OSTILI.concat(NOMI_CATTIVI)) : scelta(OSTILI);
  const t0 = Date.now();
  const {scritte, avvisi, esploso} = prova(DATI);
  lento = Math.max(lento, Date.now() - t0);
  // i nomi sono roba di chi compila: se ci scrive «NaN», «NaN» comparirà. Il controllo guarda
  // il resto, altrimenti verificherebbe il proprio generatore invece della pagina.
  const nomi = [DATI.nome0, DATI.nome1].filter(Boolean);
  let testo = Object.values(scritte).map(x => x.testo).join(' ').replace(/<[^>]+>/g, ' ');
  for (const n of nomi) testo = testo.split(n).join('·');
  const sporco = (testo.match(/\b(undefined|NaN|Infinity|\[object)\b/) || [])[0];
  if (esploso){ esplosi++; primo.esploso ??= [esploso, DATI]; }
  else if (sporco){ sporchi++; primo.sporco ??= [sporco, DATI]; }
  else if (!scritte.titolo){ muti++; primo.muto ??= ['nessun verdetto', DATI]; }
  if (avvisi.length){ primo.avviso ??= [avvisi[0], DATI]; }
}
c('nessuno si è rotto', esplosi === 0, primo.esploso ? primo.esploso[0] : '');
c('nessun «NaN», «undefined» o «Infinity» in pagina', sporchi === 0,
  primo.sporco ? primo.sporco[0] + ' con ' + JSON.stringify(primo.sporco[1]).slice(0, 150) : '');
c('nessuno è rimasto muto: o un verdetto o cosa manca', muti === 0);
c('nessun elemento mancante segnalato da EL()', !primo.avviso, primo.avviso ? primo.avviso[0] : '');
c('nessuno ha impiegato più di tre secondi', lento < 3000, `il più lento ${lento} ms`);

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n✓ regge anche quello che non dovrebbe capitare');
if (ko) process.exitCode = 1;
