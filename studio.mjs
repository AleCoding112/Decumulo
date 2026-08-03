// ============================================================================
//  LO STUDIO: le domande di sostanza, fatte al motore.
//
//  NON È UNA VERIFICA, e sta fuori da `verifica.mjs` apposta: non afferma
//  niente e non fallisce mai. Stampa un rapporto da LEGGERE. È il parente di
//  `verifiche/occhi.mjs`, che guarda invece di misurare.
//
//  A COSA SERVE. Il resto del progetto controlla che il conto sia giusto.
//  Questo chiede al conto che cosa ha da dire: conviene vivere in coppia?
//  quante volte rende il fondo rispetto agli investimenti? quanto pesa
//  davvero il comparto? Sono le risposte che rendono il sito citabile, e sono
//  anche il modo più efficace di trovare errori di LOGICA — una griglia che
//  produce un risultato implausibile lo mostra dove nessun test unitario
//  arriva.
//
//  QUANDO RILANCIARLO. A ogni cambio dei parametri (gennaio, legge di
//  bilancio): se una risposta si sposta, o è cambiata la legge o è cambiato
//  qualcosa che non doveva.
//
//  ─────────────────────────────────────────────────────────────────────────
//  LE DUE TRAPPOLE DI LETTURA DI QUESTE TAVOLE, qui già disinnescate.
//  Nessuna delle due è un errore del motore: sono modi di leggerlo male.
//
//  1. UNA DIFFERENZA NON È UN RAPPORTO. `fin(versa di più) − fin(base)` è già
//     il confronto netto con l'alternativa, perché i soldi non versati restano
//     in busta ed entrano nel patrimonio, dove rendono. La soglia è ZERO, non
//     uno. Letta come un rapporto porta a concludere che il fondo pensione non
//     conviene quasi mai, cioè l'opposto del vero.
//
//  2. LA CASA SI CONFRONTA SULLA RICCHEZZA, NON SUL DENARO. Chi non vende
//     possiede ancora l'abitazione, e quella non compare in nessun saldo.
//     È l'errore che `casa-e-decumulo.html` descrive per esteso, e resta facile
//     da rifare: col conto sbagliato «vendere e affittare» conviene già da
//     1.000 € di canone, con quello giusto mai.
//
//  Regola: quando una griglia dà una risposta controintuitiva, il primo
//  sospettato è la metrica, non il modello.
//  ─────────────────────────────────────────────────────────────────────────
//
//  node studio.mjs
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const src = [...fs.readFileSync(join(QUI, 'sito', 'index.html'), 'utf8')
  .matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(t => /function simula\(/.test(t));

let DATI = {};
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, style:{}, dataset:{}, addEventListener(){},
  setAttribute(){}, getAttribute(){ return null; },
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis;
globalThis.document = {body:{classList:{toggle(){}}}, querySelectorAll: () => [],
  // la casella assente è VUOTA, non zero: per il minimo del contratto e per la spesa in
  // pensione «non l'ho scritto» vuol dire un'altra cosa che «ho scritto zero»
  getElementById: id => Object.assign(finto(), {value: String(DATI[id] ?? '')})};
const M = new Function(src + `\nreturn {leggi, simula, spesaSostenibile, contributi, costoAnnuo,
  nettoAnnuo, irpef, irpefNetta, coeffEta, EQUIV_BASSA, EQUIV_ALTA, TETTO_DEDUZIONE, IVS};`)();

const gira = d => { DATI = d; const s = M.leggi(); return {s, r: M.simula(s)}; };
const sost = d => { DATI = d; return M.spesaSostenibile(M.leggi()); };
const fin  = d => gira(d).r.finale;
const eur  = n => Math.round(n).toLocaleString('it-IT', {useGrouping:'always'}) + ' €';
const pc   = (n, d=1) => (n*100).toFixed(d).replace('.', ',') + '%';
const riga = (c, w=20) => '  ' + c.map(s => String(s).padStart(w)).join('');
const linea = (n, w=20) => '  ' + '─'.repeat(n*w);
const titolo = t => console.log(`\n\n╔══ ${t} ` + '═'.repeat(Math.max(4, 74 - t.length)));

const COMUNE = {rend:4, infl:2, rendFondo:3, etaFine:95, nome0:'A', nome1:'B'};
const uno = (o={}) => ({...COMUNE, quanti:'1', nascita0:1975, annoPens0:2042, pcVoi0:1.5,
  pcDat0:2, iscr0:2005, tfrDove0:'fondo', quotaCap0:0.5,
  tfrGia0:'', annoLav0:'', tfrGia1:'', annoLav1:'',
  forma0:'vita', ...o});
const due = (o={}) => ({...COMUNE, quanti:'2', nascita0:1975, nascita1:1977, annoPens0:2042,
  annoPens1:2044, pcVoi0:1.5, pcVoi1:1.5, pcDat0:2, pcDat1:2, iscr0:2005, iscr1:2007,
  tfrDove0:'fondo', tfrDove1:'fondo',
  quotaCap0:0.5, quotaCap1:0.5, forma0:'vita', forma1:'vita', ...o});
// LA PENSIONE ATTESA NON È UN DATO DEL MODELLO, è un ingrediente di queste griglie: serve solo
// a rendere confrontabili le righe fra loro. Regola grezza e DICHIARATA — 70% del lordo, il
// tasso di sostituzione che la Ragioneria pubblica per una carriera piena nel contributivo.
const pensioneDa = ral => Math.round(ral * 0.70 / 12);
const RALS = [18000, 25000, 32000, 38000, 45000, 60000, 90000, 150000];
const P = uno({ral0:38000, pens0:pensioneDa(38000), cl3:200000, spesa:2200, fondo0:80000});
// il rendimento del patrimonio a cui due varianti si pareggiano, per bisezione
const sogliaF = (fa, fb, lo=-2, hi=15) => {
  const f = r => fa(r) - fb(r);
  if (f(lo) * f(hi) > 0) return null;
  for (let k=0;k<60;k++){ const m=(lo+hi)/2; (f(lo)*f(m) <= 0 ? hi = m : lo = m); }
  return (lo+hi)/2;
};
const reale = n => (1 + n/100) / 1.02 - 1;

// ============================================================================
titolo('1. COPPIA O DA SOLI');
console.log('\n  Due persone identiche, stessa età e stessa data di pensione, con lo stesso');
console.log('  reddito e lo stesso patrimonio a testa.\n');
console.log(riga(['RAL a testa','in due','da sola','rapporto']));
console.log(linea(4));
const rapporti = [];
for (const ral of [15000, ...RALS]){
  const p = pensioneDa(ral), W = 100000, F = 60000;
  const c = sost(due({nascita1:1975, annoPens1:2042, iscr1:2005, ral0:ral, ral1:ral,
    pens0:p, pens1:p, cl3:W*2, spesa:2000, fondo0:F, fondo1:F}));
  const s = sost(uno({ral0:ral, pens0:p, cl3:W, spesa:1500, fondo0:F}));
  rapporti.push(c/s);
  console.log(riga([eur(ral), eur(c)+'/mese', eur(s)+'/mese', (c/s).toFixed(4)]));
}
console.log(`\n  Rapporto da ${Math.min(...rapporti).toFixed(4)} a ${Math.max(...rapporti).toFixed(4)}: due insieme sostengono ESATTAMENTE`);
console.log('  il doppio di una sola, a ogni reddito. Il fisco italiano è neutrale rispetto alla');
console.log('  convivenza — nessun quoziente familiare, IRPEF e detrazioni sono individuali.');
console.log(`\n  Il vantaggio della coppia è quindi tutto e solo la condivisione delle spese, e vale`);
console.log(`  +${pc(2*M.EQUIV_BASSA-1,0)}–${pc(2*M.EQUIV_ALTA-1,0)} di tenore di vita: le scale di equivalenza dicono che una persona`);
console.log(`  sola spende fra il ${pc(M.EQUIV_BASSA,0)} e il ${pc(M.EQUIV_ALTA,1)} di quanto spende una coppia.`);
console.log('\n  LIMITE DEL MODELLO, emerso qui: il calcolatore NON rappresenta il risparmio della');
console.log('  convivenza. La scala di equivalenza vive solo nello scenario del superstite; la');
console.log('  spesa la scrive chi compila. Non è un errore, è un confine.');

// ============================================================================
titolo('2. FONDO PENSIONE O INVESTIMENTI PERSONALI');
const prova = (o, dpc = 1) => {
  const base = uno({cl3:150000, spesa:2000, fondo0:60000, ...o});
  const x = gira(base).s.p[0];
  const costo = M.costoAnnuo(x, +base.pcVoi0 + dpc);
  const entra = M.contributi(x, +base.pcVoi0 + dpc).tot - M.contributi(x, +base.pcVoi0).tot;
  const anni  = Math.max(1, x.ultimo - 2026 + 1);
  const d = fin({...base, pcVoi0: (+base.pcVoi0) + dpc}) - fin(base);
  return {costo, entra, subito: costo > 0 ? entra/costo : Infinity,
          reso: costo > 0 ? d / (costo * anni) : Infinity};
};
console.log('\n  Un punto di RAL in più nel fondo invece che in tasca. Il confronto è già dentro');
console.log('  il conto: quello che non si versa entra nel patrimonio e rende. SOPRA ZERO VINCE');
console.log('  IL FONDO (vedi la trappola n.1 in testa al file).\n');
console.log(riga(['RAL','costa netto','entra','subito','guadagno per €']));
console.log(linea(5));
for (const ral of RALS){
  const p = prova({ral0:ral, pens0:pensioneDa(ral)});
  console.log(riga([eur(ral), eur(p.costo), eur(p.entra), p.subito.toFixed(2)+'×',
    (p.reso>=0?'+':'')+p.reso.toFixed(2)+' €']));
}
console.log('\n  A 150.000 € il fondo PERDE, ed è l\'unico caso: la quota del datore ha già');
console.log('  consumato quasi tutto il tetto, quindi il versamento in più non è deducibile.\n');
console.log('  E IL RENDIMENTO DEL COMPARTO CONTA MENO DI QUANTO SEMBRI — RAL 38.000 €:\n');
console.log(riga(['comparto','patrimonio','guadagno per €']));
console.log(linea(3));
for (const rf of [1, 2, 3, 4, 5, 6]){
  const p = prova({ral0:38000, pens0:pensioneDa(38000), rendFondo:rf});
  console.log(riga([pc(rf/100,1), pc(0.04,1), (p.reso>=0?'+':'')+p.reso.toFixed(2)+' €']));
}
console.log('\n  Il fondo vince perfino rendendo TRE PUNTI IN MENO del patrimonio: la deduzione');
console.log('  domina il rendimento.\n');
console.log('  IL SALTO DEL PRIMO EURO — chi versa zero e comincia col minimo contrattuale.');
console.log('  Qui la quota del datore scatta, e non è un versamento in più: è denaro nuovo.\n');
console.log(riga(['RAL','costa netto','entra','per ogni €']));
console.log(linea(4));
for (const ral of RALS){
  const base = uno({ral0:ral, pens0:pensioneDa(ral), cl3:150000, spesa:2000, fondo0:60000,
                    pcVoi0:0, pcMin0:1.2, pcDat0:2});
  const x = gira(base).s.p[0];
  const costo = M.costoAnnuo(x, 1.2), entra = M.contributi(x, 1.2).tot;
  console.log(riga([eur(ral), eur(costo), eur(entra), (entra/costo).toFixed(2)+'×']));
}

// ============================================================================
titolo('3. IL TFR: NEL FONDO O IN AZIENDA');
console.log('\n  RAL 38.000 €. Si cambia solo dove va il TFR.\n');
console.log(riga(['comparto','nel fondo','in azienda','differenza']));
console.log(linea(4));
for (const rf of [1,2,3,4,5,6]){
  const f = fin({...P, rendFondo:rf, tfrDove0:'fondo'});
  const a = fin({...P, rendFondo:rf, tfrDove0:'azienda'});
  console.log(riga([pc(rf/100,1), eur(f), eur(a), (f>a?'+':'')+eur(f-a)]));
}
console.log('\n  Il pareggio sta intorno al 2,3%: in azienda il TFR si rivaluta dell\'1,5% più il');
console.log('  75% dell\'inflazione, meno il 17% d\'imposta — 2,49% netto con inflazione al 2%.');

// ============================================================================
titolo('4. CAPITALE O RENDITA, per età');
console.log('\n  Tutto in contanti contro tutto in rendita, a parità di ogni altra cosa.\n');
console.log(riga(['età','coefficiente','anni di pareggio','la rendita vince sotto'], 22));
console.log(linea(4, 22));
for (const eta of [60, 62, 65, 67, 70, 72]){
  const nasc = 1975, ap = nasc + eta;
  const b = {...P, nascita0:nasc, annoPens0:ap, ultimo0:ap-1, pens0:pensioneDa(38000)};
  const s = sogliaF(r => fin({...b, quotaCap0:1, rend:r}), r => fin({...b, quotaCap0:0, rend:r}));
  const co = M.coeffEta(eta);
  console.log(riga([eta+' anni', pc(co,2), (1/co).toFixed(1)+' anni',
    s===null?'mai':pc(reale(s),2)+' reale'], 22));
}
console.log('\n  L\'ipotesi in uso è +1,96% reale: molto sopra ogni soglia. La rendita non si compra');
console.log('  per il rendimento, si compra per la protezione — che questo conto non misura.');

// ============================================================================
titolo('5. VENDERE CASA E ANDARE IN AFFITTO');
console.log('\n  Casa da 300.000 €, venduta a 70 anni. Le due colonne sono lo stesso confronto');
console.log('  fatto bene e fatto male: la differenza misura quanto inganna il conto naturale.\n');
console.log(riga(['canone','soglia sul DENARO','soglia sulla RICCHEZZA','verdetto'], 23));
console.log(linea(4, 23));
const CASA = {...P, nascita0:1962, annoPens0:2029, ultimo0:2028, pens0:pensioneDa(38000), cl3:150000};
for (const can of [600, 800, 1000, 1200, 1500]){
  const vendi = r => fin({...CASA, rend:r, casaCosa:'affitto', casaAnno:2032,
                          casaValore:300000, casaCanone:can});
  const soldi = r => fin({...CASA, rend:r, casaCosa:'resto'});
  const sD = sogliaF(vendi, soldi), sR = sogliaF(vendi, r => soldi(r) + 300000);
  console.log(riga([eur(can)+'/mese', sD===null?'sempre vendere':pc(reale(sD),2),
    sR===null?'mai vendere':pc(reale(sR),2), (sR!==null && 4 > sR) ? 'vendere' : 'restare'], 23));
}

// ============================================================================
titolo('6. QUANTO COSTA SMETTERE PRIMA');
console.log('\n  RAL 38.000 €, pensione a 67 nel 2042. Si anticipa solo la fine del lavoro.\n');
console.log(riga(['ultimo anno','anticipo','patrimonio finale','costo per anno']));
console.log(linea(4));
const b6 = {...P, nascita0:1975, annoPens0:2042, pens0:pensioneDa(38000)};
const rif = fin({...b6, ultimo0:2041});
for (const u of [2041, 2039, 2037, 2035, 2032]){
  const f = fin({...b6, ultimo0:u}), n = 2041 - u;
  console.log(riga([u, n===0?'—':n+' anni', eur(f), n===0?'—':eur((f-rif)/n)]));
}

// ============================================================================
titolo('7. QUANTO PESANO LE IPOTESI');
console.log('\n  Lo stesso piano, cambiando una sola ipotesi per volta.\n');
console.log(riga(['ipotesi','valore','patrimonio finale','scarto'], 22));
console.log(linea(4, 22));
const base7 = fin(b6);
for (const [nome, vals, f, fv] of [
  ['inflazione', [1,2,3,4], v => ({...b6, infl:v}), v => pc(v/100,1)],
  ['rendim. patrimonio', [2,3,4,5,6], v => ({...b6, rend:v}), v => pc(v/100,1)],
  ['rendim. fondo', [1,2,3,4,5], v => ({...b6, rendFondo:v}), v => pc(v/100,1)],
  ['orizzonte', [85,90,95,100], v => ({...b6, etaFine:v}), v => v+' anni']]){
  for (const v of vals){
    const y = fin(f(v));
    console.log(riga([nome, fv(v), eur(y), (y>=base7?'+':'')+eur(y-base7)], 22));
  }
  console.log('  ' + '·'.repeat(88));
}
console.log('\n  Il rendimento del patrimonio e l\'inflazione pesano OTTO VOLTE più del comparto.');
console.log('  Chi passa ore a scegliere il comparto e scrive il rendimento del patrimonio a');
console.log('  caso sta ottimizzando la variabile sbagliata.');

// ============================================================================
titolo('8. IL CONTRIBUTO DEL DATORE, SU UNA CARRIERA');
console.log('\n  Chi versa il minimo e prende la quota aziendale, contro chi ha aderito col solo');
console.log('  TFR. Stessa persona, stesso stipendio.\n');
console.log(riga(['RAL','quota','anni','mai versata','patrimonio in più']));
console.log(linea(5));
for (const ral of [18000, 25000, 32000, 38000, 45000, 60000]){
  const con = {...P, ral0:ral, pens0:pensioneDa(ral), pcVoi0:1.2, pcMin0:1.2, pcDat0:2};
  const x = gira(con).s.p[0];
  const quota = M.contributi(x, 1.2).dat, anni = x.ultimo - 2026 + 1;
  console.log(riga([eur(ral), eur(quota), anni, eur(quota*anni),
    '+'+eur(fin(con) - fin({...con, pcVoi0:0}))]));
}

// ============================================================================
titolo('9. IL TETTO DI 5.300 €: quando morde');
console.log('\n  La quota del datore consuma il tetto pur non passando dalla busta.\n');
console.log(riga(['RAL','quota datore','tetto residuo','% max deducibile']));
console.log(linea(4));
for (const ral of RALS){
  const x = gira({...P, ral0:ral, pens0:pensioneDa(ral)}).s.p[0];
  const dat = M.contributi(x, 2).dat, resto = Math.max(0, M.TETTO_DEDUZIONE - dat);
  console.log(riga([eur(ral), eur(dat), eur(resto), pc(resto/ral,1)]));
}
console.log('\n  A 150.000 € restano 2.300 € deducibili, l\'1,5% della retribuzione: il tetto morde');
console.log('  molto prima di quanto la percentuale suggerisca.\n');
