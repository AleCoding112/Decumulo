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
// `build.mjs` toglie i commenti da `sito/`; qui si controlla che continui a farlo, perché la
// garanzia sta in una riga di build e una riga si può togliere senza accorgersene.
// I commenti in coda a una riga di codice il build non li tocca: si contano, e il conto ricorda
// che quelli si leggono.
// Si contano tutti e tre i modi di commentare. La prima versione guardava solo `<!--` e `//` e
// dava verde mentre centouno commenti CSS — che si scrivono `/* */` — uscivano tranquillamente.
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
// Cerca le frasi che suonano scritte da una macchina. Il difetto non ha una forma lessicale —
// cercare parole dava quasi solo falsi positivi — ne ha una logica, e sono quattro mosse, con la
// prova che le distingue da una frase legittima:
//
//   annuncio  promette di dire qualcosa, poi lo dice: «non compare, e la ragione è semplice: non
//             produce reddito» → «non compare perché non produce reddito»;
//   chiosa    dopo la frase, perché contava: «…, che è l'informazione utile».
//             Prova: togliendola si perde un fatto?
//   antitesi  «non è un dettaglio», «e non è una cautela di stile».
//             Prova: qualcuno l'avrebbe pensato? `rita.html` scrive «non è né un'anticipazione
//             né un riscatto», e lì informa, perché la RITA la si confonde davvero con quelle;
//   massima   soggetto generico più giudizio al posto di un fatto.
//             Prova: può essere falsa?
//
// Il riferimento è `rita.html`, che tratta materia altrettanto ostica e sta a 6 su 100. Prima
// della revisione `casa-e-decumulo.html` stava a 25.
//
// Stampa e non fallisce: metà delle segnalazioni sono legittime, e su `il-metodo.html` quasi
// tutte. Una soglia numerica su uno stile diventa la soglia che si alza per far tornare il verde.
const REGISTRO = {
  annuncio: /(la ragione è|il motivo è|il punto è|una cosa che|un modo|per quello che è|ed è quello che|vale la pena|conviene [a-zà-ù]+la|c.è un|esistono du|sono due|si spiega|va detto)[^:]{0,40}\s?:/i,
  chiosa:   /,\s*(che è|ed è|che significa|e non è|il che)[^.]{4,95}\.$/,
  antitesi: /[Nn]on è (un|una|uno|il|la|lo)[^,.:;]{2,45}[,:—]/,
  massima:  /^(Una?|Ogni|Qualunque|Nessun[ao]?|Chiunque)\s+[a-zà-ù]+[^0-9]*$/
};
// le celle e le voci di elenco si scartano: sono etichette, non prosa, e una massima lì è un titolo
const ripulisci = t => t
  .replace(/<t[dh][^>]*>|<li[^>]*>/g, ' ¶ ').replace(/<[^>]+>/g, ' ')
  .replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&rsquo;/g, '’')
  .replace(/&mdash;/g, '—').replace(/&laquo;|&raquo;/g, '').replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ')
  .split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length >= 40 && !s.includes('¶'));

const prosa = f => ripulisci(fs.readFileSync(join(SORG, f), 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<!--[\s\S]*?-->/g, ''));

// METÀ DEL TESTO CHE SI LEGGE NON STA NELL'HTML. Il verdetto, lo scenario del superstite, la
// prova di tenuta e le frasi dei cursori le scrive il codice mentre si compila: sono ~1.750
// parole, e per un pezzo il metro qui sopra le ha saltate, perché salta i <script>. Sono anche
// le frasi più lette del sito — sono la risposta — e quelle che si aggiungono più spesso.
//
// SI PRENDONO I TEMPLATE LITERAL, ed è l'unico posto dove quelle frasi possono stare. Un
// template contiene però anche formule e tracciati SVG: si tiene solo ciò che ha almeno sei
// parole E una parola grammaticale italiana, che nessuna formula ha. I `${...}` diventano un
// segno, o una frase spezzata dai suoi valori sembrerebbe finita.
const generate = f => {
  if (!fs.readFileSync(join(SORG, f), 'utf8').includes('function simula(')) return [];
  const codice = [...fs.readFileSync(join(SORG, f), 'utf8')
    .matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const frasi = [];
  for (const m of codice.matchAll(/`([^`]*)`/g)){
    const t = m[1].replace(/\$\{[^}]*\}/g, '…');
    if (t.split(/\s+/).length < 6) continue;
    if (!/\b(il|la|le|lo|un|una|che|non|si|per|con|del|della)\b/.test(t.replace(/<[^>]+>/g, ' '))) continue;
    frasi.push(...ripulisci(t));
  }
  return frasi;
};

console.log('\n  IL REGISTRO DELLE PAGINE — riferimento: rita.html, che sta a 6');
console.log('  (si stampa, non fallisce: metà delle segnalazioni sono legittime e vanno lette)\n');
const misura = (nome, frasi) => {
  if (!frasi.length) return null;
  const trovate = [];
  for (const s of frasi)
    for (const k of Object.keys(REGISTRO))
      if (REGISTRO[k].test(s)) trovate.push([k, s]);
  return [nome, frasi.length, trovate];
};
const righe = [];
for (const f of pagine){
  for (const r of [misura(f, prosa(f)), misura('il motore, frasi generate', generate(f))])
    if (r) righe.push(r);

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
