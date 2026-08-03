// ============================================================================
//  COME IL SITO STA DAVVERO SULLO SCHERMO.
//
//  Questo apre Chrome, quindi NON sta nella catena di `verifica.mjs`: si lancia
//  quando si tocca il layout o si aggiunge una casella.
//
//      node verifiche/a-schermo.mjs
//
//  Controlla due cose che nessun'altra verifica può vedere:
//   1. che niente esca di lato, su ogni pagina e a ogni larghezza. Le tabelle
//      larghe non contano se scorrono dentro il loro riquadro: quello è voluto;
//   2. che ogni campo abbia un nome accessibile, cioè che un lettore di schermo
//      annunci «Anno di nascita, Anna» e non «casella di testo».
//
//  DUE COSE DA SAPERE SU CHROME SENZA FINESTRA, che mi sono costate tempo:
//   · non scende sotto i 500 px di viewport. Chiedere 360 px dà 500 px, e gli
//     screenshot sembrano giusti mentre misurano un'altra cosa. La via è un
//     IFRAME della larghezza voluta: dentro un iframe le media query rispondono
//     alla sua larghezza, e il viewport è vero;
//   · `--allow-file-access-from-files` serve, o l'iframe non si lascia leggere.
//
//  E UNA REGOLA DI SCRITTURA, che è costata due errori di sintassi: il codice che gira DENTRO il
//  browser sta in template literal, quindi lì dentro non si scrivono virgolette inclinate,
//  nemmeno nei commenti. Una sola chiude la stringa e il file non compila più.
// ============================================================================
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const SITO = join(QUI, '..', 'sito');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LARGHEZZE = [320, 390, 600, 900];

// dati di prova: il modulo vuoto non mostra né risultato né decisioni, e quelli sono
// esattamente i pezzi che possono sbordare
const DATI = {quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1965, nascita1:1968,
  ral0:42000, ral1:28000, pens0:2100, pens1:1250,
  annoPens0:2032, annoPens1:2035, pcVoi0:1.2, pcVoi1:1.2, pcDat0:2, pcDat1:2,
  iscr0:2000, iscr1:2004, cl3:180000, spesa:2800, rend:4, infl:2, rendFondo:3,
  etaFine:95, fondo0:90000, fondo1:55000, tfrDove0:'fondo', tfrDove1:'fondo',
  ultimo0:'', ultimo1:''};

// DUE ASSETTI DEL CALCOLATORE, non uno. Col solo modulo «tutti al lavoro» l'avviso di chi è già
// in pensione, le caselle disattivate e la sezione delle scelte che sparisce non venivano MAI
// resi: erano nascosti a ogni larghezza, e nessuna misura poteva accorgersi di come stanno.
// L'avviso in particolare vive DENTRO la griglia delle caselle, che ha i contenuti a gruppi di
// tre: se un giorno smettesse di occupare tutta la riga sfalserebbe ogni cella successiva.
const ASSETTI = {
  attivi: DATI,
  'già in pensione': {...DATI, annoPens0:2015, annoPens1:2020,
                      ral0:'', ral1:''},
  // UNA PERSONA SOLA, e non è un assetto in più per scrupolo: è il caso in cui si spegne la
  // seconda di ogni coppia di righe, ed è lì che si è nascosto per mesi il difetto di `.cur`
  // (spenta con `hidden` mentre un `display:grid` la teneva in pagina). Un ramo di interfaccia
  // che nessuno scenario disegna non è coperto, per quanto verde sia il resto.
  'una persona sola': {...DATI, quanti:'1', nome1:''},
  // IL CAMBIO DI ABITAZIONE, per la stessa ragione dell'assetto qui sopra: senza, tre caselle
  // e il riquadro dell'esito non venivano MAI disegnati, e nessuna delle quarantaquattro
  // combinazioni li avrebbe visti sbordare. Le caselle compaiono solo con la scelta compiuta.
  'cambio di abitazione': {...DATI, casaValore:320000, casaCosa:'affitto',
                           casaAnno:2040, casaCanone:950}
};
const pagine = readdirSync(SITO).filter(f => f.endsWith('.html'));
const dir = mkdtempSync(join(tmpdir(), 'decumulo-schermo-'));

// il calcolatore va compilato, o metà pagina non esiste
writeFileSync(join(dir, 'riempi.js'),
  `const D=${JSON.stringify(DATI)};addEventListener('DOMContentLoaded',()=>{` +
  `for(const[k,v]of Object.entries(D)){const e=document.getElementById(k);if(e)e.value=String(v);}` +
  `if(typeof calc==='function')calc();});`);

const banco = `<!doctype html><meta charset="utf-8"><body><div id="f"></div><script>
const PAG = ${JSON.stringify(pagine)}, W = ${JSON.stringify(LARGHEZZE)};
const ASSETTI = ${JSON.stringify(ASSETTI)};
for (const p of PAG) for (const w of W)
  // il calcolatore si rende una volta per assetto; le pagine di contenuto non hanno dati
  for (const a of (p === 'index.html' ? Object.keys(ASSETTI) : [''])){
    const i = document.createElement('iframe');
    i.src = 'file://${SITO}/' + p + (p === 'index.html' ? '?prova' : '');
    i.width = w; i.height = 900; i.dataset.p = p; i.dataset.w = w; i.dataset.a = a;
    document.getElementById('f').appendChild(i);
  }
addEventListener('load', () => setTimeout(() => {
  const out = [];
  for (const i of document.querySelectorAll('iframe')){
    let d; try { d = i.contentDocument; } catch(e){ continue; }
    if (!d) continue;
    if (i.dataset.p === 'index.html'){
      // il calcolatore si compila iniettando i valori: farlo qui evita un file in più
      for (const [k,v] of Object.entries(ASSETTI[i.dataset.a])){
        const e = d.getElementById(k); if (e) e.value = String(v); }
      try { i.contentWindow.calc(); } catch(e){}
    }
    const r = d.documentElement;
    const scorre = e => { for (let p = e.parentElement; p; p = p.parentElement){
      const o = i.contentWindow.getComputedStyle(p);
      if (o.overflowX === 'auto' || o.overflowX === 'scroll') return true; } return false; };
    const chi = [];
    for (const e of d.querySelectorAll('*')){
      const b = e.getBoundingClientRect();
      if (b.right > r.clientWidth + 1 && b.width > 0 && !scorre(e))
        chi.push(e.tagName + (typeof e.className === 'string' && e.className
          ? '.' + e.className.trim().split(/\\s+/)[0] : '')
          + ' «' + (e.textContent || '').trim().slice(0, 30) + '»');
    }
    // NASCOSTO VUOL DIRE INVISIBILE, non «ha l'attributo».
    // L'attributo hidden nasconde con una regola del browser, che ha la specificità più bassa
    // che esista: QUALUNQUE display scritto su una classe la batte. Un elemento con display
    // flex e hidden resta quindi in mezzo alla pagina, e il codice che lo spegne non spegne
    // niente. È successo al banner del consenso, che non si chiudeva con nessuno dei due
    // pulsanti; e le prove non se ne accorgevano perché guardavano el.hidden, cioè la
    // proprietà, invece di quello che si vede.
    const visibiliMaNascosti = [...d.querySelectorAll('[hidden]')]
      .filter(e => i.contentWindow.getComputedStyle(e).display !== 'none')
      .map(e => (e.id ? '#' + e.id : e.tagName) +
                (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : ''));

    // UN RIQUADRO CHE MOSTRA MENO DI QUANTO CONTIENE, e perché è un controllo a parte.
    // Tutto il resto qui misura lo SBORDO — qualcosa che esce di lato. Questo misura la
    // SOVRAPPOSIZIONE, che non sborda niente: la pagina resta larga uguale, ogni misura è
    // verde, e il testo è scritto sopra un altro testo.
    // Ed è finito online una volta: una regola nuda per la classe «barra», scritta con
    // un'altezza di dieci pixel per la barra della composizione, si è presa anche il contenitore
    // delle scelte sul fondo, che quella classe ce l'aveva da sempre ed era stilata solo in forma
    // annidata. Un riquadro alto 354 px ne mostrava 10, e tutto il seguito ci finiva sopra.
    // La misura è generale e non costa niente: un elemento che non scorre e non taglia deve
    // mostrare tutto quello che contiene. Sulla pagina sana la lista è VUOTA — nessun falso
    // allarme da tollerare, quindi qualunque voce qui dentro è un difetto vero.
    const schiacciati = [];
    for (const e of d.querySelectorAll('body *')){
      const o = i.contentWindow.getComputedStyle(e);
      if (o.display === 'none' || o.overflowY !== 'visible' || o.position === 'absolute') continue;
      if (e.clientHeight > 0 && e.scrollHeight > e.clientHeight + 2)
        schiacciati.push((e.id ? '#' + e.id : e.tagName)
          + (typeof e.className === 'string' && e.className
             ? '.' + e.className.trim().split(/\\s+/)[0] : '')
          + ' mostra ' + e.clientHeight + ' px di ' + e.scrollHeight);
    }

    const senzaNome = [];
    for (const e of d.querySelectorAll('input, select')){
      if (e.type === 'hidden' || e.offsetParent === null) continue;
      const ha = e.getAttribute('aria-label') || d.querySelector('label[for="' + e.id + '"]')
                 || e.closest('label') || e.title;
      if (!ha) senzaNome.push(e.id || e.name || e.type);
    }
    out.push({p: i.dataset.p + (i.dataset.a ? ' (' + i.dataset.a + ')' : ''),
              w: +i.dataset.w, ecc: r.scrollWidth - r.clientWidth,
              chi: [...new Set(chi)].slice(0, 3), senzaNome,
              schiacciati: [...new Set(schiacciati)].slice(0, 5),
              fantasmi: [...new Set(visibiliMaNascosti)]});
  }
  document.title = JSON.stringify(out);
}, 3000));
</script>`;
writeFileSync(join(dir, 'banco.html'), banco);

let out = '';
try {
  out = execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--window-size=2400,3000',
    '--virtual-time-budget=20000', '--dump-dom', 'file://' + join(dir, 'banco.html')],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore','pipe','ignore']});
} catch (e){
  console.log('  ! Chrome non disponibile in ' + CHROME + ': controllo saltato');
  process.exit(0);
}
const m = out.match(/<title>([\s\S]*?)<\/title>/);
if (!m){ console.log('  ✗ nessuna misura: la pagina di prova non ha risposto'); process.exit(1); }
const esiti = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&')
                             .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'"));

let ko = 0;
const sbordano = esiti.filter(x => x.ecc > 0);
const anonimi  = esiti.filter(x => x.senzaNome.length);
console.log(`  ${esiti.length} combinazioni pagina × larghezza (${LARGHEZZE.join(', ')} px)`);
if (sbordano.length){
  ko++; console.log(`  ✗ ${sbordano.length} sbordano:`);
  for (const x of sbordano){ console.log(`      ${x.p} a ${x.w} px, eccede ${x.ecc} px`);
    for (const c of x.chi) console.log('        · ' + c); }
} else console.log('  ok  niente esce di lato, a nessuna larghezza');
if (anonimi.length){
  ko++; console.log(`  ✗ campi senza nome accessibile:`);
  for (const x of anonimi) console.log(`      ${x.p} a ${x.w} px: ${x.senzaNome.join(', ')}`);
} else console.log('  ok  ogni campo visibile ha un nome che un lettore di schermo annuncia');
// --- un riquadro che mostra meno di quanto contiene ------------------------
{
  const stretti = esiti.filter(x => x.schiacciati.length);
  if (stretti.length){
    ko++;
    console.log('  ✗ riquadri schiacciati: mostrano meno di quello che contengono,');
    console.log('    quindi il resto della pagina ci finisce sopra senza sbordare da nessuna parte:');
    for (const x of stretti){
      console.log(`      ${x.p} a ${x.w} px`);
      for (const s of x.schiacciati) console.log('        · ' + s);
    }
  } else console.log('  ok  nessun riquadro mostra meno di quanto contiene');
}
// --- nascosto vuol dire invisibile -----------------------------------------
{
  const rotti = esiti.filter(x => x.fantasmi.length);
  if (rotti.length){
    ko++;
    console.log(`  ✗ elementi con «hidden» che restano VISIBILI (un display d'autore lo batte):`);
    const tutti = [...new Set(rotti.flatMap(x => x.fantasmi))];
    for (const f of tutti) console.log('      · ' + f);
  } else console.log('  ok  ogni elemento con «hidden» è davvero invisibile');
}
// --- e la stampa: su carta il dettaglio è la parte verificabile -------------
// Un <details> chiuso non si apre col CSS, e per mesi si è creduto di sì. Qui si stampa davvero
// e si cerca nel PDF una frase che sta SOLO dentro il dettaglio.
{
  const pdf = join(dir, 'stampa.pdf');
  const pag = join(dir, 'stampa.html');
  const h = readFileSync(join(SITO, 'index.html'), 'utf8');
  writeFileSync(pag, h.replace('</body>',
    `<script>const D=${JSON.stringify(DATI)};addEventListener('DOMContentLoaded',()=>{` +
    `for(const[k,v]of Object.entries(D)){const e=document.getElementById(k);if(e)e.value=String(v);}` +
    `calc();});</script></body>`));
  try {
    execFileSync(CHROME, ['--headless','--disable-gpu','--no-sandbox','--virtual-time-budget=9000',
      '--no-pdf-header-footer', '--print-to-pdf=' + pdf, 'file://' + pag],
      {stdio: ['ignore','ignore','ignore']});
    const grezzo = readFileSync(pdf, 'latin1');
    // il PDF comprime i flussi: si cerca la dimensione, non il testo. Un dettaglio chiuso
    // toglie una pagina intera, e quella differenza si vede.
    const pagine = (grezzo.match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pagine >= 10) console.log(`  ok  la stampa contiene il dettaglio anno per anno`
      + `   ${pagine} pagine; senza il dettaglio ne farebbe 9`);
    else { ko++; console.log(`  ✗ la stampa NON contiene il dettaglio: ${pagine} pagine`); }
  } catch (e){
    ko++;                       // un guasto non è una rinuncia: se non si stampa, si sa
    console.log('  ✗ la stampa non è riuscita: ' + String(e.message || e).slice(0, 80));
  }
}

// --- IL CONSENSO, PROVATO DAVVERO IN UN BROWSER -----------------------------
// `verifiche/consenso.mjs` controlla il documento: che il tag non sia nel markup, che il banner
// ci sia, che l'informativa lo dica. Nessuna di quelle cose prova il COMPORTAMENTO, che è la
// parte che conta: un errore nel codice del banner lo lascerebbe muto, e il sito sembrerebbe a
// posto mentre non chiede niente a nessuno, oppure misurerebbe chi ha detto di no.
// Qui la pagina si apre per davvero, si clicca, e si guarda se il tag è arrivato nella testa
// del documento. È l'unico posto dove questo si può vedere.
{
  const banco = join(dir, 'consenso.html');
  writeFileSync(banco, `<!doctype html><meta charset="utf-8"><body>
<iframe id="f" src="file://${SITO}/index.html" width="1000" height="800"></iframe>
<script>
const out = [], f = document.getElementById('f');
const attesa = ms => new Promise(r => setTimeout(r, ms));
const dopoIlCarico = () => new Promise(r => f.addEventListener('load', r, {once:true}));
addEventListener('load', async () => {
  let d = f.contentDocument, w = f.contentWindow;
  // si parte da una memoria pulita: una scelta rimasta da un giro precedente proverebbe
  // un'altra cosa, e il controllo direbbe rosso senza che niente sia rotto
  try { w.localStorage.removeItem('decumulo-it-consenso'); } catch(e){}
  f.src = f.src; await dopoIlCarico(); await attesa(400);
  d = f.contentDocument; w = f.contentWindow;
  const tag = () => !!d.querySelector('script[src*="googletagmanager"]');
  const banner = () => d.getElementById('consenso');
  // SI GUARDA QUELLO CHE SI VEDE, non l'attributo. Questa prova è stata verde per ore mentre il
  // banner non si chiudeva con nessuno dei due pulsanti: controllava hidden, che il codice
  // impostava davvero, mentre un display d'autore lo teneva in pagina. Una prova che misura
  // l'intenzione invece dell'effetto è peggio di nessuna prova.
  const inPagina = () => w.getComputedStyle(banner()).display !== 'none';
  const memoria = () => { try { return w.localStorage.getItem('decumulo-it-consenso'); }
                          catch(e){ return 'illeggibile'; } };

  out.push(['prima di ogni scelta il tag non è stato caricato', !tag()]);
  out.push(['e il banner è visibile', banner() && inPagina()]);

  d.getElementById('consensoNo').click(); await attesa(300);
  out.push(['dopo il rifiuto il tag continua a non esserci', !tag()]);
  out.push(['il banner sparisce DAVVERO dalla pagina, e non torna a insistere', !inPagina()]);
  out.push(['il rifiuto resta memorizzato', memoria() === 'no']);

  d.getElementById('consensoCambia').click(); await attesa(200);
  out.push(['«Cambia» riapre la scelta da qualunque pagina', inPagina()]);

  d.getElementById('consensoSi').click(); await attesa(700);
  out.push(['solo dopo il consenso il tag viene caricato', tag()]);
  out.push(['e il consenso resta memorizzato', memoria() === 'si']);

  document.title = JSON.stringify(out);
});
</script>`);
  console.log('\n  — il consenso, provato in un browser —');
  try {
    const uscita = execFileSync(CHROME, ['--headless','--disable-gpu','--no-sandbox',
      '--allow-file-access-from-files','--virtual-time-budget=20000','--window-size=1100,900',
      '--dump-dom', 'file://' + banco],
      {encoding:'utf8', maxBuffer: 64*1024*1024, stdio:['ignore','pipe','ignore']});
    const m = uscita.match(/<title>([\s\S]*?)<\/title>/);
    if (!m) { ko++; console.log('  ✗ la pagina di prova non ha risposto'); }
    else for (const [nome, esito] of JSON.parse(m[1].replace(/&quot;/g,'"')
                                                    .replace(/&amp;/g,'&')
                                                    .replace(/&#39;/g,"'"))){
      if (!esito) ko++;
      console.log(`  ${esito ? 'ok ' : '✗  '} ${nome}`);
    }
  } catch (e){
    ko++;                       // un guasto non è una rinuncia
    console.log('  ✗ la prova non è riuscita: ' + String(e.message || e).slice(0, 80));
  }
}

if (ko) process.exitCode = 1;
