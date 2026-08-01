// ============================================================================
//  LE CIFRE SCADONO, E IL CODICE NON SE NE ACCORGE.
//
//  Tutto il resto del progetto protegge dalla divergenza: le cifre stanno in un
//  posto solo, il build le porta ovunque, due motori indipendenti si confrontano.
//  Nessuna di queste difese vede il tempo passare. Un sito che nel 2029 mostra
//  l'assegno sociale del 2026 non fallisce nessun controllo: dà numeri sbagliati
//  con la stessa sicurezza con cui dava quelli giusti, e per giunta dichiara in
//  fondo a ogni pagina una data che gli dà l'aria di essere aggiornato.
//
//  LA SCADENZA NON È «SEI MESI», È IL 1° GENNAIO. Non è una convenzione scelta da
//  noi: è la data in cui l'INPS rivaluta l'assegno sociale, ed è quella in cui
//  entra in vigore la legge di bilancio, che può cambiare le aliquote IRPEF, il
//  tetto di deducibilità e la quota massima in capitale. Passato un capodanno
//  dall'ultima revisione i parametri vanno riverificati per costruzione, non
//  «probabilmente».
//
//  SI VERIFICA DA SÉ. Una guardia che dipende dalla data odierna non si può
//  provare aspettando: il ramo che avvisa prima della scadenza si vedrebbe solo
//  in ottobre, e quello che blocca solo a gennaio. `verdetto()` prende la data
//  come argomento, così i rami si esercitano tutti a ogni esecuzione.
//
//  Si lancia da solo:  node verifiche/scadenze.mjs
// ============================================================================
import { REVISIONE, REVISIONE_ISO, daConfermare } from '../regole.mjs';

const AVVISO_GIORNI = 90;
const giorno = t => new Date(t + 'T00:00:00Z');

// Il verdetto è una funzione pura di due date: è l'unica forma in cui si può provare.
export function verdetto(revIso, oggi){
  const rev = giorno(revIso);
  if (Number.isNaN(rev.getTime())) return {stato: 'illeggibile'};
  const capodanno = giorno(`${rev.getUTCFullYear() + 1}-01-01`);
  const giorni = Math.ceil((capodanno - oggi) / 86400000);
  const anno = capodanno.getUTCFullYear();
  if (oggi >= capodanno) return {stato: 'scaduto', anno};
  return {stato: giorni <= AVVISO_GIORNI ? 'in scadenza' : 'corrente', anno, giorni};
}

// --- la propria prova, prima di dare un verdetto su qualcosa d'altro --------
const CASI = [
  ['2026-07-31', '2026-08-01', 'corrente'],     // appena rivisti
  ['2026-07-31', '2026-12-31', 'in scadenza'],  // l'ultimo giorno prima del capodanno
  ['2026-07-31', '2026-10-03', 'in scadenza'],  // il confine dei 90 giorni
  ['2026-07-31', '2027-01-01', 'scaduto'],      // il giorno esatto in cui scadono
  ['2026-12-31', '2027-01-01', 'scaduto'],      // rivisti a dicembre: scadono il giorno dopo
  ['2024-03-01', '2026-07-31', 'scaduto'],      // vecchi di due anni
  ['non-una-data', '2026-07-31', 'illeggibile'] // e un refuso non deve passare in silenzio
];
let rotti = 0;
for (const [rev, oggi, atteso] of CASI){
  const v = verdetto(rev, giorno(oggi)).stato;
  if (v !== atteso){ rotti++; console.log(`  KO  la guardia stessa: ${rev} al ${oggi} → ${v}, atteso ${atteso}`); }
}
console.log(rotti ? `  ✗ la guardia non funziona (${rotti} casi)`
                  : `  ok  la guardia scatta quando deve (${CASI.length} casi provati)`);
if (rotti) process.exitCode = 1;

// --- e adesso il verdetto vero ---------------------------------------------
const v = verdetto(REVISIONE_ISO, new Date());
console.log(`  parametri rivisti al ${REVISIONE} (${REVISIONE_ISO})`);

if (v.stato === 'illeggibile'){
  console.log(`  ✗ REVISIONE_ISO non è una data leggibile: «${REVISIONE_ISO}»`);
  process.exitCode = 1;
} else if (v.stato === 'scaduto'){
  console.log(`
  ✗ SCADUTI. Dal ${REVISIONE} è passato il 1° gennaio ${v.anno}.
    Da riverificare, in quest'ordine:
      · ASSEGNO_SOCIALE   rivalutato ogni gennaio (circolare INPS di dicembre)
      · SCAGLIONI         aliquote IRPEF, se la legge di bilancio le ha toccate
      · TETTO_DEDUZIONE   e QUOTA_ORDINARIA, per la stessa ragione
      · SPERANZA_VITA     se è uscita una tavola ISTAT nuova: si aggiorna INSIEME a
                          MARGINE_RENDITA, o il coefficiente si sposta due volte
    Poi si porta REVISIONE_ISO alla data della verifica.
    Finché non è fatto, quello che il sito pubblica è vecchio di almeno un anno.`);
  process.exitCode = 1;
} else if (v.stato === 'in scadenza'){
  console.log(`  ! fra ${v.giorni} giorni scade: il 1° gennaio ${v.anno} l'assegno sociale`
    + ` viene rivalutato e la legge di bilancio entra in vigore`);
} else {
  console.log(`  ok  correnti fino al 1° gennaio ${v.anno} (fra ${v.giorni} giorni)`);
}

// le cifre che nessuno ha ancora confermato: il build le stampa, ma passa lo stesso
const aperte = daConfermare();
if (aperte.length){
  console.log(`  ! ${aperte.length} cifre non confermate, e sono pubblicate:`);
  for (const r of aperte) console.log(`      · ${r.nome} — ${r.fonte}`);
} else {
  console.log('  ok  nessuna cifra in attesa di conferma');
}
