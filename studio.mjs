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
// I NUMERI SI SCRIVONO COME LI SCRIVE CHI COMPILA, cioè con la VIRGOLA. `String(4.375)` dà
// «4.375», e il parser della pagina — che è italiano, e fa bene — lo legge come QUATTROMILA
// TRECENTOSETTANTACINQUE, perché `^-?[1-9]\d{0,2}(\.\d{3})+$` è esattamente il formato delle
// migliaia. Non è un difetto del calcolatore: un utente vero scrive «4,375» e ottiene 4,375.
// Era un difetto di QUESTA SONDA, e mordeva in un punto solo ma decisivo: i punti intermedi
// della bisezione di `sogliaF`. Metà di [-2, 15] cade su valori a tre decimali — 4.375, 3.125,
// 2.625 — che venivano letti come rendimenti a quattro cifre, e la ricerca si fermava lì
// restituendo un numero tondo e falso. Le soglie sbagliate erano indistinguibili da quelle
// giuste: nessun controllo le guardava, perché questo file non afferma niente.
const comeSiScrive = v =>
  typeof v === 'number' && Number.isFinite(v) ? String(v).replace('.', ',') : String(v ?? '');
globalThis.document = {body:{classList:{toggle(){}}}, querySelectorAll: () => [],
  // la casella assente è VUOTA, non zero: per il minimo del contratto e per la spesa in
  // pensione «non l'ho scritto» vuol dire un'altra cosa che «ho scritto zero»
  getElementById: id => Object.assign(finto(), {value: comeSiScrive(DATI[id])})};
const M = new Function(src + `\nreturn {leggi, simula, spesaSostenibile, contributi, costoAnnuo,
  nettoAnnuo, irpef, irpefNetta, coeffEta, EQUIV_BASSA, EQUIV_ALTA, TETTO_DEDUZIONE, IVS,
  CLASSI, COMPARTI};`)();

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

// ============================================================================
titolo('10. IN DUE, ENTRAMBI AL MASSIMO DEDUCIBILE: dove sta il pareggio');
console.log('\n  LA DOMANDA. Una coppia versa nel fondo tutto quello che può dedurre. L\'alternativa');
console.log('  non è «non versare», che nessuno fa: è versare la QUOTA MINIMA del contratto —');
console.log('  quella che fa scattare il datore, e a cui non si rinuncia — e mettere il resto');
console.log('  nel proprio patrimonio. A quale rendimento del patrimonio le due strade pareggiano?');
console.log('\n  Il confronto è già dentro il conto: quello che non si versa resta in busta ed entra');
console.log('  nel patrimonio, dove rende. Sopra la soglia conviene il patrimonio, sotto il fondo.');

// il massimo deducibile è quello che resta del tetto TOLTA la quota del datore, che lo consuma
// pur non passando dalla busta paga (art. 8 c. 4: il limite è per persona e comprende entrambi)
const alTetto = base => {
  const s = gira(base).s, o = {...base};
  s.indici.forEach(i => {
    const x = s.p[i];
    o['pcVoi'+i] = Math.max(0, (M.TETTO_DEDUZIONE - M.contributi(x, x.pcVoi).dat) / x.ral * 100);
  });
  return o;
};
// la coppia di partenza: due carriere simili, minimo contrattuale all'1,2% (che è dove la quota
// del datore scatta), patrimonio e spesa scelti perché il piano regga senza toccare i confini
const COPPIA = ral => due({ral0:ral, ral1:ral, pens0:pensioneDa(ral), pens1:pensioneDa(ral),
  pcVoi0:1.2, pcVoi1:1.2, pcMin0:1.2, pcMin1:1.2, pcDat0:2, pcDat1:2,
  fondo0:60000, fondo1:60000, cl3:250000, spesa:3000});

console.log('\n  Coppia, stessa RAL a testa, pensione al 70% del lordo, 25 anni al traguardo.');
console.log('  Le due colonne di mezzo sono ENTRAMBE incrementali — quanto si versa IN PIÙ del');
console.log('  minimo, e quanto costa IN PIÙ di tasca — o il rapporto fra loro non direbbe niente.\n');
console.log(riga(['RAL a testa','al tetto','in più','costa in più','per ogni €','pareggio','reale'], 15));
console.log(linea(7, 15));
const soglie = [];
for (const ral of [25000, 32000, 38000, 45000, 60000, 90000]){
  const base = COPPIA(ral), max = alTetto(base);
  const x = gira(base).s.p[0];
  const versa  = M.contributi(x, +max.pcVoi0).lav;
  const inPiu  = versa - M.contributi(x, 1.2).lav;
  const costo  = M.costoAnnuo(x, +max.pcVoi0) - M.costoAnnuo(x, 1.2);
  const s = sogliaF(r => fin({...max, rend:r}), r => fin({...base, rend:r}));
  if (s !== null) soglie.push(s);
  console.log(riga([eur(ral), eur(versa), eur(inPiu), eur(costo),
    (inPiu/costo).toFixed(2)+'×',
    s === null ? 'mai' : pc(s/100, 2), s === null ? '—' : pc(reale(s), 2)], 15));
}
console.log('\n  L\'IPOTESI IN USO è il 4% nominale, cioè +1,96% reale con inflazione al 2%.');
if (soglie.length){
  console.log(`  Le soglie stanno fra ${pc(Math.min(...soglie)/100,2)} e ${pc(Math.max(...soglie)/100,2)} nominale `
    + `(${pc(reale(Math.min(...soglie)),2)} – ${pc(reale(Math.max(...soglie)),2)} reale), quindi`);
  console.log(`  SOPRA l'ipotesi in ogni riga: al massimo deducibile il fondo vince a tutti i redditi,`);
  console.log(`  e il patrimonio dovrebbe rendere almeno ${pc(Math.min(...soglie)/100,1)} nominale per pareggiarlo.`);
}
console.log('\n  LA SOGLIA NON CRESCE COL REDDITO, e questa è la cosa che non ci si aspetta: sale');
console.log('  fino a 45.000 € e poi ridiscende. Due forze opposte — l\'aliquota marginale risparmiata');
console.log('  sale col reddito, ma la quota del datore consuma il tetto in valore assoluto, quindi');
console.log('  quanto si può ancora dedurre SCENDE. Il punto migliore è dove le due si incrociano.');

console.log('\n\n  QUANTO CONTA IL RENDIMENTO DEL COMPARTO. RAL 38.000 € a testa: si sposta il');
console.log('  rendimento del FONDO e si guarda dove va la soglia del PATRIMONIO.\n');
console.log(riga(['comparto del fondo','pareggio nominale','pareggio reale','distanza dal 4%'], 21));
console.log(linea(4, 21));
for (const rf of [1, 2, 3, 4, 5, 6, 7]){
  const base = {...COPPIA(38000), rendFondo:rf}, max = alTetto(base);
  const s = sogliaF(r => fin({...max, rend:r}), r => fin({...base, rend:r}));
  console.log(riga([pc(rf/100,1), s === null ? 'mai' : pc(s/100,2),
    s === null ? '—' : pc(reale(s),2),
    s === null ? 'il fondo vince sempre' : (s>4?'+':'') + (s-4).toFixed(2).replace('.',',') + ' punti'], 21));
}

console.log('\n\n  QUANTO CONTA IL TEMPO. RAL 38.000 € a testa, comparto al 3%: si sposta l\'età alla');
console.log('  pensione, cioè quanti anni la deduzione ha per lavorare.\n');
console.log(riga(['anni al traguardo','versa in tutto','pareggio nominale','pareggio reale'], 21));
console.log(linea(4, 21));
for (const eta of [50, 55, 60, 65, 67]){
  const ap = 1975 + eta, anni = ap - 2026;
  if (anni < 2) continue;
  const base = {...COPPIA(38000), nascita0:1975, nascita1:1975, annoPens0:ap, annoPens1:ap,
                rita0:ap, rita1:ap};
  const max = alTetto(base);
  const x = gira(base).s.p[0];
  const versa = M.contributi(x, +max.pcVoi0).lav * anni * 2;
  const s = sogliaF(r => fin({...max, rend:r}), r => fin({...base, rend:r}));
  console.log(riga([anni + ' anni', eur(versa), s === null ? 'mai' : pc(s/100,2),
    s === null ? '—' : pc(reale(s),2)], 21));
}

// ============================================================================
titolo('11. FONDO AZIONARIO CONTRO 75/25 DI ETF E CONTI DEPOSITO');

// I RENDIMENTI NON SI SCRIVONO QUI: si prendono dal listino del modello, o questa sezione
// direbbe una cosa e il calcolatore un'altra al primo aggiornamento delle convenzioni.
const [, R_DEP] = M.CLASSI[1];        // conti deposito, netto nominale
const [, R_ETF] = M.CLASSI[3];        // azioni ed ETF, netto nominale
const R_AZIONARIO = M.COMPARTI[3][1]; // comparto azionario del fondo
// il divario fra la classe libera e il comparto corrispondente: sono lo stesso attivo, e il
// fondo sconta in più i costi di gestione. Serve per muoverli INSIEME nelle ipotesi.
const COSTO_FONDO = R_ETF - R_AZIONARIO;
const mix = q => q * R_ETF + (1 - q) * R_DEP;   // q = quota in ETF, il resto in conti deposito

console.log('\n  LE DUE STRATEGIE, a parità di tutto il resto:');
console.log(`  · FONDO   — si versa fino al massimo deducibile, comparto azionario ${pc(R_AZIONARIO,1)} netto;`);
console.log('  · FUORI   — si versa la sola quota minima del contratto (a cui non si rinuncia,');
console.log(`              perché fa scattare il datore) e il resto resta nel portafoglio.`);
console.log(`\n  IL PORTAFOGLIO È LO STESSO NELLE DUE STRATEGIE — 75% azioni ed ETF (${pc(R_ETF,1)}) e`);
console.log(`  25% conti deposito (${pc(R_DEP,1)}), cioè ${pc(mix(0.75),3)} netto nominale. Cambia solo QUANTO`);
console.log('  passa dal fondo. Le cifre vengono dal listino di `regole.mjs`, non da qui.');
console.log(`\n  Il fondo azionario rende ${pc(R_AZIONARIO,1)} contro ${pc(mix(0.75),3)} del 75/25: parte`);
console.log(`  ${pc(R_AZIONARIO - mix(0.75),3)} avanti sul rendimento, e in più c'è la deduzione.`);

const COPPIA75 = (ral, o={}) => {
  const tot = 250000;
  return due({ral0:ral, ral1:ral, pens0:pensioneDa(ral), pens1:pensioneDa(ral),
    pcVoi0:1.2, pcVoi1:1.2, pcMin0:1.2, pcMin1:1.2, pcDat0:2, pcDat1:2,
    fondo0:60000, fondo1:60000, spesa:3000,
    // il patrimonio è 75/25 PER DAVVERO, non solo nel rendimento medio: le classi decidono
    // il totale, e il rendimento medio si passa a parte perché nella pagina lo scrive un
    // ascoltatore del DOM che qui non c'è
    cl1: tot*0.25, cl3: tot*0.75, rend: mix(0.75)*100, rendFondo: R_AZIONARIO*100, ...o});
};

console.log('\n\n  A. QUANTO LASCIA IN PIÙ IL FONDO, a ogni reddito. 25 anni al traguardo.\n');
console.log(riga(['RAL a testa','fuori','col fondo','in più','in % del piano'], 18));
console.log(linea(5, 18));
for (const ral of [25000, 32000, 38000, 45000, 60000, 90000]){
  const base = COPPIA75(ral), max = alTetto(base);
  const a = fin(base), b = fin(max);
  console.log(riga([eur(ral), eur(a), eur(b), (b>a?'+':'')+eur(b-a),
    ((b-a)/a>=0?'+':'')+pc((b-a)/a, 1)], 18));
}

console.log('\n\n  B. E SE LA MISCELA FOSSE DIVERSA. RAL 38.000 € a testa: si sposta la quota in');
console.log('  azioni ed ETF, il resto in conti deposito. Il fondo resta azionario.\n');
console.log(riga(['portafoglio','rende netto','in più col fondo','in % del piano'], 20));
console.log(linea(4, 20));
for (const q of [0, 0.25, 0.5, 0.75, 0.9, 1]){
  const base = COPPIA75(38000, {rend: mix(q)*100, cl1: 250000*(1-q), cl3: 250000*q});
  const max = alTetto(base);
  const a = fin(base), b = fin(max);
  console.log(riga([`${Math.round(q*100)}/${Math.round((1-q)*100)}`, pc(mix(q),3),
    (b>a?'+':'')+eur(b-a), ((b-a)/a>=0?'+':'')+pc((b-a)/a,1)], 20));
}
console.log('\n  Più azioni ci sono fuori, meno serve il fondo — ma il verso non si rovescia:');
console.log('  nemmeno un portafoglio tutto azionario recupera la deduzione.');

console.log('\n\n  C. E SE L\'AZIONARIO NON RENDESSE IL 7% LORDO. Qui si muovono INSIEME l\'ETF e il');
console.log('  comparto del fondo, perché sono lo stesso attivo: il fondo sconta in più i costi');
console.log(`  di gestione, ${pc(COSTO_FONDO,1)} sul gradino azionario. Muoverne uno solo sarebbe barare.\n`);
console.log(riga(['azioni, lordo','ETF netto','fondo azionario','75/25 netto','in più col fondo'], 17));
console.log(linea(5, 17));
for (const g of [0.03, 0.05, 0.07, 0.09, 0.11]){
  const etf = g * 0.80 - 0.002;            // 20% effettivo al realizzo, meno il bollo
  const fondo = etf - COSTO_FONDO;
  const rend75 = 0.75*etf + 0.25*R_DEP;
  const base = COPPIA75(38000, {rend: rend75*100, rendFondo: fondo*100});
  const max = alTetto(base);
  const a = fin(base), b = fin(max);
  console.log(riga([pc(g,0), pc(etf,2), pc(fondo,2), pc(rend75,2),
    (b>a?'+':'')+eur(b-a)], 17));
}

console.log('\n\n  D. IL TEMPO. RAL 38.000 €, portafoglio 75/25, fondo azionario.\n');
console.log(riga(['anni al traguardo','fuori','col fondo','in più','in % del piano'], 18));
console.log(linea(5, 18));
for (const eta of [50, 55, 60, 65, 67]){
  const ap = 1975 + eta, anni = ap - 2026;
  if (anni < 2) continue;
  const base = COPPIA75(38000, {nascita0:1975, nascita1:1975, annoPens0:ap, annoPens1:ap,
                                rita0:ap, rita1:ap});
  const max = alTetto(base);
  const a = fin(base), b = fin(max);
  console.log(riga([anni+' anni', eur(a), eur(b), (b>a?'+':'')+eur(b-a),
    ((b-a)/a>=0?'+':'')+pc((b-a)/a,1)], 18));
}

console.log('\n  E RECONCILIAZIONE COL PAREGGIO DELLA SEZIONE 10, che sembra dire il contrario:');
console.log('  là la SOGLIA è più alta con pochi anni, qui il VANTAGGIO è più basso. Sono vere');
console.log('  tutte e due e non si contraddicono — con pochi anni in gioco c\'è poco denaro,');
console.log('  quindi il guadagno assoluto è piccolo, ma il portafoglio ha così poco tempo per');
console.log('  capitalizzare che gli servirebbe un rendimento altissimo per recuperare la');
console.log('  deduzione. Poco in palio, e difficilissimo da riprendere.');

console.log('\n\n  E. COME SI PRENDE IL FONDO, e da quanto si è iscritti. RAL 38.000 €.');
console.log('  L\'aliquota sulla prestazione scende dal 15% al 9%, di 0,30 punti l\'anno oltre il');
console.log('  quindicesimo: chi è iscritto da poco paga di più all\'uscita.');
console.log('\n  ATTENZIONE ALL\'ULTIMA COLONNA: non è «tutto in capitale», è IL MASSIMO CONSENTITO.');
console.log('  Sopra la soglia dei montanti contenuti la legge ne ammette la metà, e chiederne di');
console.log('  più non cambia niente — a questi montanti chiedere il 100% dà esattamente il 50%.\n');
console.log(riga(['iscritto dal','tutta rendita','25% in capitale','il massimo (50%)'], 20));
console.log(linea(4, 20));
for (const anno of [2022, 2015, 2010, 2000]){
  const r = [];
  for (const qc of [0, 0.25, 0.5]){
    const base = COPPIA75(38000, {iscr0:anno, iscr1:anno, quotaCap0:qc, quotaCap1:qc});
    r.push(fin(alTetto(base)) - fin(base));
  }
  console.log(riga([anno, ...r.map(v => (v>0?'+':'')+eur(v))], 20));
}
console.log('\n  Chi si è iscritto da poco guadagna comunque, solo un po\' meno: fra il 2022 e il');
console.log('  2000 ballano sei punti di aliquota, che su questo caso valgono meno di 10.000 €.');
console.log('  L\'anzianità conta, ma non è lei a decidere se versare.');

console.log('\n\n  F. DOVE VINCE IL PORTAFOGLIO. Si cerca il caso contrario invece di aspettare');
console.log('  che si presenti, ed è la domanda più utile di tutta la sezione.');
console.log('\n  PRIMO: alzando i rendimenti azionari NON succede mai. Muovendo insieme l\'ETF e il');
console.log('  comparto — che sono lo stesso attivo — il fondo tiene il suo vantaggio a qualunque');
console.log('  livello, e la tavola C lo mostra: dal 3% all\'11% lordo il distacco non si riduce,');
console.log('  cresce. Il rendimento non è la leva che rovescia il confronto.');
console.log('\n  SECONDO, e qui la risposta c\'è: il fondo perde se il SUO comparto rende meno del');
console.log('  portafoglio. Quanto peggio può fare prima di perdere? Gli ETF restano al listino');
console.log(`  (${pc(R_ETF,1)} netto), e si abbassa il comparto finché le due strade pareggiano.\n`);
// SOTTO O SOPRA VANNO SCRITTI A PAROLE, non con un segno: «−-0,04» è quello che esce da una
// sottrazione firmata due volte, e nasconde proprio il caso interessante — i redditi in cui il
// comparto deve stare SOPRA il portafoglio, cioè quelli in cui la deduzione non regala niente.
const daPareggio = m => (m >= 0 ? m : -m).toFixed(2).replace('.', ',')
  + ' pt ' + (m >= 0 ? 'sotto' : 'SOPRA');
console.log(riga(['RAL a testa','pareggio','sotto il 5,0%','sul 75/25 può stare'], 21));
console.log(linea(4, 21));
const margini = [];
for (const ral of [25000, 32000, 38000, 45000, 60000, 90000]){
  // IL COMPARTO SI ABBASSA PER TUTT'E DUE I RAMI, e questa riga prima era sbagliata: lo
  // abbassava solo per chi versa al tetto, lasciando all'altro il 5,0% sui 120.000 € che ha
  // già nel fondo. Il confronto era truccato in favore del non versare, e il margine ne usciva
  // molto più stretto del vero. Un comparto è del fondo, non della strategia.
  const conRf = f => { const b = COPPIA75(ral, {rendFondo:f}); return {b, m: alTetto(b)}; };
  const s = sogliaF(f => fin(conRf(f).m), f => fin(conRf(f).b), -5, 15);
  if (s !== null) margini.push(mix(0.75)*100 - s);
  console.log(riga([eur(ral),
    s === null ? 'mai' : pc(s/100, 2),
    s === null ? '—' : (R_AZIONARIO*100 - s).toFixed(2).replace('.',',') + ' pt',
    s === null ? '—' : daPareggio(mix(0.75)*100 - s)], 21));
}
console.log('\n  L\'ULTIMA COLONNA È LA RISPOSTA: quanto vale la deduzione, tradotta in rendimento');
console.log('  annuo del comparto.');
if (margini.length){
  console.log(`  · il margine va da ${Math.min(...margini).toFixed(2).replace('.',',')} a ${Math.max(...margini).toFixed(2).replace('.',',')} punti, ed è sempre dalla stessa parte: il comparto`);
  console.log('    può rendere MOLTO meno del portafoglio e il fondo vince lo stesso;');
  console.log('  · il più stretto è ai redditi bassi (25.000 €), dove l\'aliquota marginale');
  console.log('    risparmiata è solo il 23% e la deduzione vale poco;');
  console.log('  · nel mezzo (38.000–45.000 €) il comparto può perfino rendere ZERO, o perdere');
  console.log('    denaro, e la deduzione basta ancora a coprirlo.');
}
console.log('\n  QUESTA TAVOLA È STATA SBAGLIATA PRIMA, e vale la pena dire come: si abbassava il');
console.log('  comparto SOLO al ramo che versa al tetto, lasciando all\'altro il 5,0% sui 120.000 €');
console.log('  che ha comunque nel fondo. Un comparto però è del FONDO, non della strategia: chi');
console.log('  versa il minimo ce l\'ha uguale. Col confronto truccato il margine usciva di mezzo');
console.log('  punto invece che di tre, cioè sei volte più stretto — e la conclusione si rovesciava');
console.log('  su ogni fondo un po\' caro. Un errore che nessun controllo poteva vedere, perché qui');
console.log('  non si afferma niente: si stampa.');
console.log('\n  È QUESTO il margine di sicurezza vero: non «quanto rendono le azioni», ma quanto');
console.log('  male può andare il comparto scelto prima che la deduzione non basti più a coprirlo.');
console.log('  Un fondo caro o mal gestito è il rischio che conta, non il mercato.');
console.log('\n  PERCHÉ NON CONTRADDICE LA SEZIONE 10, dove il margine sembrava di tre punti buoni.');
console.log('  Là si alzava il rendimento del PATRIMONIO, che è un pentolone: muove anche i');
console.log('  250.000 € che la coppia ha già, e li muove per tutt\'e due le strategie. Qui si');
console.log('  abbassa il rendimento del FONDO, che tocca solo quello che ci è passato dentro.');
console.log('  Stessa domanda, leve di taglia diversa: sono due risposte giuste e non comparabili.');
console.log('\n  QUELLO CHE QUESTO CONTO NON PREZZA, e va detto perché pesa nella scelta vera: i');
console.log('  soldi nel fondo sono VINCOLATI fino alla pensione, salvo i casi di anticipazione;');
console.log('  quelli nel 75/25 si possono spendere domani. Il confronto qui è solo patrimoniale.');

// ============================================================================
titolo('12. TIRARE FUORI IL FONDO PRESTO, E INVESTIRLO AL 90% IN ETF');
console.log('\n  LA DOMANDA. Una coppia si fa dare dal fondo più soldi possibile il prima possibile');
console.log('  — RITA, capitale alla pensione, erogazione a rate invece della rendita vitalizia —');
console.log('  e li mette in un portafoglio 90/10. A fine vita ha più o meno patrimonio?');

const R_9010 = 0.90*R_ETF + 0.10*R_DEP;
console.log(`\n  PORTAFOGLIO 90/10: ${pc(R_9010,3)} netto nominale, contro il ${pc(R_AZIONARIO,1)} del comparto`);
console.log('  azionario. Fuori si rende DI PIÙ, ed è metà della ragione per tirare fuori i soldi.');

console.log('\n  LE ALIQUOTE D\'USCITA NON SONO TUTTE UGUALI, e questa è la trappola della domanda:');
console.log('  · RITA, capitale e «durata definita» → 15% che scende al 9% (art. 11 c. 6);');
console.log('  · erogazione FRAZIONATA               → 20% che scende al 15% (art. 11 c. 3-bis).');
console.log('  Il modo più veloce di svuotare il fondo è anche quello che paga cinque punti in più:');
console.log('  «tassazione agevolata» non vuol dire una sola aliquota.');

// LA RITA RICHIEDE LA CESSAZIONE DELL'ATTIVITÀ (art. 11 c. 4). Chiederla senza smettere di
// lavorare sarebbe modellare una cosa che la legge non permette, quindi qui chi la prende
// smette davvero — e perde gli stipendi di quegli anni. È un costo che va dentro al confronto,
// o la RITA sembrerebbe un pasto gratis.
const STRATEGIE = {
  'rendita vitalizia':            x => ({...x, quotaCap0:0, quotaCap1:0, forma0:'vita', forma1:'vita'}),
  'metà capitale + rendita':      x => ({...x, quotaCap0:0.5, quotaCap1:0.5, forma0:'vita', forma1:'vita'}),
  'metà capitale + durata def.':  x => ({...x, quotaCap0:0.5, quotaCap1:0.5, forma0:'durata', forma1:'durata'}),
  'metà capitale + frazionata 5': x => ({...x, quotaCap0:0.5, quotaCap1:0.5, forma0:'frazionata',
                                         forma1:'frazionata', anniFraz0:5, anniFraz1:5}),
  'RITA 5 anni + cap. + durata':  x => ({...x, quotaCap0:0.5, quotaCap1:0.5, forma0:'durata', forma1:'durata',
                                         rita0:+x.annoPens0-5, rita1:+x.annoPens1-5,
                                         ultimo0:+x.annoPens0-6, ultimo1:+x.annoPens1-6}),
  'RITA 10 anni + cap. + durata': x => ({...x, quotaCap0:0.5, quotaCap1:0.5, forma0:'durata', forma1:'durata',
                                         rita0:+x.annoPens0-10, rita1:+x.annoPens1-10,
                                         ultimo0:+x.annoPens0-11, ultimo1:+x.annoPens1-11})
};

// SEI PROFILI DIVERSI PER STRUTTURA, non per cifre: è la lezione di `coppie.mjs`. Una risposta
// che vale solo sul caso comodo non è una risposta.
const PROFILI = {
  'giovani, fondo piccolo':   {nascita0:1985, nascita1:1987, annoPens0:2052, annoPens1:2054,
                               ral:32000, fondo:25000, patr:120000, spesa:2600, iscr:2015},
  'nel mezzo, caso tipo':     {nascita0:1975, nascita1:1977, annoPens0:2042, annoPens1:2044,
                               ral:38000, fondo:60000, patr:250000, spesa:3000, iscr:2005},
  'vicini alla pensione':     {nascita0:1966, nascita1:1968, annoPens0:2033, annoPens1:2035,
                               ral:42000, fondo:180000, patr:300000, spesa:3200, iscr:1998},
  'reddito alto':  {nascita0:1972, nascita1:1974, annoPens0:2039, annoPens1:2041,
                               ral:75000, fondo:250000, patr:500000, spesa:4500, iscr:2000},
  'reddito basso':            {nascita0:1978, nascita1:1980, annoPens0:2045, annoPens1:2047,
                               ral:24000, fondo:40000, patr:90000, spesa:2200, iscr:2010},
  'patrimonio grosso': {nascita0:1970, nascita1:1972, annoPens0:2037, annoPens1:2039,
                               ral:45000, fondo:35000, patr:700000, spesa:3800, iscr:2012}
};
const daProfilo = (p, o={}) => due({
  nascita0:p.nascita0, nascita1:p.nascita1, annoPens0:p.annoPens0, annoPens1:p.annoPens1,
  ral0:p.ral, ral1:p.ral, pens0:pensioneDa(p.ral), pens1:pensioneDa(p.ral),
  fondo0:p.fondo, fondo1:p.fondo, iscr0:p.iscr, iscr1:p.iscr,
  pcVoi0:1.2, pcVoi1:1.2, pcMin0:1.2, pcMin1:1.2, pcDat0:2, pcDat1:2,
  spesa:p.spesa, cl1:p.patr*0.10, cl3:p.patr*0.90,
  rend: R_9010*100, rendFondo: R_AZIONARIO*100, ...o});

console.log('\n\n  A. LE SEI STRATEGIE SUI SEI PROFILI. Patrimonio a fine piano (95 anni), e sotto');
console.log('  lo scarto rispetto alla rendita vitalizia, che è la riga di riferimento.\n');
const NOMI_S = Object.keys(STRATEGIE);
console.log('  ' + 'profilo'.padEnd(30) + NOMI_S.map(n => n.slice(0,13).padStart(15)).join(''));
console.log('  ' + '─'.repeat(30 + 15*NOMI_S.length));
const vincitrici = {};
for (const [nome, p] of Object.entries(PROFILI)){
  const base = daProfilo(p);
  const v = NOMI_S.map(k => fin(STRATEGIE[k](base)));
  const best = v.indexOf(Math.max(...v));
  vincitrici[NOMI_S[best]] = (vincitrici[NOMI_S[best]] || 0) + 1;
  console.log('  ' + nome.padEnd(30)
    + v.map((x,i) => (i===best ? '▸' : ' ') + Math.round(x/1000).toLocaleString('it-IT') + 'k').map(s => s.padStart(15)).join(''));
  console.log('  ' + ''.padEnd(30)
    + v.map(x => (x-v[0]>=0?'+':'') + Math.round((x-v[0])/1000).toLocaleString('it-IT') + 'k')
        .map(s => s.padStart(15)).join(''));
}
console.log('\n  ▸ = la migliore di quella riga. Conteggio: '
  + Object.entries(vincitrici).map(([k,n]) => `${k} ${n}×`).join(' · '));

console.log('\n\n  B. LA RITA PERDE, MA NON PER LA RAGIONE CHE SEMBRA. Nella tavola A la sta pagando');
console.log('  con cinque o dieci anni di stipendio, perché la legge la concede solo a chi ha');
console.log('  CESSATO l\'attività. Qui il pensionamento anticipato è tenuto fermo in tutt\'e due');
console.log('  le colonne, e cambia solo se la RITA si prende o no: è la domanda vera.\n');
console.log(riga(['profilo','smette prima, no RITA','smette prima, sì RITA','la RITA vale'], 24));
console.log(linea(4, 24));
for (const [nome, p] of Object.entries(PROFILI)){
  const anticipo = daProfilo(p, {ultimo0:+p.annoPens0-6, ultimo1:+p.annoPens1-6,
    quotaCap0:0.5, quotaCap1:0.5, forma0:'durata', forma1:'durata'});
  const senza = fin(anticipo);
  const con   = fin({...anticipo, rita0:+p.annoPens0-5, rita1:+p.annoPens1-5});
  console.log(riga([nome.slice(0,22), eur(senza), eur(con), (con>senza?'+':'')+eur(con-senza)], 24));
}
console.log('\n  E LA RISPOSTA È NO, ANCHE COSÌ: la RITA costa, da 17.000 a 60.000 €. Questo');
console.log('  capoverso prima diceva il contrario — era stato scritto prima di far girare la');
console.log('  tavola, ed è il modo più facile di sbagliare che ci sia in un file come questo.');
console.log('\n  PERCHÉ COSTA, ed è una ragione sola: l\'aliquota d\'uscita scende di 0,30 punti per');
console.log('  ogni anno di partecipazione oltre il quindicesimo, quindi tirare fuori il montante');
console.log('  CINQUE ANNI PRIMA vuol dire pagarlo circa un punto e mezzo in più. E non c\'è nulla');
console.log(`  a compensare: il 90/10 rende ${pc(R_9010,3)}, il comparto azionario ${pc(R_AZIONARIO,1)} — sono la stessa cosa.`);
console.log('  Si sposta il denaro da una tasca all\'altra pagando il trasloco.');
console.log('\n  LA RITA NON È UNO STRUMENTO DI OTTIMIZZAZIONE, è un ponte: serve a chi ha smesso');
console.log('  di lavorare e deve arrivare alla pensione. Chi non ne ha bisogno, a chiederla ci');
console.log('  perde — poco, ma ci perde.');

console.log('\n\n  C. QUANTO SI VIVE, che è la domanda che decide davvero. La rendita vitalizia paga');
console.log('  finché si campa e non lascia niente; le altre lasciano quel che avanza. Se si vive');
console.log('  molto a lungo la rendita recupera?\n');
console.log(riga(['si arriva a','rendita vitalizia','metà cap. + durata','differenza','in % della rendita'], 19));
console.log(linea(5, 19));
for (const eta of [80, 85, 90, 95, 100, 105]){
  const base = daProfilo(PROFILI['nel mezzo, caso tipo'], {etaFine:eta});
  const a = fin(STRATEGIE['rendita vitalizia'](base));
  const b = fin(STRATEGIE['metà capitale + durata def.'](base));
  console.log(riga([eta+' anni', eur(a), eur(b), (b>a?'+':'')+eur(b-a), pc((b-a)/a,1)], 19));
}
console.log('\n  LA RISPOSTA VA LETTA IN COLONNA CINQUE, non in quattro. In euro il distacco non');
console.log('  si muove — resta sui 270.000 € da 85 anni in poi — ma in percentuale si DIMEZZA:');
console.log('  dal 14% a 80 anni al 6,6% a 105. La rendita non «recupera» in valore assoluto,');
console.log('  recupera in peso: più si vive, meno conta aver rinunciato a quel capitale.');
console.log('  Chi legge la colonna in euro conclude che l\'età non c\'entra, ed è il contrario.');

console.log('\n\n  D. IL COSTO DEI CINQUE PUNTI. Stessa strategia, stessa velocità d\'uscita: cambia');
console.log('  solo la forma, e con essa l\'aliquota — 15%→9% la durata definita, 20%→15% la');
console.log('  frazionata. Quanto costa scegliere quella sbagliata.\n');
console.log(riga(['profilo','durata definita','frazionata 5 anni','costa'], 24));
console.log(linea(4, 24));
for (const [nome, p] of Object.entries(PROFILI)){
  const base = daProfilo(p);
  const d = fin(STRATEGIE['metà capitale + durata def.'](base));
  const f = fin(STRATEGIE['metà capitale + frazionata 5'](base));
  console.log(riga([nome.slice(0,22), eur(d), eur(f), (f-d>=0?'+':'')+eur(f-d)], 24));
}

console.log('\n\n  E. E SE IL PORTAFOGLIO NON FOSSE 90/10. Qui mi aspettavo che la convenienza di');
console.log('  uscire poggiasse sul rendere più fuori che dentro. Non è così, e si vede subito:\n');
console.log(riga(['portafoglio','rende netto','vs comparto','uscire vale'], 20));
console.log(linea(4, 20));
for (const q of [0, 0.25, 0.5, 0.75, 0.9, 1]){
  const r = mix(q);
  const base = daProfilo(PROFILI['nel mezzo, caso tipo'],
    {rend:r*100, cl1:250000*(1-q), cl3:250000*q});
  const a = fin(STRATEGIE['rendita vitalizia'](base));
  const b = fin(STRATEGIE['metà capitale + durata def.'](base));
  console.log(riga([`${Math.round(q*100)}/${Math.round((1-q)*100)}`, pc(r,3),
    (r>R_AZIONARIO?'+':'')+pc(r-R_AZIONARIO,2), (b>a?'+':'')+eur(b-a)], 20));
}
console.log('\n  ANCHE COL PORTAFOGLIO TUTTO IN CONTI DEPOSITO — 1,3% contro il 5,0% del comparto,');
console.log('  quasi quattro punti PEGGIO — uscire conviene ancora, di 47.810 €. Quindi il');
console.log('  rendimento non è il motore di questo risultato: lo è il METRO.');
console.log('\n  La rendita vitalizia converte il montante e non lascia niente; la durata definita');
console.log('  lo tiene investito e quel che avanza resta agli eredi. Su una metrica che misura');
console.log('  «quanto resta alla fine», la prima parte perdente per costruzione, quale che sia');
console.log('  il rendimento. Il rendimento decide solo QUANTO vince la seconda, non SE vince.');

console.log('\n\n  ────────────────────────────────────────────────────────────────────────────');
console.log('  QUELLO CHE QUESTA TAVOLA NON MISURA, e senza cui la risposta è pericolosa.');
console.log('');
console.log('  Il patrimonio a fine piano premia SEMPRE chi non compra la rendita, e non perché');
console.log('  la rendita sia cara: perché la rendita non lascia nulla, e il metro è quanto');
console.log('  resta. È la stessa forma della trappola della casa dichiarata in testa a questo');
console.log('  file — chi non vende possiede ancora l\'abitazione, e quella in nessun saldo');
console.log('  compare. Qui l\'attivo che sparisce dal metro è la copertura vitalizia.');
console.log('');
console.log('  LA RENDITA COMPRA UNA COSA CHE QUESTO CONTO NON SA PREZZARE: paga FINCHÉ SI');
console.log('  VIVE, anche a 103 anni, anche se il piano si è esaurito. Il conto si ferma');
console.log('  all\'età che si scrive, e dentro quel confine chi tiene i soldi vince quasi');
console.log('  sempre. La tavola C mostra proprio questo: più in là si mette il confine, più');
console.log('  la rendita recupera — ma il confine lo decide chi compila, non la vita.');
console.log('');
console.log('  Quindi: la tavola dice cosa lascia più PATRIMONIO, non cosa è più prudente.');
