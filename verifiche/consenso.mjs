// ============================================================================
//  IL CONSENSO PRIMA DELLA MISURAZIONE.
//
//  Dal 01/08/2026 il sito misura le visite con Google Analytics. È l'unica
//  cosa che manda dati fuori dal browser, e in Italia richiede un consenso
//  PREVENTIVO: il tag non può stare nel documento, deve nascere da un sì.
//
//  Qui si tengono ferme le proprietà che, rompendosi, non farebbero fallire
//  nulla e non si vedrebbero: il sito continuerebbe a funzionare e a essere
//  bello, misurando gente che non aveva acconsentito.
//
//  SI CONTROLLA IL SITO COSTRUITO, non i sorgenti: fra i due c'è un build, e
//  quello che finisce online è il primo.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const SITO = join(QUI, '..', 'sito');
const pagine = fs.readdirSync(SITO).filter(f => f.endsWith('.html'));

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};

const testo = Object.fromEntries(pagine.map(p => [p, fs.readFileSync(join(SITO, p), 'utf8')]));

// --- 1. IL TAG NON DEVE ESSERE CARICATO DAL DOCUMENTO ------------------------
// È il controllo che vale più di tutti: basta incollare il frammento che Google consegna
// perché il tag parta al caricamento della pagina, prima di qualunque scelta. Quel frammento
// è fatto per essere incollato, ed è esattamente ciò che qui non si può fare.
{
  const conMarkup = pagine.filter(p =>
    /<script[^>]+src=["'][^"']*googletagmanager/i.test(testo[p]));
  c('nessuna pagina carica il tag dal markup', conMarkup.length === 0, conMarkup.join(', '));

  // e nemmeno da un'altra origine qualsiasi: l'unico dominio esterno ammesso è quello del tag,
  // e solo dentro il codice che gira dopo il consenso
  const esterne = [];
  for (const p of pagine)
    for (const m of testo[p].matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)/gi))
      if (!/^https?:\/\/(www\.)?decumulo\.it/i.test(m[1])) esterne.push(`${p}: ${m[1]}`);
  c('nessuna risorsa esterna nel documento, di nessun tipo', esterne.length === 0,
    esterne.slice(0, 3).join(' · '));
}

// --- 2. IL BANNER STA SU OGNI PAGINA ----------------------------------------
// Viaggia col piè di pagina, che ogni pagina include: se un giorno una pagina nuova non lo
// includesse, quella pagina misurerebbe senza chiedere niente.
{
  const senza = pagine.filter(p => !/id="consenso"/.test(testo[p]));
  c('il banner è su tutte le pagine', senza.length === 0, senza.join(', '));
  const senzaRevoca = pagine.filter(p => !/id="consensoCambia"/.test(testo[p]));
  c('e la revoca pure: si toglie da dove si è dato', senzaRevoca.length === 0,
    senzaRevoca.join(', '));
}

// --- 3. RIFIUTARE DEV'ESSERE FACILE QUANTO ACCETTARE -------------------------
// Non è una questione di gentilezza: un «rifiuta» meno visibile dell'«accetta» rende il
// consenso non libero, e quindi non valido. Si controlla che i due pulsanti siano davvero
// due pulsanti dello stesso tipo, senza classi che li distinguano.
{
  const p = 'index.html';
  const bottoni = [...testo[p].matchAll(/<button[^>]*id="consenso(Si|No)"[^>]*>/g)]
    .map(m => m[0]);
  c('accettare e rifiutare sono due pulsanti, non un pulsante e un link', bottoni.length === 2);
  const classi = bottoni.map(b => (b.match(/class="([^"]*)"/) || [, ''])[1]);
  c('e non hanno stili diversi che ne suggeriscano uno', classi[0] === classi[1],
    classi.join(' / ') || 'nessuna classe su entrambi');
  // l'ordine conta meno della forma, ma «rifiuta» prima è la scelta dichiarata
  c('rifiutare viene prima nell\'ordine di lettura',
    testo[p].indexOf('id="consensoNo"') < testo[p].indexOf('id="consensoSi"'));
}

// --- 4. IL CONSENSO NON SI CONFONDE COI DATI DEL MODULO ----------------------
// Sono due memorie diverse con due vite diverse: azzerare il calcolatore non deve cancellare
// una scelta di privacy, e revocare il consenso non deve cancellare quello che si è scritto.
{
  // si raccolgono TUTTE le chiavi e si contano le distinte: prendere «la prima» dipende
  // dall'ordine in cui il build monta i pezzi, che non è una proprietà su cui poggiare un
  // controllo. Il piè di pagina sta prima del calcolatore, e infatti la prima era quella
  // sbagliata: il controllo falliva su un codice giusto.
  const src = testo['index.html'];
  const chiavi = [...new Set([...src.matchAll(/CHIAVE\s*=\s*'([^']+)'/g)].map(m => m[1]))];
  c('la scelta e i dati del modulo stanno in due chiavi diverse',
    chiavi.length === 2 && chiavi.includes('decumulo-it-consenso'),
    chiavi.map(k => `«${k}»`).join(' e '));
}

// --- 5. LA PAGINA DELL'INFORMATIVA DICE QUELLO CHE IL SITO FA ----------------
// Il difetto già visto tre volte in questo progetto è la pagina che descrive un comportamento
// che il codice non ha più. Qui vale doppio, perché è una dichiarazione a chi legge.
{
  const pr = testo['privacy.html'];
  const dice = [
    ['nomina lo strumento usato',            /Google Analytics/],
    ['nomina i cookie che vengono scritti',  /_ga/],
    ['dichiara la base giuridica',           /consenso/i],
    ['dichiara come si revoca',              /revoc/i],
    ['dichiara il trasferimento fuori dall\'Unione', /Data Privacy Framework/],
    ['tiene distinti i dati del calcolatore', /non rientrano nella misurazione/]
  ];
  for (const [nome, re] of dice) c(`l'informativa ${nome}`, re.test(pr));
  // e NON deve più dire il contrario di quello che fa
  c('e non afferma più di non impiegare strumenti di analisi',
    !/non impiega strumenti di analisi/.test(pr));
  c('né di non usare cookie in assoluto',
    !/non utilizza cookie<\/b> di alcun tipo/.test(pr));
}

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n  il tag non parte senza consenso, e la pagina lo dice');
if (ko) process.exitCode = 1;
