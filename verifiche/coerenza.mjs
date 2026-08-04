// ============================================================================
//  CHE LE PAGINE DICANO QUELLO CHE IL CONTO FA.
//
//  È il difetto che si è ripresentato tre volte, sempre allo stesso modo: il
//  motore cambia, le pagine restano indietro, e nessun controllo se ne accorge
//  perché tutti guardano i numeri e nessuno guarda le affermazioni.
//   · «il nucleo monocomponente non è previsto», mentre lo era da un giorno;
//   · «la cessazione è collocata nel medesimo esercizio», mentre era diventata
//     di ciascuno;
//   · «il modello non applica l'imposta del 26%, la consistenza è sovrastimata»,
//     mentre il rendimento era ormai chiesto già netto.
//
//  NON SI PUÒ CONTROLLARE A MACCHINA CHE UNA FRASE SIA VERA. Si possono però
//  cogliere tre classi di divergenza, e sono quelle che hanno prodotto tutti e
//  tre i casi:
//
//   1. UNA CIFRA SCRITTA A MANO che coincide con un parametro. Il build già ne
//      segnala nove, da un elenco tenuto a mano; qui si confrontano TUTTI i
//      valori di `regole.mjs` con tutti i numeri delle pagine. Se una pagina
//      scrive 5.300 senza segnaposto, al prossimo cambio di legge resterà
//      indietro in silenzio.
//   2. UNA CIFRA SCRITTA A MANO DENTRO `regole.mjs`. Una voce di `TESTI` che è
//      una stringa letterale non ha un parametro dietro: niente fonte, niente
//      stato di verifica, e la guardia delle scadenze non la vede. È il posto
//      meno sospettabile in cui una cifra può marcire.
//   3. UN NUMERO CABLATO NEL MOTORE che ha l'aria di un parametro. È il modo in
//      cui una regola torna a vivere in due posti.
//
//  E in coda stampa l'elenco dei LIMITI DICHIARATI, perché vengano riletti: un
//  limite scaduto è una bugia come le altre, e l'unico modo di accorgersene è
//  averlo sotto gli occhi quando si tocca il motore.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGOLE, TESTI } from '../regole.mjs';

const QUI = dirname(fileURLToPath(import.meta.url));
const SORG = join(QUI, '..', 'sorgenti');
const SITO = join(QUI, '..', 'sito');

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

const pagine = fs.readdirSync(SORG).filter(f => f.endsWith('.html') && !f.startsWith('_'));

// --- 1. una cifra scritta a mano che coincide con un parametro --------------
// Si confrontano le cifre COME LE VEDE IL LETTORE, cioè già formattate: è in quella forma che
// finiscono in una pagina, ed è quella che diverge.
const forme = new Map();          // testo della cifra → nome del parametro
for (const [k, r] of Object.entries(REGOLE)){
  if (Array.isArray(r.val)) continue;
  const n = r.val;
  const cand = [
    n.toLocaleString('it-IT', {useGrouping: 'always'}),
    (n * 100).toLocaleString('it-IT') + '%',
    (n * 100).toLocaleString('it-IT', {minimumFractionDigits: 2}) + '%',
    n > 1 ? Math.round(n).toLocaleString('it-IT', {useGrouping: 'always'}) + ' €' : null
  ].filter(x => x && /\d/.test(x) && x.replace(/\D/g, '').length >= 3);
  for (const x of cand) if (!forme.has(x)) forme.set(x, k);
}
const aMano = [];
for (const f of pagine){
  const s = fs.readFileSync(join(SORG, f), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<script>[\s\S]*?<\/script>/g, '');
  for (const [testo, param] of forme)
    if (s.includes(testo)) aMano.push(`${f}: «${testo}» è ${param}`);
}
c('nessuna pagina scrive a mano una cifra che sta in regole.mjs', aMano.length === 0,
  aMano.length ? aMano.slice(0, 6).join(' · ') : `${forme.size} forme confrontate su ${pagine.length} pagine`);

// --- 2. una cifra scritta a mano DENTRO regole.mjs -------------------------
// Il primo controllo guarda le pagine; questo guarda il file che dovrebbe essere l'unica fonte.
// Una voce di `TESTI` scritta come stringa letterale è una cifra senza parametro dietro: non
// compare nella tabella dei parametri, non ha `fonte` né `verificata`, e la guardia delle
// scadenze non la vede. È il posto meno sospettabile in cui una cifra può marcire.
//
// (Il controllo che qui stava prima — «ogni segnaposto è usato da una pagina» — l'ho tolto:
// segnalava dieci cifre che sono tutte nella tabella dei parametri, generata da REGOLE, quindi
// mostrate e riverificabili. Cercava il rischio nel posto sbagliato.)
{
  const sorgente = fs.readFileSync(join(QUI, '..', 'regole.mjs'), 'utf8');
  const blocco = sorgente.slice(sorgente.indexOf('export const TESTI'));
  const letterali = [...blocco.matchAll(/^\s{2}(\w+):\s*'([^']*\d[^']*)'/gm)]
    .map(m => `${m[1]} = «${m[2]}»`);
  c('nessuna cifra sta in regole.mjs come stringa scritta a mano', letterali.length === 0,
    letterali.length ? letterali.join(' · ') + ' — senza fonte né data di revisione'
                     : `${Object.keys(TESTI).length} voci, tutte derivate da un parametro`);
}

// --- 3. un numero cablato nel motore che ha l'aria di un parametro ----------
// Si guarda il sorgente, non il costruito: nel costruito il blocco generato è indistinguibile.
const js = (fs.readFileSync(join(SORG, 'index.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1]
  .replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");     // via le stringhe: i numeri nei testi non contano
// quello che resta di strutturale: indici, mesi, percentuali di comodo, tolleranze
const INNOCUI = new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,20,22,24,25,30,40,44,50,60,
                         100,180,200,250,360,500,1000,1e3,1e6,1e9]);
const sospetti = new Map();
for (const m of js.matchAll(/(?<![\w.$])(\d+(?:\.\d+)?)(?![\w.])/g)){
  const n = +m[1];
  if (INNOCUI.has(n) || n >= 1900 && n <= 2200) continue;   // gli anni non sono parametri
  if (n < 1 && String(n).length <= 6) continue;             // frazioni di comodo, es. 0.5
  sospetti.set(n, (sospetti.get(n) || 0) + 1);
}
// e quelli che coincidono con un parametro sono i veri colpevoli
const valori = new Set(Object.values(REGOLE).filter(r => !Array.isArray(r.val)).map(r => r.val));
const doppioni = [...sospetti.keys()].filter(n => valori.has(n));
c('nessun parametro è cablato anche nel motore', doppioni.length === 0,
  doppioni.length ? doppioni.join(', ') : `${sospetti.size} numeri liberi nel motore, nessuno è un parametro`);

// --- 4. quello che si pubblica è la pagina, non il ragionamento -------------
// I COMMENTI DEI SORGENTI NON DEVONO USCIRE. Un sito è pubblico quanto il suo «visualizza
// sorgente», e in un commento si scrive come si scrive quando si sta ragionando: numeri di
// prova, casi di persone, ripensamenti. Per un po' ne sono usciti milleduecento.
// Ora `build.mjs` li toglie, e questo controllo verifica che continui a farlo: la garanzia sta
// in una riga di build, e una riga si può togliere senza accorgersene.
// Restano i commenti in CODA a una riga di codice, che il build non tocca: sono contati qui, e
// il conto stampato serve a ricordare che quelli si leggono.
// SI CONTANO TUTTI E TRE I MODI DI COMMENTARE, e non è un dettaglio: la prima versione di questo
// controllo guardava solo `<!--` e `//`, cioè i due modi che si usano nel testo e nel codice, e
// dava verde mentre centouno commenti del FOGLIO DI STILE — che si scrivono `/* */` — uscivano
// tranquillamente. Un controllo che guarda dove il problema si è già visto non trova il prossimo.
let commenti = 0, inCoda = 0;
for (const f of fs.readdirSync(SITO).filter(x => x.endsWith('.html'))){
  const t = fs.readFileSync(join(SITO, f), 'utf8');
  commenti += (t.match(/<!--/g) || []).length;
  commenti += (t.match(/\/\*/g)  || []).length;
  for (const r of t.split('\n')){
    if (/^\s*\/\//.test(r)) commenti++;
    else if (/\s\/\/\s/.test(r) && !/https?:\/\//.test(r)) inCoda++;
  }
}
c('nelle pagine pubblicate non resta un commento intero', commenti === 0,
  commenti ? `${commenti} trovati` : `${inCoda} commenti in coda a una riga, che il build non toglie`);

// --- e i limiti dichiarati, da rileggere ------------------------------------
console.log('\n  I LIMITI CHE LE PAGINE DICHIARANO — vanno riletti quando si tocca il motore:');
const RE = /(non (?:è|sono) rappresentat[oiae]|non rappresenta|non (?:è|sono) previst[oiae]|non contempla|non applica|non quantifica|resta[no]? estranei?|non modellat[oiae])/gi;
let n = 0;
for (const f of pagine){
  const s = fs.readFileSync(join(SORG, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const testo = s.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
                 .replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  const viste = new Set();
  for (const m of testo.matchAll(RE)){
    const i = Math.max(0, m.index - 90);
    const frase = testo.slice(i, m.index + 130).trim();
    if (viste.has(frase.slice(0, 40))) continue;
    viste.add(frase.slice(0, 40));
    if (!n++) console.log('');
    console.log(`   · [${f}] …${frase}…`);
  }
}
console.log(`\n  ${n} limiti dichiarati.`);

// --- il registro: quanto le pagine suonano scritte da una macchina ----------
// UNA FRASE CHE NON PU ESSERE FALSA NON INFORMA, e su uno strumento che chiede fiducia perché è
// verificabile una frase che si compiace annulla il lavoro di quelle che si possono controllare.
// Il difetto non ha una forma lessicale — cercare parole dava quasi solo falsi positivi — ne ha
// una logica, e sono quattro mosse:
//
//   annuncio  la frase promette di dire qualcosa, poi lo dice. Due mosse dove ne basta una:
//             «non compare, E LA RAGIONE È SEMPLICE: non produce reddito» → «non compare PERCHÉ»;
//   chiosa    la frase finisce e aggiunge perché contava: «…, che è l'informazione utile».
//             Prova: togliendola si perde un fatto? Se no, va via;
//   antitesi  «non è un dettaglio», «e non è una cautela di stile».
//             Prova: qualcuno l'avrebbe pensato? Se sì informa — ed è il caso di `rita.html`,
//             che nega perché la RITA la si confonde davvero con un riscatto. Se no, è l'autore
//             che si difende da un'obiezione che nessuno ha fatto;
//   massima   soggetto generico più giudizio, al posto di un fatto.
//             Prova: può essere falsa? «Una proiezione a quarant'anni ha valore solo se le sue
//             assunzioni sono esplicite» — nessuno potrebbe contestarla, quindi non dice niente.
//
// IL RIFERIMENTO NON È INVENTATO: è `rita.html`, che tratta materia altrettanto ostica e sta a 6
// su 100. Prima della revisione `casa-e-decumulo.html` stava a 25, cioè al quadruplo.
//
// STAMPA E NON FALLISCE, ed è una scelta. Un giudizio serve — metà di queste segnalazioni sono
// legittime, e su `il-metodo.html` quasi tutte — e una soglia numerica su uno stile diventa la
// soglia che qualcuno alza per far tornare il verde. Qui serve che si veda, non che si blocchi.
const REGISTRO = {
  annuncio: /(la ragione è|il motivo è|il punto è|una cosa che|un modo|per quello che è|ed è quello che|vale la pena|conviene [a-zà-ù]+la|c.è un|esistono du|sono due|si spiega|va detto)[^:]{0,40}\s?:/i,
  chiosa:   /,\s*(che è|ed è|che significa|e non è|il che)[^.]{4,95}\.$/,
  antitesi: /[Nn]on è (un|una|uno|il|la|lo)[^,.:;]{2,45}[,:—]/,
  massima:  /^(Una?|Ogni|Qualunque|Nessun[ao]?|Chiunque)\s+[a-zà-ù]+[^0-9]*$/
};
// le celle e le voci di elenco si scartano: sono etichette, non prosa, e una massima lì è un titolo
const prosa = f => fs.readFileSync(join(SORG, f), 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '').replace(/<t[dh][^>]*>|<li[^>]*>/g, ' ¶ ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&rsquo;/g, '’')
  .replace(/&mdash;/g, '—').replace(/&laquo;|&raquo;/g, '').replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ')
  .split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length >= 40 && !s.includes('¶'));

console.log('\n  IL REGISTRO DELLE PAGINE — riferimento: rita.html, che sta a 6');
console.log('  (si stampa, non fallisce: metà delle segnalazioni sono legittime e vanno lette)\n');
const righe = [];
for (const f of pagine){
  const frasi = prosa(f);
  if (!frasi.length) continue;
  const trovate = [];
  for (const s of frasi)
    for (const k of Object.keys(REGISTRO))
      if (REGISTRO[k].test(s)) trovate.push([k, s]);
  righe.push([f, frasi.length, trovate]);
}
righe.sort((a, b) => b[2].length / b[1] - a[2].length / a[1]);
for (const [f, tot, trovate] of righe)
  console.log(`   ${f.padEnd(29)}${String(trovate.length).padStart(3)} su ${String(tot).padStart(3)} frasi`
    + `${String(Math.round(100 * trovate.length / tot)).padStart(6)} ogni 100`);
const alte = righe.filter(r => 100 * r[2].length / r[1] > 12);
if (alte.length){
  console.log('\n   sopra il livello di `rita.html` del doppio — da rileggere:');
  for (const [f, , trovate] of alte)
    for (const [k, s] of trovate.slice(0, 6)) console.log(`   · [${f}] ${k}: …${s.slice(0, 110)}…`);
}

console.log(ko ? `\n  ✗ ${ko} controlli falliti` : '\n  pagine e motore non divergono su niente di controllabile');
if (ko) process.exitCode = 1;
