// ============================================================================
//  LE TAVOLE VERE, TENUTE FUORI DAL CONTO E USATE COME CONTROLLO.
//
//  Il calcolatore non copia la tavola di nessun fondo: ricostruisce il
//  coefficiente dalla speranza di vita ISTAT allungata di un margine
//  (regole.mjs, SPERANZA_VITA e MARGINE_RENDITA). Il motivo sta lì.
//
//  Qui ci sono i coefficienti veri, trascritti dai documenti sulle rendite di
//  due convenzioni assicurative, e servono a una cosa sola: tenere quella curva
//  dentro il pubblicato. Se un domani il margine invecchia — la gente campa più
//  a lungo, le compagnie si tengono di più — questo controllo lo dice prima che
//  lo dica un lettore.
//
//  Le tavole NON si aggiornano per far passare il controllo: se si spostano
//  loro, si sposta il margine.
// ============================================================================
import { REGOLE } from '../regole.mjs';

const V = k => REGOLE[k].val;

// --- convenzione Generali, tavola IPS55DIFF, tasso tecnico 0% ---------------
// Rendita vitalizia immediata, rate annuali posticipate, importo annuo per euro
// di premio. Cometa e Solidarietà Veneto pubblicano gli stessi identici valori:
// è la stessa convenzione, e sono due riscontri indipendenti.
//   età: [uomo, donna]
const GENERALI = {
  55:[0.0322129,0.0285730], 58:[0.0354487,0.0311349], 60:[0.0379613,0.0331071],
  62:[0.0408095,0.0353326], 63:[0.0423741,0.0365510], 65:[0.0458308,0.0392343],
  67:[0.0497896,0.0422912], 68:[0.0519880,0.0439899], 70:[0.0568971,0.0477836],
  72:[0.0626009,0.0521953], 75:[0.0731572,0.0604033], 80:[0.0980767,0.0802865]
};

// --- tavola A62I, tasso tecnico 0%, due convenzioni diverse -----------------
// Stessa rendita, ma rate MENSILI (che è come la prende quasi tutti) e per età
// «assicurativa»: l'età vera corretta secondo l'anno di nascita. Chi è nato fra
// il 1979 e il 1992 si vede togliere due anni, cioè un coefficiente più basso.
// Le due tabelle di correzione, pubblicate da fondi diversi, sono identiche.
const UNIPOL = {   // Multifond, convenzione UnipolSai
  55:[0.0290964,0.0260254], 58:[0.0317293,0.0281512], 60:[0.0337466,0.0297723],
  62:[0.0360117,0.0315921], 63:[0.0372463,0.0325896], 65:[0.0399507,0.0347858],
  67:[0.0430477,0.0372942], 68:[0.0447691,0.0386856], 70:[0.0486233,0.0417911],
  72:[0.0531258,0.0454045], 75:[0.0613906,0.0520322], 80:[0.0807720,0.0676894]
};
const ALIFOND = {  // Alifond, altra compagnia, stessa tavola demografica
  55:[0.0292925,0.0262008], 58:[0.0319431,0.0283409], 60:[0.0339740,0.0299730],
  62:[0.0362545,0.0318050], 63:[0.0374973,0.0328093], 65:[0.0402200,0.0350202],
  67:[0.0433379,0.0375455], 68:[0.0450708,0.0389463], 70:[0.0489510,0.0420728],
  72:[0.0534839,0.0457106], 75:[0.0618044,0.0523829], 80:[0.0813164,0.0681456]
};
const SPOSTAMENTO = 2;   // anni tolti a chi è nato fra il 1979 e il 1992
const MENSILE = 0.97;    // rate mensili invece che annuali, misurato sulle tavole A62I

// --- le forme diverse dalla vitalizia, sempre convenzione Generali ----------
const CERTA_10 = { 65:[0.0447872,0.0388279], 67:[0.0482695,0.0417146], 70:[0.0542020,0.0467757] };
const REVERSIBILE = { 65:[0.0311152,0.0366611], 67:[0.0331322,0.0394230], 70:[0.0366611,0.0443673] };

// le tavole sono trascritte a salti di due o tre anni: per leggerle a un'età
// che non c'è si interpola, come fa il calcolatore con la sua curva
const ETA = Object.keys(GENERALI).map(Number);
const leggi = (T, eta) => {
  if (eta <= ETA[0]) return T[ETA[0]];
  if (eta >= ETA.at(-1)) return T[ETA.at(-1)];
  const i = ETA.findIndex(e => e >= eta), a1 = ETA[i-1], a2 = ETA[i];
  return [0, 1].map(j => T[a1][j] + (T[a2][j] - T[a1][j]) * (eta - a1) / (a2 - a1));
};
const media = ([u, d]) => (u + d) / 2;
const nostro = eta => V('COEFF_ETA').find(([e]) => e === eta)[1];
const conSpostamento = eta => leggi(UNIPOL, eta - SPOSTAMENTO);

// due compagnie diverse sulla stessa tavola demografica: se divergessero, uno
// dei due l'avrei trascritto male
const scartoA62I = Math.max(...Object.keys(UNIPOL).map(Number)
  .flatMap(e => [0, 1].map(j => Math.abs(ALIFOND[e][j] / UNIPOL[e][j] - 1))));

// si controlla dove il calcolatore lavora davvero: la curva si ferma a 75 anni
const VERIFICATE = ETA.filter(e => e <= 75);

// il centro del pubblicato: le due convenzioni, come le prende chi le prende,
// cioè a rate mensili e con lo spostamento d'età dove è previsto
const centro = eta => (media(GENERALI[eta]) * MENSILE + media(conSpostamento(eta))) / 2;

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};
const pc = x => (x * 100).toFixed(1) + '%';

// 1. la curva sta al centro delle due convenzioni, dove la gente va in pensione
const scarti = VERIFICATE.map(e => [e, nostro(e) / centro(e) - 1]);
const dentro = (da, a, lim) => scarti.filter(([e]) => e >= da && e <= a)
  .every(([, s]) => Math.abs(s) <= lim);
const peggio = (da, a) => scarti.filter(([e]) => e >= da && e <= a)
  .reduce((p, x) => Math.abs(x[1]) > Math.abs(p[1]) ? x : p);

console.log('\n— le tavole fra loro —');
c('due compagnie diverse sulla stessa tavola A62I danno gli stessi coefficienti',
  scartoA62I < 0.02, `scarto massimo ${pc(scartoA62I)}`);

console.log('\n— la curva contro il centro delle due convenzioni —');
c('fra 60 e 72 anni non se ne discosta più del 4%', dentro(60, 72, 0.04),
  `il peggio è ${pc(peggio(60, 72)[1])} a ${peggio(60, 72)[0]} anni`);
// agli estremi della tabella un margine costante regge un po' meno: lo scarto
// vero è quello che il controllo stampa, e va scritto in «il metodo»
c('a nessuna età fra 55 e 75 se ne discosta più del 7%', dentro(55, 75, 0.07),
  `il peggio è ${pc(peggio(55, 75)[1])} a ${peggio(55, 75)[0]} anni`);

// 2. la banda dichiarata contiene davvero tutto il pubblicato: è quello che
//    permette di dire «sotto questa cifra spetta a chiunque»
console.log('\n— la banda dichiarata contro tutti i valori pubblicati —');
const tutti = VERIFICATE.flatMap(e => {
  const n = nostro(e);
  return [
    ['Generali uomo, rate annuali',  GENERALI[e][0] / n],
    ['Generali donna, rate annuali', GENERALI[e][1] / n],
    ['Generali uomo, rate mensili',  GENERALI[e][0] * MENSILE / n],
    ['Generali donna, rate mensili', GENERALI[e][1] * MENSILE / n],
    ['A62I uomo, rate mensili',  UNIPOL[e][0] / n],
    ['A62I donna, rate mensili', UNIPOL[e][1] / n],
    ['A62I uomo, con lo spostamento',  conSpostamento(e)[0] / n],
    ['A62I donna, con lo spostamento', conSpostamento(e)[1] / n],
    ['A62I uomo, altra compagnia',  ALIFOND[e][0] / n],
    ['A62I donna, altra compagnia', ALIFOND[e][1] / n]
  ].map(([chi, r]) => [`${chi}, ${e} anni`, r]);
});
const alto = tutti.reduce((p, x) => x[1] > p[1] ? x : p);
const basso = tutti.reduce((p, x) => x[1] < p[1] ? x : p);
c('nessun coefficiente pubblicato sta sopra la banda', alto[1] <= V('BANDA_ALTA'),
  `il più alto è ${alto[1].toFixed(3)} volte il nostro (${alto[0]}), la banda arriva a ${V('BANDA_ALTA')}`);
c('nessun coefficiente pubblicato sta sotto la banda', basso[1] >= V('BANDA_BASSA'),
  `il più basso è ${basso[1].toFixed(3)} volte il nostro (${basso[0]}), la banda scende a ${V('BANDA_BASSA')}`);
c('la banda non è più larga del necessario, o non direbbe niente',
  V('BANDA_ALTA') - alto[1] < 0.03 && basso[1] - V('BANDA_BASSA') < 0.03);

// 3. i due fattori di forma, misurati sulle stesse tavole
console.log('\n— quanto resta dell\'assegno con le altre forme di rendita —');
const rapporto = T => {
  const e = Object.keys(T).map(Number);
  return e.reduce((s, x) => s + media(T[x]) / media(GENERALI[x]), 0) / e.length;
};
const rCerta = rapporto(CERTA_10), rRev = rapporto(REVERSIBILE);
c('certa 10 anni: il fattore è quello misurato', Math.abs(V('FATT_CERTA') - rCerta) < 0.02,
  `misurato ${rCerta.toFixed(3)}, nel conto ${V('FATT_CERTA')}`);
c('reversibile: il fattore è quello misurato', Math.abs(V('FATT_REV') - rRev) < 0.02,
  `misurato ${rRev.toFixed(3)}, nel conto ${V('FATT_REV')}`);
// la media unisex, qui, nasconde due casi lontanissimi: va detto in pagina
const revU = REVERSIBILE[67][0] / GENERALI[67][0], revD = REVERSIBILE[67][1] / GENERALI[67][1];
c('sulla reversibile uomo e donna restano lontani: la pagina deve dirlo',
  revD - revU > 0.2, `a 67 anni: uomo ${revU.toFixed(2)}, donna ${revD.toFixed(2)}`);

// 4. la forma della curva, che è l'unica cosa certa senza tavole
console.log('\n— la forma —');
c('il coefficiente cresce a ogni anno di età, nelle tavole vere e nella nostra',
  [ETA.map(e => GENERALI[e][0]), ETA.map(e => GENERALI[e][1]),
   ETA.map(e => UNIPOL[e][0]),   ETA.map(e => UNIPOL[e][1]),
   ETA.map(e => ALIFOND[e][0]),  V('COEFF_ETA').map(([, v]) => v)]
    .every(v => v.every((x, i) => i === 0 || x > v[i-1])));

console.log(ko ? `\n✗ ${ko} controlli falliti: la curva è uscita dal pubblicato`
                : '\n✓ la curva sta dentro le tavole vere');
if (ko) process.exitCode = 1;
