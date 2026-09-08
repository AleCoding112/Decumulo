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
//  E C'È UNA SECONDA COSA CHE SCADE: LA PROSA AL FUTURO. Le pagine dicono che
//  l'erogazione frazionata «si può chiedere dal 31 ottobre 2026» e che «fino a
//  quella data il fondo non la eroga». Sono frasi vere oggi e stantie dopo, e
//  nessun controllo sulle cifre le vede: qui, passata la data, si pretende che
//  il segnaposto `{{frazDal}}` sparisca dalle pagine, cioè che quelle frasi
//  siano state riscritte. Il criterio è meccanico e si spegne da sé: una volta
//  tolte, la guardia torna verde e la data resta nella tabella dei parametri
//  come fatto storico.
//
//  SI VERIFICA DA SÉ. Una guardia che dipende dalla data odierna non si può
//  provare aspettando: il ramo che avvisa prima della scadenza si vedrebbe solo
//  in ottobre, e quello che blocca solo a gennaio. `verdetto()` e `transitoria()`
//  prendono la data come argomento, così i rami si esercitano tutti a ogni
//  esecuzione.
//
//  Si lancia da solo:  node verifiche/scadenze.mjs
// ============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVISIONE, REVISIONE_ISO, FRAZ_DECORRENZA_ISO, daConfermare } from '../regole.mjs';

const QUI = dirname(fileURLToPath(import.meta.url));
const AVVISO_GIORNI = 90;
const giorno = t => new Date(t + 'T00:00:00Z');
const inItaliano = t => giorno(t).toLocaleDateString('it-IT',
  {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});

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

// La prosa che scade: prima della data è vera, dopo va riscritta se c'è ancora, e una volta
// riscritta non c'è più niente da dire. Pura come `verdetto`, e provata allo stesso modo.
export function transitoria(decorrenzaIso, oggi, ancoraScritta){
  const d = giorno(decorrenzaIso);
  if (Number.isNaN(d.getTime())) return 'illeggibile';
  if (oggi < d) return 'prima';
  return ancoraScritta ? 'da riscrivere' : 'a posto';
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
const CASI_PROSA = [
  ['2026-10-31', '2026-09-08', true,  'prima'],          // la frase è ancora vera
  ['2026-10-31', '2026-10-30', true,  'prima'],          // fino al giorno prima
  ['2026-10-31', '2026-10-31', true,  'da riscrivere'],  // il giorno stesso è già «dal»
  ['2026-10-31', '2027-03-01', true,  'da riscrivere'],  // e resta da fare finché c'è
  ['2026-10-31', '2027-03-01', false, 'a posto'],        // tolta, non c'è più niente da dire
  ['non-una-data', '2026-09-08', true, 'illeggibile']
];
let rotti = 0;
for (const [rev, oggi, atteso] of CASI){
  const v = verdetto(rev, giorno(oggi)).stato;
  if (v !== atteso){ rotti++; console.log(`  KO  la guardia stessa: ${rev} al ${oggi} → ${v}, atteso ${atteso}`); }
}
for (const [dec, oggi, scritta, atteso] of CASI_PROSA){
  const v = transitoria(dec, giorno(oggi), scritta);
  if (v !== atteso){ rotti++; console.log(`  KO  la guardia sulla prosa: ${dec} al ${oggi}${scritta ? ', ancora scritta' : ''} → ${v}, atteso ${atteso}`); }
}
console.log(rotti ? `  ✗ la guardia non funziona (${rotti} casi)`
                  : `  ok  la guardia scatta quando deve (${CASI.length + CASI_PROSA.length} casi provati)`);
if (rotti) process.exitCode = 1;

// --- e adesso il verdetto vero ---------------------------------------------
const v = verdetto(REVISIONE_ISO, new Date());
console.log(`  parametri rivisti al ${REVISIONE} (${REVISIONE_ISO})`);

if (v.stato === 'illeggibile'){
  console.log(`  ✗ REVISIONE_ISO non è una data leggibile: «${REVISIONE_ISO}»`);
  process.exitCode = 1;
} else if (v.stato === 'scaduto'){
  // IL 2027 HA UNA RIGA IN PIÙ, e solo lui: il D.Lgs. 19 giugno 2026 n. 117 (testo unico delle
  // imposte sui redditi, GU 3/7/2026) riordina dal 1° gennaio 2027 le norme fiscali che il sito
  // cita — e Normattiva mostra già i vecchi articoli come «abrogati dal D.Lgs. 117/2026» nella
  // versione vigente da quella data. Le cifre non cambiano per questo, le CITAZIONI sì. La riga
  // è condizionata all'anno perché un avviso che resta per sempre insegna a non leggere gli avvisi.
  const citazioni = v.anno === 2027
    ? `
      · LE CITAZIONI      dal 1° gennaio 2027 le norme fiscali richiamate da regole.mjs e dalle
                          pagine cambiano numero: TUIR artt. 10, 11, 13, 16-ter, 19, 51, 67 e
                          L. 207/2024 art. 1 c. 6 stanno nel testo unico delle imposte sui
                          redditi (D.Lgs. 19 giugno 2026 n. 117), così come D.Lgs. 252/2005
                          art. 11 c. 4-ter, 6, 6-bis, 6-ter e art. 17 (artt. 257-259); il 17%
                          sulla rivalutazione del TFR (D.Lgs. 47/2000 art. 11 c. 3) va nel D.Lgs.
                          33/2025 art. 36. Restano dove sono: tetto 5.300 (art. 8 c. 4 D.Lgs.
                          252/2005), somma del cuneo (L. 207/2024 c. 4), trattamento integrativo
                          (D.L. 3/2020), 26% e 12,5% (D.L. 66/2014). Le fonti in regole.mjs
                          portano già il riferimento nuovo accanto al vecchio: si toglie il
                          vecchio. La tavola completa è nel README, sezione del 2026-09-08`
    : `
      · LE CITAZIONI      che ogni articolo richiamato esista ancora su Normattiva con quel
                          numero: un testo unico o una legge di bilancio li spostano`;
  console.log(`
  ✗ SCADUTI. Dal ${REVISIONE} è passato il 1° gennaio ${v.anno}.
    Da riverificare, in quest'ordine:
      · ANNO0             è «l'anno in corso» da cui parte il conto: si porta al ${v.anno}
      · ASSEGNO_SOCIALE   e TRATT_MINIMO, rivalutati ogni gennaio (circolare INPS di dicembre)
      · SCAGLIONI         aliquote IRPEF, se la legge di bilancio le ha toccate
      · TETTO_DEDUZIONE   e QUOTA_ORDINARIA, per la stessa ragione
      · VITA_INTERA       segue la tavola ISTAT dei coefficienti di trasformazione IN VIGORE
                          (decreto biennale): se il decreto è cambiato si riscontra di nuovo
      · SPERANZA_VITA     se è uscita una tavola nuova: si aggiorna INSIEME a MARGINE_RENDITA,
                          o il coefficiente si sposta due volte${citazioni}
    Poi si porta REVISIONE_ISO alla data della verifica.
    Finché non è fatto, quello che il sito pubblica è vecchio di almeno un anno.`);
  process.exitCode = 1;
} else if (v.stato === 'in scadenza'){
  console.log(`  ! fra ${v.giorni} giorni scade: il 1° gennaio ${v.anno} l'assegno sociale`
    + ` viene rivalutato e la legge di bilancio entra in vigore`);
} else {
  console.log(`  ok  correnti fino al 1° gennaio ${v.anno} (fra ${v.giorni} giorni)`);
}

// --- la prosa al futuro sull'erogazione frazionata --------------------------
{
  const SORG = join(QUI, '..', 'sorgenti');
  const dove = readdirSync(SORG).filter(f => f.endsWith('.html'))
    .filter(f => /\{\{frazDal\}\}/.test(readFileSync(join(SORG, f), 'utf8')));
  const t = transitoria(FRAZ_DECORRENZA_ISO, new Date(), dove.length > 0);
  const quando = inItaliano(FRAZ_DECORRENZA_ISO);
  if (t === 'illeggibile'){
    console.log(`  ✗ FRAZ_DECORRENZA_ISO non è una data leggibile: «${FRAZ_DECORRENZA_ISO}»`);
    process.exitCode = 1;
  } else if (t === 'prima'){
    const giorni = Math.ceil((giorno(FRAZ_DECORRENZA_ISO) - new Date()) / 86400000);
    console.log(`  ok  l'erogazione frazionata decorre dal ${quando} (fra ${giorni} giorni):`
      + ` le frasi al futuro in ${dove.join(', ') || 'nessuna pagina'} sono ancora vere`);
  } else if (t === 'da riscrivere'){
    console.log(`
  ✗ PROSA SCADUTA. L'erogazione frazionata si può chiedere dal ${quando}, e la data è passata:
    le frasi che ne parlano al futuro — «si può chiedere dal…», «fino a quella data il fondo
    non la eroga» — vanno tolte da: ${dove.join(', ')}.
    Il criterio è il segnaposto {{frazDal}}: sparito dalle pagine, questa guardia si spegne.
    FRAZ_DECORRENZA resta nella tabella dei parametri come data storica, e va bene così.`);
    process.exitCode = 1;
  } else {
    console.log(`  ok  la decorrenza dell'erogazione frazionata (${quando}) è passata e le pagine`
      + ` non ne parlano più al futuro`);
  }
}

// le cifre che nessuno ha ancora confermato: il build le stampa, ma passa lo stesso
const aperte = daConfermare();
if (aperte.length){
  console.log(`  ! ${aperte.length} cifre non confermate, e sono pubblicate:`);
  for (const r of aperte) console.log(`      · ${r.nome} — ${r.fonte}`);
} else {
  console.log('  ok  nessuna cifra in attesa di conferma');
}
