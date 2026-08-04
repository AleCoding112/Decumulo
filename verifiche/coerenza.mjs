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
let commenti = 0, inCoda = 0;
for (const f of fs.readdirSync(SITO).filter(x => x.endsWith('.html'))){
  const t = fs.readFileSync(join(SITO, f), 'utf8');
  commenti += (t.match(/<!--/g) || []).length;
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

console.log(ko ? `\n  ✗ ${ko} controlli falliti` : '\n  pagine e motore non divergono su niente di controllabile');
if (ko) process.exitCode = 1;
