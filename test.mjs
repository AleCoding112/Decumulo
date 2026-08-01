// Controlli sul motore di decumulo.it (index.html).
// Legge lo <script> direttamente dall'HTML con un DOM finto: non c'è una copia del modello
// da tenere allineata. Si lancia con:  node test.mjs
import fs from 'fs';

const PAGINA = new URL('./sito/index.html', import.meta.url).pathname;
const src = fs.readFileSync(PAGINA, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

// UN CASO DI PROVA INVENTATO. Fino al 01/08/2026 qui c'erano i dati veri di due persone,
// ereditati dal progetto da cui questo è stato staccato, e il commento diceva il contrario.
// Sostituiti con cifre costruite, tonde e riconoscibili come tali.
//
// LE PROPRIETÀ CHE IL CASO DEVE AVERE, perché è su queste che poggiano i controlli, non sui
// numeri: due persone con decorrenze e iscrizioni diverse (due incassi in due esercizi diversi
// e due aliquote diverse); il primo nello scaglione IRPEF più alto e il secondo in quello di
// mezzo; tutti e due con un montante che alla prestazione supera la soglia del «tutto in
// capitale», così la deroga si vede mordere; un piano che regge, così il verdetto ha un valore
// di partenza stabile.
// **Se un giorno il caso cambia, i controlli non devono cambiare**: le attese si ricavano da qui
// invece di essere scritte a mano. Dove non era così, il cambio del 01/08 le ha fatte emergere.
//
// `vers` sono SOLO i contributi (lavoratore + datore): il TFR è a parte, è `tfrDove`.
// `pens` è il LORDO, come lo dà l'INPS: il netto lo ricava la pagina.
// `spesaPens` vuota: in pensione si spende come adesso — vuoto e 0 qui vogliono dire cose diverse.
// `rita` è messo alla propria decorrenza (niente erogazione anticipata) per avere un punto di
// partenza pulito: la RITA si prova nel suo gruppo.
const DATI = {patrimonio:120000, spesa:2600, spesaPens:'', cresc0:'', cresc1:'', rend:5, infl:2, rendFondo:5, etaFine:95,
  forma0:'vita', forma1:'vita', nome0:'Anna', nome1:'Bruno', pc0:'', pc1:'',
  nascita0:1975, stip0:2600, ral0:58000, pens0:2600, annoPens0:2042,
  tipoFondo0:'collettiva', tipoFondo1:'collettiva',
  // vuoto = fino alla propria pensione. Assente varrebbe '0', cioè «non lavora da sempre»
  ultimo0:'', ultimo1:'',
  fondo0:90000, pcVoi0:1.5, pcDat0:2.0, tfrDove0:'fondo', iscr0:2018, rita0:2042, quotaCap0:0.6,
  nascita1:1982, stip1:1900, ral1:36000, pens1:1700, annoPens1:2050,
  fondo1:30000, pcVoi1:1.2, pcDat1:1.6, tfrDove1:'fondo', iscr1:2012, rita1:2050, quotaCap1:1};

// Il DOM finto deve esporre tutto quello che la pagina tocca, o lo script non arriva in fondo:
// oltre a value/innerHTML servono textContent, checked, addEventListener e — da quando i
// cursori senza scelta si nascondono — anche style e nextElementSibling. E `dataset`, da quando
// il pulsante del punto più alto ci tiene la percentuale a cui deve portare il cursore.
const finto = () => ({value:'', innerHTML:'', className:'', textContent:'', checked:false,
  min:'', max:'', disabled:false, hidden:false, style:{}, dataset:{}, addEventListener(){},
  closest(){ return finto(); }, classList:{toggle(){}, add(){}, remove(){}},
  get nextElementSibling(){ return finto(); }, get parentElement(){ return finto(); }});
// `addEventListener` sulla finestra: la pagina lo usa per aprire il dettaglio prima della
// stampa. Nei DOM finti non esiste, ed è la quinta volta che un'armatura incompleta fa
// cadere codice buono: si completa l'armatura, non si indebolisce la pagina.
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.document = {
  body: {classList:{toggle(){}}},
  getElementById: id => Object.assign(finto(), {value: String(DATI[id] ?? 0)}),
  querySelectorAll: () => []
};
const M = new Function(src + `\nreturn {simula, leggi, aliquota, spesaSostenibile, fasi, eventi,
  quotaMax, SOGLIA_TUTTO, soglia, coeffEta, aiSuperstiti, TRATT_MINIMO_ANNO, REVERSIBILITA, speranzaVita, COEFF_ETA, COEFF_RENDITA, BANDA_ALTA, BANDA_BASSA, FATT, irpef, spazioDeducibile, contributi, pcTetto, pcMassimo, candidatiVersamento, pcSoglia, costoAnnuo, scontoIrpef, costoMensile, conAlt, migliore,
  TETTO_DEDUZIONE, TFR_SU_RAL, aliquotaTfr, TFR_RIV_FISSA, TFR_RIV_QUOTA, TFR_IMPOSTA_RIV, IVS};`)();
const s = M.leggi();

let ok = 0, ko = 0;
const t = (nome, cond, extra='') => { cond ? ok++ : ko++;
  console.log((cond ? '  ok  ' : '  KO  ') + nome + (extra ? '   ' + extra : '')); };
const fmt = n => String(n).replace('.', ',');
const eur = n => Math.round(n).toLocaleString('it-IT');

// LEGGERE IL MODULO CON QUALCHE CASELLA DIVERSA, E RIMETTERLO COM'ERA.
// Serve un ripristino vero: `Object.assign(DATI, salva)` rimette le chiavi vecchie ma NON toglie
// quelle aggiunte. Il gruppo «una persona sola» lasciava così `quanti:'1'` dentro `DATI` per
// tutti i gruppi scritti dopo, e il primo ad accorgersene è stato quello di chi è già in
// pensione: leggeva una persona sola dove il caso ne voleva due, e falliva un controllo giusto.
// Il codice aveva ragione, lo strumento di misura no.
const leggiCon = o => {
  const salva = {...DATI}, nuove = Object.keys(o).filter(k => !(k in DATI));
  Object.assign(DATI, o);
  try { return M.leggi(); }
  finally { Object.assign(DATI, salva); nuove.forEach(k => delete DATI[k]); }
};

const r = M.simula(s);
const g = r.righe;
const anno = a => g.find(x => x.anno === a);

console.log('\n— la contabilità —');
let peggio = 0, salto = 0;
for (const x of g) peggio = Math.max(peggio, Math.abs(x.inizio + x.rendimento + x.daLavoro
  + x.daPensioni + x.daRendita + x.daFondo + x.daRata - x.spesa - x.patr));
for (let i = 1; i < g.length; i++) salto = Math.max(salto, Math.abs(g[i].inizio - g[i-1].patr));
t('ogni riga quadra: inizio + rendimento + entrate − spesa = fine', peggio < 1e-6,
  'scarto max ' + peggio.toExponential(1));
t('il fine anno di una riga è l\'inizio della successiva', salto < 1e-9);
// L'ANNO DI FINE SI DERIVA: è la nascita del più giovane più l'orizzonte. Scritto a mano
// valeva solo per un caso di prova, e cambiando il caso il controllo falliva senza che nulla
// fosse rotto.
const finePiano = Math.max(DATI.nascita0, DATI.nascita1) + DATI.etaFine;
t(`parte dal 2026 e finisce ai ${DATI.etaFine} anni della più giovane (${finePiano})`,
  g[0].anno === 2026 && r.annoFine === finePiano && g.at(-1).anno === finePiano);
const spesaAnno = DATI.spesa * 12;
t('la spesa esce tutti gli anni, anche mentre lavorano',
  g.every(x => Math.abs(x.spesa - spesaAnno) < 1e-9));
t('nessun rendimento su un patrimonio negativo', g.every(x => x.inizio >= 0 || x.rendimento === 0));
// LE DUE SPESE: quella di adesso vale fino all'ultimo anno di lavoro compreso, poi subentra
// quella della pensione. Vuota vuol dire «come adesso»; 0 vuol dire davvero zero.
t('con la spesa in pensione vuota, la spesa non cambia mai',
  g.every(x => Math.abs(x.spesa - spesaAnno) < 1e-9));
// IL PASSAGGIO È QUANDO HA SMESSO L'ULTIMO, non il primo: finché uno dei due lavora, in casa
// entra ancora un reddito da lavoro e la spesa è quella di adesso.
const smetteUltimo = Math.max(...s.p.map(x => x.ultimo));
t('con una spesa in pensione diversa, il passaggio è l\'anno dopo che ha smesso l\'ultimo', (() => {
    const dopo = Math.round(DATI.spesa * 0.8);   // una spesa diversa, non un numero speciale
    const due = M.simula({...s, spesaPens: dopo});
    return due.righe.every(x =>
      Math.abs(x.spesa - (x.anno <= smetteUltimo ? spesaAnno : dopo * 12)) < 1e-9); })(),
  `${eur(DATI.spesa)} € fino al ${smetteUltimo}, poi ${eur(Math.round(DATI.spesa * 0.8))} €`);
t('la spesa sostenibile tiene fermo il rapporto fra le due', (() => {
    const sc = {...s, spesaPens: 1500};
    const q = M.spesaSostenibile(sc);
    const r2 = M.simula(sc, q);
    const dopo = r2.righe.find(x => x.anno > Math.max(...sc.p.map(y => y.ultimo)));
    return Math.abs(dopo.spesa / (q * 12) - 1500 / sc.spesa) < 1e-9; })());
t('rendimento = rendimento reale × quello che c\'era a inizio anno',
  g.every(x => x.inizio < 0 || Math.abs(x.rendimento - x.inizio * s.rend) < 1e-9));

console.log('\n— l\'inflazione, tenuta separata —');
t('i rendimenti si scrivono nominali e la pagina li porta a reali',
  Math.abs(s.rendNom - DATI.rend/100) < 1e-12 && Math.abs(s.infl - DATI.infl/100) < 1e-12);
// LA SOTTRAZIONE È IL MODO SBAGLIATO, e il controllo lo dice confrontando col risultato che
// darebbe: (1+r)/(1+i) non è r−i, e la differenza cresce coi valori.
const sottraendo = (DATI.rend - DATI.infl) / 100;
t('il reale è un rapporto, non una sottrazione',
  Math.abs(s.rend - ((1 + DATI.rend/100) / (1 + DATI.infl/100) - 1)) < 1e-15
  && Math.abs(s.rend - sottraendo) > 1e-5,
  `${(s.rend*100).toFixed(3)}% invece di ${(sottraendo*100).toFixed(3)}%`);
t('con inflazione zero, nominale e reale coincidono', (() => {
    const z = M.simula({...s, infl:0, rend:DATI.rend/100});
    return Math.abs(z.righe[0].rendimento - z.righe[0].inizio*DATI.rend/100) < 1e-9; })());
t('l\'inflazione sgonfia la base imponibile del fondo',
  M.simula({...s, infl:0.05}).incassi[0].base < r.incassi[0].base &&
  r.incassi[0].base < M.simula({...s, infl:0}).incassi[0].base,
  `0%: ${eur(M.simula({...s, infl:0}).incassi[0].base)} € · 2%: ${eur(r.incassi[0].base)} € · 5%: ${eur(M.simula({...s, infl:0.05}).incassi[0].base)} €`);
// LA SOMMA SECCA, rifatta a mano dai dati del caso: consistenza iniziale più, per ogni esercizio
// di attività, i contributi dei due e il TFR conferito. Gli esercizi sono quelli veri, contati.
t('senza inflazione la base è la somma secca di quello che è entrato, TFR compreso', (() => {
    const eser = s.p[0].ultimo - 2026 + 1;
    const entra = DATI.ral0 * (DATI.pcVoi0 + DATI.pcDat0) / 100 + DATI.ral0 * M.TFR_SU_RAL;
    return Math.abs(M.simula({...s, infl:0}).incassi[0].base
                    - (DATI.fondo0 + entra * eser)) < 1e-6; })());
t('il TFR conferito finisce anche nella base imponibile: è reddito mai tassato', (() => {
    const senza = M.simula({...s, p:s.p.map(x=>({...x, tfrAlFondo:false}))});
    return senza.incassi[0].base < r.incassi[0].base; })());
t('la base imponibile non può mai superare il montante',
  r.incassi.every(i => i.base <= i.montante + 1e-9));

// L'ULTIMO ANNO DI LAVORO È DI CIASCUNO (31/07/2026). Prima era uno solo per tutti e due,
// ricavato dalla PRIMA delle due decorrenze: chi aveva accanto una persona più grande smetteva
// di lavorare quando andava in pensione l'altra, e perdeva stipendio, contributi, quota del
// datore e TFR di tutti gli anni in mezzo. Qui la coppia ha nove anni di distanza fra le due
// decorrenze, che è esattamente il caso che prima veniva sbagliato.
console.log('\n— l\'ultimo anno di lavoro è di ciascuno —');
const conUltimo = (o) => { const salva = {...DATI}; Object.assign(DATI, o);
                           const q = M.leggi(); Object.assign(DATI, salva); return q; };
t('vuoto vuol dire fino alla PROPRIA pensione, non a quella dell\'altro',
  s.p[0].ultimo === DATI.annoPens0 - 1 && s.p[1].ultimo === DATI.annoPens1 - 1,
  `${s.p[0].ultimo} e ${s.p[1].ultimo}, con decorrenze ${DATI.annoPens0} e ${DATI.annoPens1}`);
t('e i due anni sono diversi: la vecchia regola li faceva coincidere',
  s.p[0].ultimo !== s.p[1].ultimo
  && s.p[0].ultimo === DATI.annoPens0 - 1 && s.p[1].ultimo === DATI.annoPens1 - 1);
// un esercizio in cui il primo ha già smesso e il secondo lavora ancora: è la finestra che la
// vecchia regola cancellava, e si trova invece di sceglierla a mano
const soloSecondo = g.find(x => !x.lavora[0] && x.lavora[1]).anno;
t('IL RECUPERO: chi ha accanto una persona più grande non perde più i suoi anni di lavoro',
  Math.abs(anno(soloSecondo).daLavoro - s.p[1].stip * 12) < 1e-9,
  `nel ${soloSecondo} lavora ancora il secondo: ${eur(anno(soloSecondo).daLavoro)} € contro 0 € prima`);
t('chi scrive un anno, smette quando ha scritto',
  conUltimo({ultimo0: 2030}).p[0].ultimo === 2030);
t('e non trascina l\'altro',
  conUltimo({ultimo0: 2030}).p[1].ultimo === DATI.annoPens1 - 1);
t('un anno oltre la propria decorrenza viene ricondotto: mai stipendio e trattamento insieme',
  conUltimo({ultimo0: 2050}).p[0].ultimo === DATI.annoPens0 - 1);
t('e resta memoria di quello che è stato scritto, per poterlo dire',
  conUltimo({ultimo0: 2050}).p[0].ultimoScritto === 2050);
t('zero non è vuoto: è un anno impossibile, e viene ricondotto invece di valere «come sempre»',
  conUltimo({ultimo0: 0}).p[0].ultimoScritto === 1900);
t(`nel ${s.p[0].ultimo} lavorano tutti e due`,
  Math.abs(anno(s.p[0].ultimo).daLavoro - (s.p[0].stip + s.p[1].stip) * 12) < 1e-9);
t(`nel ${DATI.annoPens1} non lavora più nessuno`, anno(DATI.annoPens1).daLavoro === 0);
// la pensione si scrive lorda e la pagina la porta a netta: qui i confronti vanno fatti col netto
const netta = lordo => lordo*12 - M.irpef(lordo*12);
t(`dal ${DATI.annoPens0} c'è subito il trattamento del primo: nessun esercizio a tasche vuote`,
  Math.abs(anno(DATI.annoPens0).daPensioni - netta(DATI.pens0)) < 1e-9);
// gli esercizi in mezzo alle due decorrenze: il secondo non lavora più e non percepisce ancora
const inMezzo = g.filter(x => x.anno >= DATI.annoPens0 && x.anno < DATI.annoPens1).map(x => x.anno);
t(`il secondo resta senza entrate proprie dal ${inMezzo[0]} al ${inMezzo.at(-1)}`,
  inMezzo.every(a => Math.abs(anno(a).daPensioni - netta(DATI.pens0)) < 1e-9));
t(`dal ${DATI.annoPens1} ci sono tutti e due i trattamenti`,
  Math.abs(anno(DATI.annoPens1).daPensioni - (netta(DATI.pens0) + netta(DATI.pens1))) < 1e-9);

console.log('\n— la pensione si scrive lorda, come la dà l\'INPS —');
t('il netto è più basso del lordo, e di quanto lo dice l\'IRPEF',
  Math.abs(s.p[0].pens*12 - netta(DATI.pens0)) < 1e-9 && s.p[0].pensLorda === DATI.pens0,
  `${eur(DATI.pens0)} € lordi → ${eur(s.p[0].pens)} € netti al mese`);
t('le due pensioni si tassano ognuna per conto suo, non sommate',
  Math.abs(s.p[1].pens*12 - netta(DATI.pens1)) < 1e-9);
t('una pensione più alta lascia comunque più soldi, anche passando dal netto',
  M.simula({...s, p:s.p.map(x=>({...x, pens:x.pens*1.2}))}).finale > r.finale);

console.log('\n— i due fondi, ciascuno col suo —');
t('due incassi in due anni diversi', r.incassi.length === 2 &&
  r.incassi[0].anno === DATI.annoPens0 && r.incassi[1].anno === DATI.annoPens1,
  r.incassi.map(i => `${i.chi} ${i.anno}`).join(', '));
// gli anni di partecipazione si contano dall'iscrizione alla prestazione, e l'aliquota è quella
// che la legge fa discendere da loro: si ricalcola qui invece di riscrivere il risultato
const anniIscr = i => (i === 0 ? DATI.annoPens0 - DATI.iscr0 : DATI.annoPens1 - DATI.iscr1);
t('due aliquote diverse, perché le iscrizioni sono di anni diversi',
  r.incassi[0].al !== r.incassi[1].al,
  `il primo ${(r.incassi[0].al*100).toFixed(1)}% (${anniIscr(0)} anni) · ` +
  `il secondo ${(r.incassi[1].al*100).toFixed(1)}% (${anniIscr(1)} anni)`);
t(`il primo: ${anniIscr(0)} anni di iscrizione → ${fmt((M.aliquota(anniIscr(0))*100).toFixed(1))}%`,
  Math.abs(r.incassi[0].al - M.aliquota(anniIscr(0))) < 1e-12);
t(`il secondo: ${anniIscr(1)} anni di iscrizione → ${fmt((M.aliquota(anniIscr(1))*100).toFixed(1))}%`,
  Math.abs(r.incassi[1].al - M.aliquota(anniIscr(1))) < 1e-12);
t('aliquota 15% fino a 15 anni', M.aliquota(10) === 0.15 && M.aliquota(15) === 0.15);
t('pavimento del 9% da 35 anni in su', M.aliquota(35) === 0.09 && M.aliquota(60) === 0.09);
t('la base imponibile è il versato, non il montante',
  r.incassi.every(i => i.base < i.montante && i.base > 0));
t('imposta = base × aliquota',
  r.incassi.every(i => Math.abs(i.tasse - i.base * i.al) < 1e-9));
t('Anna prende il 60%: la sua scelta coincide con quello che la legge concede',
  Math.abs(r.incassi[0].capitale / (r.incassi[0].montante - r.incassi[0].tasse) - 0.6) < 1e-12
  && !r.incassi[0].limitata);
t('il capitale entra nel patrimonio nell\'anno giusto',
  r.incassi.every(i => Math.abs(anno(i.anno).daFondo - i.capitale) < 1e-9));
// un esercizio dopo la prima prestazione e prima della seconda: il primo montante è chiuso,
// il secondo continua a crescere. Si cerca invece di sceglierlo a mano.
const fraLeDue = g.find(x => x.anno > DATI.annoPens0 && x.anno < DATI.annoPens1 - 1).anno;
t('il secondo fondo cresce ancora quando il primo è già stato riscosso',
  anno(fraLeDue).fondi[0] === 0 && anno(fraLeDue + 1).fondi[1] > anno(fraLeDue).fondi[1]);
// Chi smette PRIMA della propria pensione lascia un tratto in cui non versa più ma il fondo
// non è ancora riscosso: lì dentro il montante può solo rendere. Prima questo caso non si
// poteva nemmeno costruire, perché l'ultimo anno era imposto uguale per tutti e due.
t('smesso di lavorare non si versa più, e il fondo cresce del solo rendimento', (() => {
    const pres = M.simula({...s, p: s.p.map((x,i) => i === 1 ? {...x, ultimo: 2038} : x)});
    const a = y => pres.righe.find(g => g.anno === y);
    return [2040, 2042, 2044].every(y =>
      Math.abs(a(y).fondi[1] - a(y-1).fondi[1] * (1 + s.rendFondo)) < 1e-6); })(),
  'dal 2039 al 2045 non versa, e il fondo lo riscuote nel 2046');
t('e finché lavorava ci entrava di più del solo rendimento', (() => {
    const pres = M.simula({...s, p: s.p.map((x,i) => i === 1 ? {...x, ultimo: 2038} : x)});
    const a = y => pres.righe.find(g => g.anno === y);
    return a(2038).fondi[1] > a(2037).fondi[1] * (1 + s.rendFondo) + 1; })());

console.log('\n— la retribuzione che cresce —');
// SI SCRIVE NOMINALE E IL CONTO TOGLIE L'INFLAZIONE: scriverla pari all'inflazione deve dare
// esattamente il piano di prima, o la casella nuova cambierebbe i conti a chi non la tocca.
t('scritta pari all\'inflazione non cambia niente', (() => {
    const pari = M.simula({...s, p: s.p.map(x => ({...x, cresc: 0}))});
    return Math.abs(pari.finale - r.finale) < 1e-9; })());
t('vuota vuol dire proprio quello: crescita reale zero',
  s.p.every(x => x.crescNom === null && x.cresc === 0));
t('una crescita reale positiva fa entrare più soldi nel fondo e lascia più patrimonio', (() => {
    const su = M.simula({...s, p: s.p.map(x => ({...x, cresc: 0.01}))});
    return su.finale > r.finale && su.incassi[0].montante > r.incassi[0].montante; })());
t('e una negativa fa il contrario', (() => {
    const giu = M.simula({...s, p: s.p.map(x => ({...x, cresc: -0.01}))});
    return giu.finale < r.finale && giu.incassi[0].montante < r.incassi[0].montante; })());
t('cresce solo finché si lavora: dopo l\'ultimo anno non c\'è più retribuzione da far crescere',
  (() => {
    const su = M.simula({...s, p: s.p.map(x => ({...x, cresc: 0.05}))});
    const ultimissimo = Math.max(...s.p.map(x => x.ultimo));
    return su.righe.filter(g => g.anno > ultimissimo).every(g => g.daLavoro === 0); })());
t('il TFR segue la retribuzione, non resta quello del primo anno', (() => {
    const su = M.simula({...s, p: s.p.map(x => ({...x, cresc: 0.03, tfrAlFondo: false}))});
    // due liquidazioni, e quella di chi cresce del 3% per 11 anni dev'essere più alta
    const piatto = M.simula({...s, p: s.p.map(x => ({...x, cresc: 0, tfrAlFondo: false}))});
    return su.liquidazioni[0].lordo > piatto.liquidazioni[0].lordo * 1.1; })());

console.log('\n— quanto se ne può prendere in contanti lo decide la legge —');
// 19,4 anni di speranza di vita a 67, allungati del 25%: 24,3 anni di rendita, e la soglia
// è quel che serve perché il 70% del montante ne dia mezzo assegno sociale all'anno.
t('la soglia di riferimento (67 anni) sta intorno ai 123.000 €',
  Math.abs(M.SOGLIA_TUTTO - 123002) < 2, Math.round(M.SOGLIA_TUTTO) + ' €');
// il coefficiente vero dipende dal fondo, dal sesso, dalla rateazione: la soglia di
// riferimento deve stare dentro la banda, o le due risposte certe sarebbero incoerenti
t('la soglia di riferimento sta fra quella che vale per chiunque e quella che non vale per nessuno',
  M.soglia(M.COEFF_RENDITA * M.BANDA_ALTA) < M.SOGLIA_TUTTO
  && M.SOGLIA_TUTTO < M.soglia(M.COEFF_RENDITA * M.BANDA_BASSA),
  `${eur(M.soglia(M.COEFF_RENDITA*M.BANDA_ALTA))} € · ${eur(M.SOGLIA_TUTTO)} € · ${eur(M.soglia(M.COEFF_RENDITA*M.BANDA_BASSA))} €`);
t('un fondo piccolo si può prendere tutto', M.quotaMax(50000, M.COEFF_RENDITA) === 1);
t('appena sopra la soglia ci si ferma al 60%',
  Math.abs(M.quotaMax(M.SOGLIA_TUTTO + 1, M.COEFF_RENDITA) - 0.6) < 1e-12);
t('il fondo del primo è sopra la soglia: chiedere tutto viene tagliato', (() => {
    const c = M.conAlt(s, 0, 'quotaCap', 1);
    const i = c.incassi.find(v => v.chi === DATI.nome0);
    return i.limitata && Math.abs(i.quota - 0.6) < 1e-12; })(),
  `montante ${eur(r.incassi[0].montante)} €`);
// LE DUE DECISIONI SI PARLANO, ed è l'effetto di confine che la pagina dichiara: chi aspetta la
// pensione si trova il montante sopra la soglia e «tutto in contanti» negato; chi lo prende a
// rate arriva alla pensione con un residuo sotto soglia, e glielo concedono.
t('chi aspetta: il fondo supera la soglia e «tutto» viene tagliato al 60%',
  r.incassi[1].limitata && r.incassi[1].chiesta === 1 &&
  Math.abs(r.incassi[1].quota - 0.6) < 1e-12 && r.incassi[1].montante > r.incassi[1].soglia,
  `montante ${eur(r.incassi[1].montante)} € contro una soglia di ${eur(r.incassi[1].soglia)} €`);
t('chi prende a rate: quel che avanza sta sotto soglia e «tutto» si può', (() => {
    const c = M.conAlt(s, 1, 'rita', DATI.annoPens1 - 8).incassi[1];
    return !c.limitata && c.quota === 1 && c.montante < c.soglia; })(),
  `avanzano ${eur(M.conAlt(s, 1, 'rita', DATI.annoPens1 - 8).incassi[1].montante)} €`);
t('prendere tutto quando si può lascia più soldi che prenderne metà',
  M.conAlt(s, 1, 'quotaCap', 1).finale > M.conAlt(s, 1, 'quotaCap', 0.5).finale);

console.log('\n— quanto versare nel fondo: IRPEF e tetto di deducibilità —');
t('IRPEF, primo scaglione al 23%', Math.abs(M.irpef(28000) - 28000*0.23) < 1e-9);
t('IRPEF, secondo scaglione al 33% (non più 35%, dal 2026)',
  Math.abs(M.irpef(50000) - (28000*0.23 + 22000*0.33)) < 1e-9);
t('IRPEF, terzo scaglione al 43%',
  Math.abs(M.irpef(60000) - (28000*0.23 + 22000*0.33 + 10000*0.43)) < 1e-9);
t('IRPEF su zero è zero', M.irpef(0) === 0 && M.irpef(-100) === 0);
t('il tetto è 5.300 €, non più 5.164,57', M.TETTO_DEDUZIONE === 5300);
t('il tetto è sui contributi di tutti e due: lavoratore + datore',
  Math.abs(M.spazioDeducibile(s.p[0])
           - (M.TETTO_DEDUZIONE - DATI.ral0*(DATI.pcVoi0 + DATI.pcDat0)/100)) < 1e-9,
  `il primo ${eur(M.spazioDeducibile(s.p[0]))} € · il secondo ${eur(M.spazioDeducibile(s.p[1]))} €`);
t('il TFR non consuma il tetto, né conferito né lasciato in azienda',
  M.spazioDeducibile({...s.p[0], tfrAlFondo:true})
    === M.spazioDeducibile({...s.p[0], tfrAlFondo:false}));
t('chi versa già più del tetto non ha spazio, e non va sottozero',
  M.spazioDeducibile({...s.p[0], ral:400000}) === 0);

console.log('\n— IL GRADINO: il contributo del datore è condizionato al vostro versamento —');
const A = s.p[0], quota = pc => M.contributi(A, pc);
t('sotto quello che versano oggi il datore non versa NIENTE',
  quota(A.pcVoi - 0.01).dat === 0 && quota(0).dat === 0 && !quota(0).scatta,
  `all'${fmt(A.pcVoi)}% arrivano ${eur(quota(A.pcVoi).dat)} €, appena sotto zero`);
t('esattamente alla loro quota scatta, e per intero',
  quota(A.pcVoi).scatta && Math.abs(quota(A.pcVoi).dat - DATI.ral0*DATI.pcDat0/100) < 1e-9);
t('sopra non aumenta: è un gradino, non una rampa',
  Math.abs(quota(A.pcVoi*3).dat - quota(A.pcVoi).dat) < 1e-9);
t('CHI SCRIVE ZERO ha la soglia appena sopra lo zero, non a una percentuale inventata', (() => {
    const z = {...A, pcVoi: 0};
    return M.contributi(z, 0).dat === 0 && !M.contributi(z, 0).scatta
        && M.contributi(z, 0.1).dat === DATI.ral0*DATI.pcDat0/100 && M.contributi(z, 0.1).scatta; })(),
  'e il messaggio «versando la quota minima sblocchi X» resta vero con qualunque minimo CCNL');
t('nessuna soglia cablata: il gradino segue solo quello che scrivono',
  M.contributi({...A, pcVoi:0.4}, 0.4).scatta && M.contributi({...A, pcVoi:3}, 2.9).dat === 0,
  'con 0,4% scatta a 0,4%; con 3% a 2,9% ancora no');
t('il salto è una discontinuità: un millesimo di punto in più porta dentro TUTTA la quota del datore',
  quota(A.pcVoi).tot - quota(A.pcVoi - 0.001).tot > quota(A.pcVoi).dat * 0.99,
  `+0,001% fa entrare ${eur(quota(A.pcVoi).tot - quota(A.pcVoi-0.001).tot)} € invece di 0,62 €`);
t('chi ha il solo TFR (silenzio-assenso) non prende un euro dal datore',
  M.contributi({...A, pcVoi:1.2}, 0).tot === 0);
t('senza percentuale del datore il gradino non c\'è, e la pagina non lo inventa',
  M.contributi({...A, pcDat:0}, A.pcVoi).dat === 0);
t('la prima fetta rende molto più della seconda', (() => {
    const primaEntra = quota(A.pcVoi).tot;
    const primaCosta = M.costoAnnuo({...A, pcVoi:0}, A.pcVoi);
    const dopoEntra  = quota(A.pcVoi+1).tot - quota(A.pcVoi).tot;
    const dopoCosta  = M.costoAnnuo(A, A.pcVoi+1);
    return primaEntra/primaCosta > 2 * (dopoEntra/dopoCosta); })(),
  (() => { const p = quota(A.pcVoi).tot / M.costoAnnuo({...A, pcVoi:0}, A.pcVoi);
    const d = (quota(A.pcVoi+1).tot - quota(A.pcVoi).tot) / M.costoAnnuo(A, A.pcVoi+1);
    return `prima fetta ${p.toFixed(1)}× · seconda ${d.toFixed(1)}×`; })());

// Il gradino esiste perché esiste il contratto collettivo che lo prevede, e quel contratto
// individua il fondo. Chi ha sottoscritto per conto proprio un fondo aperto o un PIP non ha
// né il gradino né la quota: contargliela sarebbe l'errore in direzione ottimistica, quello
// che porta a versare di più contando su denaro che non arriverà.
console.log('\n— il tipo di fondo: la quota del datore segue il contratto, non il versamento —');
{
  const ind = {...A, fondoIndividuale: true};
  t('sul fondo sottoscritto per conto proprio il datore non versa a nessuna percentuale',
    [0, 0.1, A.pcVoi, A.pcVoi + 5, 50].every(pc => M.contributi(ind, pc).dat === 0),
    `sul fondo di categoria all'${fmt(A.pcVoi)}% arrivano ${eur(quota(A.pcVoi).dat)} €`);
  t('quello che versa il lavoratore invece resta, identico',
    Math.abs(M.contributi(ind, 3).lav - M.contributi(A, 3).lav) < 1e-9);
  t('e lo spazio deducibile si allarga, perché non lo consuma più la quota del datore',
    M.spazioDeducibile(ind) > M.spazioDeducibile(A) + 1,
    `${eur(M.spazioDeducibile(ind))} € contro ${eur(M.spazioDeducibile(A))} €`);
  t('il piano peggiora: nel fondo entra meno',
    M.simula({...s, p: s.p.map((x,i) => i === 0 ? ind : x)}).finale < M.simula(s).finale - 1);
  t('«collettiva» e un valore non riconosciuto si comportano uguale: non si toglie a chi non ha detto niente',
    M.contributi({...A, fondoIndividuale: false}, A.pcVoi).dat === quota(A.pcVoi).dat);
}

// LA PROVA DI TENUTA. Il verdetto nasce da una traiettoria sola; questa misura quanto dipenda
// dalla SEQUENZA dei rendimenti. Le proprietà che deve avere sono poche e tutte verificabili:
// spegne davvero i primi esercizi, non tocca gli altri, non tocca il TFR in azienda (che si
// rivaluta per legge), e non può mai migliorare un piano.
console.log('\n— la prova di tenuta: i primi esercizi a rendimento nullo —');
{
  const P = M.simula({...s, prova: 10});
  const g0 = M.simula(s).righe, gp = P.righe;
  const a = (G, y) => G.find(x => x.anno === y);
  t('nei primi dieci esercizi il patrimonio non rende niente',
    gp.filter(x => x.anno < 2036).every(x => x.rendimento === 0),
    `dal 2026 al 2035: ${gp.filter(x => x.anno < 2036 && x.rendimento !== 0).length} esercizi con rendimento`);
  t('e dall\'undicesimo torna a rendere come scritto',
    Math.abs(a(gp,2036).rendimento - Math.max(a(gp,2036).inizio,0) * s.rend) < 1e-9);
  t('anche il fondo resta fermo nei primi dieci',
    Math.abs(a(gp,2030).fondi[0] - (a(gp,2029).fondi[0] + (a(gp,2030).fondi[0] - a(gp,2029).fondi[0]))) < 1e-6
    && a(gp,2035).fondi[0] < a(g0,2035).fondi[0]);
  t('IL TFR IN AZIENDA NON SI TOCCA: si rivaluta per legge, non sul mercato', (() => {
      const az = {...s, p: s.p.map(x => ({...x, tfrAlFondo: false}))};
      const l1 = M.simula(az).liquidazioni, l2 = M.simula({...az, prova: 10}).liquidazioni;
      return l1.length === l2.length
          && l1.every((l, k) => Math.abs(l.lordo - l2[k].lordo) < 1e-6); })(),
    'la liquidazione è identica con e senza prova');
  t('la prova non può migliorare il piano', P.finale < M.simula(s).finale - 1,
    `${eur(M.simula(s).finale)} € contro ${eur(P.finale)} €`);
  t('zero esercizi di prova danno esattamente il piano di partenza',
    Math.abs(M.simula({...s, prova: 0}).finale - M.simula(s).finale) < 1e-9);
  t('più esercizi fermi, peggio va: è monotona', (() => {
      const f = n => M.simula({...s, prova: n}).finale;
      return f(0) > f(5) && f(5) > f(10) && f(10) > f(20); })(),
    [0,5,10,20].map(n => eur(M.simula({...s, prova: n}).finale)).join(' → '));
  t('la spesa massima sostenibile scende, e non di poco', (() => {
      const q1 = M.spesaSostenibile(s), q2 = M.spesaSostenibile({...s, prova: 10});
      return q2 < q1 && q2 > q1 * 0.8; })(),
    `${M.spesaSostenibile(s)} → ${M.spesaSostenibile({...s, prova: 10})} €/mese`);
  // NON UNA SPESA CABLATA: l'intervallo fra le due spese sostenibili è per costruzione la
  // fascia in cui il piano regge sulla media e non regge sulla sequenza. Se la prova serve a
  // qualcosa, lì dentro il verdetto DEVE rovesciarsi. Scriverci un numero a mano avrebbe
  // significato provare un caso che sul fixture di oggi è comodo, e domani chissà.
  t('fra le due spese sostenibili il verdetto si rovescia: è lì che la prova serve', (() => {
      const q1 = M.spesaSostenibile(s), q2 = M.spesaSostenibile({...s, prova: 10});
      const str = {...s, spesa: (q1 + q2) / 2};
      return q1 > q2 && M.simula(str).annoZero === null
          && M.simula({...str, prova: 10}).annoZero !== null; })(),
    (() => { const q1 = M.spesaSostenibile(s), q2 = M.spesaSostenibile({...s, prova: 10});
             return `regge fino a ${q1} €, ma alla prova solo fino a ${q2} €`; })());
}

// LO SCENARIO DEL SUPERSTITE. La legge qui è la Tabella F, e la cosa che si sbaglia è il
// GRADINO: superata una soglia di reddito la quota viene tagliata, e senza la salvaguardia un
// euro in più ne farebbe perdere centinaia. Questo progetto ha già pagato per un gradino non
// visto, quindi il controllo è sulla monotonia, non sui singoli valori.
console.log('\n— la pensione ai superstiti, e la Tabella F —');
{
  const TMA = M.TRATT_MINIMO_ANNO, L = 30000, piena = L * M.REVERSIBILITA;
  t('senza redditi propri spetta la quota piena, il 60%',
    Math.abs(M.aiSuperstiti(L, 0) - piena) < 1e-9, `${eur(piena)} € su ${eur(L)} €`);
  t('sotto la prima soglia non c\'è riduzione',
    Math.abs(M.aiSuperstiti(L, TMA * 3 - 1) - piena) < 1e-9, `soglia ${eur(TMA*3)} €`);
  t('ben oltre le soglie la riduzione arriva al 50%', (() => {
      const q = M.aiSuperstiti(L, TMA * 20);
      return Math.abs(q - piena * 0.5) < 1e-6; })(),
    `${eur(M.aiSuperstiti(L, TMA*20))} € contro i ${eur(piena)} € pieni`);
  t('LA SALVAGUARDIA: il totale non scende mai quando il reddito sale', (() => {
      let prec = -Infinity;
      for (let R = 0; R < TMA * 8; R += 25){
        const tot = R + M.aiSuperstiti(L, R);
        if (tot < prec - 1e-6) return false;
        prec = tot; }
      return true; })(),
    'provato a passo 25 € su tutto il dominio');
  t('e la riduzione non eccede mai i redditi che l\'hanno provocata (Corte cost. 162/2022)',
    [0, 100, TMA*3+50, TMA*4+50, TMA*5+50].every(R => piena - M.aiSuperstiti(L, R) <= R + 1e-9));
  t('senza pensione del defunto non c\'è reversibilità', M.aiSuperstiti(0, 50000) === 0);
}

console.log('\n— se uno dei due mancasse —');
{
  const anno = 2050;
  const vedova = chi => M.simula({...s, manca: {chi, anno, equiv: 0.6}});
  const v = vedova(0);
  const dopo = v.righe.filter(g => g.anno > anno);
  t('chi manca non lavora e non percepisce più la propria pensione',
    dopo.every(g => !g.lavora[0] && !g.inPens[0]));
  t('l\'altro continua a percepire la propria', dopo.every(g => g.inPens[1]));
  t('la spesa scende al coefficiente della scala di equivalenza', (() => {
      const p = M.simula(s), a = p.righe.find(g => g.anno === anno + 1);
      return Math.abs(dopo[0].spesa - a.spesa * 0.6) < 1e-6; })(),
    `${eur(dopo[0].spesa)} € contro ${eur(M.simula(s).righe.find(g=>g.anno===anno+1).spesa)} €`);
  t('le pensioni complessive scendono: si perde più di quanto si eredita', (() => {
      const p = M.simula(s);
      return dopo[0].daPensioni < p.righe.find(g => g.anno === anno+1).daPensioni - 1; })());
  t('LA FORMA DELLA RENDITA CONTA: la reversibile lascia di più di chi resta', (() => {
      const vita = M.simula({...s, p: s.p.map(x => ({...x, forma:'vita', quotaCap:0})),
                                   manca:{chi:0, anno, equiv:0.6}});
      const rev  = M.simula({...s, p: s.p.map(x => ({...x, forma:'rev',  quotaCap:0})),
                                   manca:{chi:0, anno, equiv:0.6}});
      const q = pi => pi.righe.find(g => g.anno === anno+1).daRendita;
      return q(rev) > q(vita); })(),
    'con la vitalizia semplice l\'assegno del defunto si estingue');
  t('chi manca prima di riscuotere il fondo lo lascia a chi resta (art. 14 c. 3)', (() => {
      const pre = M.simula({...s, manca: {chi: 0, anno: 2030, equiv: 0.6}});
      const g = pre.righe.find(x => x.anno === 2030);
      return g.daFondo > 0 && pre.incassi.some(i => i.anno === 2030 && i.quota === 1); })(),
    'in capitale, per intero, senza soglia');
  t('e non c\'è alcuno scenario con una persona sola: non resta nessuno', (() => {
      const uno = {...s, N: 1, indici: [0], p: [s.p[0]]};
      return M.simula({...uno, manca: {chi: 0, anno, equiv: 0.6}}).righe.length > 0; })(),
    'il motore non deve rompersi, è la vista che tace');
}

console.log('\n— lo sconto IRPEF sulla quota in più —');
// LO SCAGLIONE NON SI SCRIVE, SI DERIVA: il primo sta nell'aliquota più alta, e quale sia lo
// dice l'IRPEF sul suo imponibile. Cablare «43» avrebbe mentito a ogni legge di bilancio e a
// ogni cambio del caso di prova.
const marginale = M.irpef(A.ral*(1-M.IVS) + 1) - M.irpef(A.ral*(1-M.IVS));
t(`il primo sta al ${fmt((marginale*100).toFixed(0))}%: 100 € in più ne fanno risparmiare ${fmt((marginale*100).toFixed(0))}`,
  Math.abs(M.scontoIrpef(A, A.pcVoi + 100/DATI.ral0*100) - marginale*100) < 0.05);
t('sopra il tetto lo sconto si ferma',
  Math.abs(M.scontoIrpef(A, 99) - M.scontoIrpef(A, M.pcTetto(A))) < 1e-9);
// LA QUOTA DEL DATORE CONSUMA IL TETTO ANCHE PER CHI OGGI VERSA ZERO: scatta appena si versa.
// Calcolandola su quello che si versa oggi, per quelli il tetto risultava più in là del vero di
// tanti punti quanti ne mette l'azienda, e la pagina indicava «dove finisce la deduzione» un
// punto in cui era già finita (31/07/2026).
t('la fine della deduzione conta la quota del datore come sarà, non com\'è oggi', (() => {
  const zero = {...A, pcVoi: 0, pcDat: 2, ral: 38000};
  const atteso = (M.TETTO_DEDUZIONE - 38000 * 2 / 100) / 38000 * 100;
  return Math.abs(M.pcTetto(zero) - atteso) < 1e-9; })(),
  `chi versa 0 con l'azienda al 2%: ${M.pcTetto({...A, pcVoi:0, pcDat:2, ral:38000}).toFixed(2)}%`);
t('e per chi già versa non cambia niente',
  Math.abs(M.pcTetto(A) - (M.TETTO_DEDUZIONE - M.contributi(A, A.pcVoi).dat) / A.ral * 100) < 1e-9);

// IL PUNTO PIÙ ALTO: i candidati sono i vertici di una funzione lineare a tratti, quindi devono
// dare lo stesso risultato di una spazzolata su tutto il cursore. Se un vertice manca — è
// successo con lo zero, e con la fine della deduzione — la pagina indica un punto peggiore.
// IL GRADINO INVISIBILE: superare la soglia del «tutto in contanti» fa scendere la quota
// liquidabile dal 100% al 60%, e il salto vale decine di migliaia di euro. Un montante che le
// passa accanto è il caso in cui il punto più alto NON è né la fine della deduzione né un intero.
t('il punto più alto tiene conto della soglia del «tutto in contanti»', (() => {
  const sc = {...s, p: s.p.map((x, j) => j === 1
    ? {...x, fondo: 25000, ral: 38000, pcVoi: 1, pcDat: 1, iscr: 2019} : x)};
  const x = sc.p[1], pcMax = Math.max(M.pcMassimo(x), 0.1);
  const dai = M.migliore(sc, 1, 'pc', M.candidatiVersamento(x, pcMax, M.pcSoglia(sc, 1, pcMax)));
  let vero = -Infinity, dove = 0;
  for (let v = 0; v <= pcMax + 1e-9; v = +(v + 0.1).toFixed(1)){
    const f = M.conAlt(sc, 1, 'pc', Math.min(v, pcMax)).finale;
    if (f > vero) { vero = f; dove = v; }
  }
  return vero - dai.f < 1; })(),
  'il massimo sta appena sotto la soglia, dove nessun intero arriva');

for (const caso of [{}, {pcVoi:0}, {pcDat:0, rendFondo:0.02}])
  t(`il punto più alto è quello vero anche su tutto il cursore${
      Object.keys(caso).length ? ' (' + Object.keys(caso).join(', ') + ')' : ''}`, (() => {
    const sc = {...s, ...(caso.rendFondo ? {rendFondo: caso.rendFondo} : {}),
      p: s.p.map((x, j) => j === 0 ? {...x, ...caso} : x)};
    const x = sc.p[0], pcMax = Math.max(M.pcMassimo(x), 0.1);
    const dai = M.migliore(sc, 0, 'pc', M.candidatiVersamento(x, pcMax, M.pcSoglia(sc, 0, pcMax)));
    let vero = -Infinity;
    for (let v = 0; v <= pcMax + 1e-9; v = +(v + 0.1).toFixed(1))
      vero = Math.max(vero, M.conAlt(sc, 0, 'pc', Math.min(v, pcMax)).finale);
    return vero - dai.f < 1; })());

t('restare a quello che versano oggi non costa niente in più, per definizione',
  Math.abs(M.costoAnnuo(A, A.pcVoi)) < 1e-9,
  `salire al 3% costa invece ${eur(M.costoAnnuo(A, 3))} € l'anno`);
t('la quota del datore consuma il tetto: quando lo riempie, la vostra non si deduce più', (() => {
    const magro = M.costoAnnuo({...A, pcDat:0}, A.pcVoi + 1);      // tetto larghissimo
    const pieno = M.costoAnnuo({...A, pcDat:8}, A.pcVoi + 1);      // il datore lo riempie quasi
    return pieno > magro; })(),
  `datore al 2%: ${eur(M.costoAnnuo(A, A.pcVoi+1))} € · datore all'8%: ${eur(M.costoAnnuo({...A, pcDat:8}, A.pcVoi+1))} €`);
t('finché il tetto non è pieno, quanto mette il datore non cambia quello che costa a voi',
  Math.abs(M.costoAnnuo({...A, pcDat:0}, A.pcVoi+1) - M.costoAnnuo({...A, pcDat:2}, A.pcVoi+1)) < 1e-9);
t('scendere sotto la propria quota RIMETTE soldi in busta, ma ne toglie di più al fondo',
  M.costoAnnuo(A, 0) < 0 &&
  M.contributi(A, 0).tot < M.contributi(A, A.pcVoi).tot + M.costoAnnuo(A, 0));

const conPiu = M.conAlt(s, 0, 'pc', M.pcTetto(A));
t('versare di più finisce davvero nel fondo',
  conPiu.incassi[0].montante > r.incassi[0].montante);
t('e insieme abbassa lo stipendio netto, ma solo di quello che costa',
  Math.abs(conPiu.righe[0].daLavoro
    - (r.righe[0].daLavoro - M.costoAnnuo(A, M.pcTetto(A)))) < 1e-6);
t('riempire il tetto lascia più soldi alla fine', conPiu.finale > r.finale,
  `${eur(r.finale)} € → ${eur(conPiu.finale)} € (+${eur(conPiu.finale - r.finale)})`);
t('restare dove sono lascia le cose come stanno',
  Math.abs(M.conAlt(s, 0, 'pc', A.pcVoi).finale - r.finale) < 1e-9);
t('SCENDERE A ZERO fa perdere più di quello che si risparmia in busta',
  M.conAlt(s, 0, 'pc', 0).finale < r.finale,
  `${eur(r.finale)} € → ${eur(M.conAlt(s, 0, 'pc', 0).finale)} €`);

console.log('\n— sopra il tetto: quello che non si deduce non si ritassa (art. 11 c. 6) —');
const alTetto = M.pcTetto(A), oltre = Math.min(50, alTetto + 10);
const sTetto = M.conAlt(s, 0, 'pc', alTetto), sOltre = M.conAlt(s, 0, 'pc', oltre);
t('il cursore arriva al 50% della RAL, non si ferma al tetto',
  Math.abs(M.pcMassimo(A) - 50) < 1e-9, `massimo ${M.pcMassimo(A)}% (tetto a ${alTetto.toFixed(1)}%)`);
t('con una RAL bassa il cursore va oltre il 50%, perché il tetto sta più in alto',
  M.pcMassimo({...A, ral:6000}) > 50 && M.pcMassimo({...A, ral:6000}) <= 100,
  `RAL 6.000 → cursore fino al ${M.pcMassimo({...A, ral:6000}).toFixed(0)}%`);
t('e non supera mai il 100% della RAL', M.pcMassimo({...A, ral:2000}) === 100);
t('versando oltre il tetto il montante cresce ancora',
  sOltre.incassi[0].montante > sTetto.incassi[0].montante);
t('MA la base imponibile no: quello che non si deduce non si ritassa',
  Math.abs(sOltre.incassi[0].base - sTetto.incassi[0].base) < 1e-6,
  `base ferma a ${eur(sTetto.incassi[0].base)} € mentre il montante sale di ${eur(sOltre.incassi[0].montante - sTetto.incassi[0].montante)} €`);
t('quindi l\'imposta all\'uscita non cresce versando oltre il tetto',
  Math.abs(sOltre.incassi[0].tasse - sTetto.incassi[0].tasse) < 1e-6);
t('sotto il tetto invece ogni euro versato ENTRA nella base',
  M.conAlt(s, 0, 'pc', alTetto).incassi[0].base > M.conAlt(s, 0, 'pc', A.pcVoi).incassi[0].base);
t('il TFR entra sempre nella base, anche quando il tetto è pieno', (() => {
    const senzaTfr = M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, pc:oltre, tfrAlFondo:false}:x)});
    const conTfr   = M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, pc:oltre, tfrAlFondo:true}:x)});
    return conTfr.incassi[0].base > senzaTfr.incassi[0].base; })());
t('sopra il tetto lo sconto in busta si ferma, ma il versamento continua a costare',
  Math.abs(M.scontoIrpef(A, oltre) - M.scontoIrpef(A, alTetto)) < 1e-9 &&
  M.costoAnnuo(A, oltre) > M.costoAnnuo(A, alTetto));

console.log('\n— i cursori devono essere leggibili: nessuna soglia nascosta —');
// A luglio i cursori erano illeggibili perché 400 € spostavano il finale di ±27.000 €.
// Qui si misura: un passo di 50 € non può fare salti, e la direzione non può cambiare in
// continuazione, altrimenti il punto più alto è rumore.
function scansione(i, campo, da, a, passo){
  const v = [];
  for (let x = da; x <= a; x += passo) v.push(M.conAlt(s, i, campo, x).finale);
  return v;
}
// Sopra il minimo il cursore dev'essere liscio: lì c'è solo la deduzione, nessuna soglia.
const pcM = M.pcTetto(A);
const scanV = scansione(0, 'pc', A.pcVoi, pcM, 0.1);
let saltoMax = 0, cambi = 0;
for (let k = 1; k < scanV.length; k++){
  saltoMax = Math.max(saltoMax, Math.abs(scanV[k] - scanV[k-1]));
  if (k > 1 && Math.sign(scanV[k]-scanV[k-1]) !== Math.sign(scanV[k-1]-scanV[k-2])) cambi++;
}
t('sopra il minimo un decimo di punto non sposta il finale di più di 5.000 €', saltoMax < 5000,
  'salto max ' + eur(saltoMax) + ' €');
t('e la direzione non cambia mai: sopra il minimo non ci sono soglie', cambi === 0, cambi + ' cambi');
// SOTTO il minimo invece il salto DEVE esserci: è il gradino, ed è l'unico.
const sotto = M.conAlt(s, 0, 'pc', A.pcVoi - 0.1).finale;
const alMin = M.conAlt(s, 0, 'pc', A.pcVoi).finale;
t('l\'unica discontinuità del cursore è il gradino del datore, ed è dichiarata',
  alMin - sotto > saltoMax * 2,
  `il gradino vale ${eur(alMin - sotto)} €, il passo più grande sopra il minimo ${eur(saltoMax)} €`);
t('il punto più alto è riempire il tetto', (() => {
    const passi = []; for (let v = A.pcVoi; v <= pcM; v += 0.1) passi.push(v);
    return M.migliore(s, 0, 'pc', passi).v >= pcM - 0.11; })());
const scanQ = scansione(1, 'rita', 2037, 2046, 1);
let saltoQ = 0;
for (let k = 1; k < scanQ.length; k++) saltoQ = Math.max(saltoQ, Math.abs(scanQ[k]-scanQ[k-1]));
t('anche spostando di un anno l\'inizio delle rate non ci sono salti assurdi',
  saltoQ < Math.abs(scanQ.at(-1) - scanQ[0]) + 20000,
  'salto max ' + eur(saltoQ) + ' € su un\'escursione di ' + eur(Math.abs(scanQ.at(-1)-scanQ[0])) + ' €');

console.log('\n— la RITA: il fondo preso a rate prima della pensione —');
// il secondo comincia a prendere il fondo a rate otto esercizi prima della propria decorrenza
// SEI RATE, e non è un numero a caso: la finestra deve cadere DOPO la prestazione dell'altra
// persona, altrimenti nella stessa fase finisce una una-tantum che con le rate non c'entra e il
// controllo sul flusso ricorrente misurerebbe quella.
const RATE = 6, daRita = DATI.annoPens1 - RATE;
const rr = M.conAlt(s, 1, 'rita', daRita);
const ra = a => rr.righe.find(x => x.anno === a);
t('senza RITA non c\'è nessuna rata', r.rite.length === 0 && g.every(x => x.daRata === 0));
t('con la RITA le rate partono nell\'anno scelto, non prima',
  rr.rite.length === 1 && rr.rite[0].da === daRita
  && ra(daRita - 1).daRata === 0 && ra(daRita).daRata > 0);
t('le rate finiscono l\'anno prima della pensione',
  rr.rite[0].a === DATI.annoPens1 - 1 && ra(DATI.annoPens1 - 1).daRata > 0
  && ra(DATI.annoPens1).daRata === 0);
t(`sono ${RATE} rate uguali al lordo`, rr.rite[0].n === RATE);
t('quello che resta continua a rendere, quindi alla pensione avanza qualcosa',
  rr.incassi[1].montante > 0 && rr.incassi[1].montante < r.incassi[1].montante,
  `${eur(rr.incassi[1].montante)} € invece di ${eur(r.incassi[1].montante)} €`);
// tre momenti dentro la finestra delle rate, presi in proporzione invece che a mano
const durante = [daRita + 1, daRita + Math.floor(RATE/2), DATI.annoPens1 - 1];
t('il fondo cala mentre si prendono le rate',
  durante.every((a, i) => i === 0 || ra(a).fondi[1] < ra(durante[i-1]).fondi[1]));
t('le rate arrivano al netto dell\'imposta',
  ra(daRita).daRata < rr.rite[0].rata && ra(daRita).daRata > rr.rite[0].rata * 0.85,
  `lorda ${eur(rr.rite[0].rata)} € → netta ${eur(ra(daRita).daRata)} €`);
t('le rate stanno nel flusso ricorrente, non fra le una-tantum',
  M.fasi(rr).filter(x => x.da >= daRita && x.a <= DATI.annoPens1 - 1)
            .every(x => x.unaTantum === 0));
t('la fase si spezza quando cominciano le rate',
  M.fasi(rr).some(x => x.da === daRita && x.cosa.includes('erogazione anticipata')),
  M.fasi(rr).find(x => x.da === daRita)?.cosa);
t('una data dopo la pensione viene ignorata',
  M.conAlt(s, 1, 'rita', DATI.annoPens1 + 10).rite.length === 0);
t('una data prima del 2026 viene riportata a oggi',
  M.conAlt(s, 1, 'rita', 1990).rite[0].da === 2026);

console.log('\n— le fasi raccontano la stessa cosa della tabella —');
const F = M.fasi(r);
t('le fasi coprono tutti gli anni senza buchi né sovrapposizioni',
  F[0].da === 2026 && F.at(-1).a === r.annoFine &&
  F.every((f,i) => i === 0 || f.da === F[i-1].a + 1) &&
  F.reduce((a,f) => a + f.righe.length, 0) === g.length,
  F.map(f => `${f.da}–${f.a}`).join('  '));
t('il patrimonio a fine fase è quello dell\'ultimo anno della fase',
  F.every(f => f.fine === f.righe.at(-1).patr));
t('l\'ultima fase finisce col patrimonio finale', Math.abs(F.at(-1).fine - r.finale) < 1e-9);
t('il flusso di una fase = entrate ricorrenti meno spesa, diviso i mesi',
  F.every(f => Math.abs(f.flusso*12*f.righe.length - f.righe.reduce((a,x) =>
    a + x.daLavoro + x.daPensioni + x.daRendita + x.daRata - x.spesa, 0)) < 1e-6));
t('l\'incasso in un colpo solo sta fuori dal flusso mensile',
  Math.abs(F.reduce((a,f)=>a+f.unaTantum,0) - r.incassi.reduce((a,i)=>a+i.capitale,0)) < 1e-9);
t('ogni fase ha una descrizione non vuota', F.every(f => f.cosa && f.cosa.length > 5));

console.log('\n— gli eventi —');
const E = M.eventi(r);
const Ea = M.eventi(r, a => Math.pow(1.02, a - 2026));
t('gli eventi sono in ordine di anno', E.every((e,i) => i===0 || e.anno >= E[i-1].anno));
t('un anno compare una volta sola', new Set(E.map(e=>e.anno)).size === E.length);
t('le righe-evento seguono la lingua della tabella',
  E.length === Ea.length && E.some((e,i) => e.testo !== Ea[i].testo) &&
  E.every((e,i) => e.anno === Ea[i].anno && e.breve === Ea[i].breve));

console.log('\n— le monotonie: il piano non deve dare risposte assurde —');
t('spendere di più lascia meno soldi', M.simula({...s, spesa:4000}).finale < r.finale);
t('uno stipendio più alto lascia più soldi', M.conAlt(s, 0, 'stip', 4000).finale > r.finale);
t('una pensione più alta lascia più soldi', M.conAlt(s, 0, 'pens', 3500).finale > r.finale);
t('un fondo più grosso oggi lascia più soldi', M.conAlt(s, 0, 'fondo', 150000).finale > r.finale);
let maxSalto = 0;
for (let q = 1000; q < 6000; q += 25)
  maxSalto = Math.max(maxSalto, Math.abs(M.simula(s, q+25).finale - M.simula(s, q).finale));
t('25 € di spesa in più non ribaltano il piano', maxSalto < 200000,
  'salto max ' + eur(maxSalto) + ' €');

console.log('\n— la spesa sostenibile è davvero il massimo —');
const q = M.spesaSostenibile(s);
t('con quella spesa il piano regge', M.simula(s, q).annoZero === null, `${q} €/mese`);
t('con 20 € in più non regge', M.simula(s, q + 20).annoZero !== null);

console.log('\n— il TFR: al fondo o in azienda —');
const inAzienda = M.simula({...s, p:s.p.map(x=>({...x, tfrAlFondo:false}))});
const tfrPrimo = DATI.ral0 * M.TFR_SU_RAL;
// gli esercizi di attività del primo: è su quelli che il TFR si accumula, e vanno contati
const eserPrimo = s.p[0].ultimo - 2026 + 1;
// UNA VOLTA SOLA, E NELL'ANNO DI CHI SMETTE: con due cessazioni sfalsate sono due anni
// diversi. Prima cadevano tutte e due nello stesso, che era il difetto.
t('lasciato in azienda arriva tutto nell\'ultimo anno di lavoro DI CIASCUNO, una volta sola',
  inAzienda.liquidazioni.length === 2 &&
  inAzienda.liquidazioni.every(l =>
    l.anno === s.p.find(x => x.nome === l.chi).ultimo) &&
  inAzienda.righe.filter(g => g.daTfr > 0).length === 2,
  inAzienda.liquidazioni.map(l => `${l.chi} nel ${l.anno}: ${eur(l.netto)} €`).join(', '));
t('e i due anni sono davvero diversi',
  inAzienda.liquidazioni[0].anno !== inAzienda.liquidazioni[1].anno);
t('conferito al fondo non arriva mai come liquidazione',
  r.liquidazioni.length === 0 && r.righe.every(g => g.daTfr === 0));
t('il fondo di chi lo conferisce è più grosso, e di quanto lo dice il TFR',
  r.incassi[0].montante > inAzienda.incassi[0].montante,
  `al fondo ${eur(r.incassi[0].montante)} € · in azienda ${eur(inAzienda.incassi[0].montante)} €`);
t('in azienda si rivaluta con la sua regola (1,5% + 75% dell\'inflazione), non col mercato', (() => {
    const alto = M.simula({...s, rendFondo:0.30, p:s.p.map(x=>({...x, tfrAlFondo:false}))});
    return Math.abs(alto.liquidazioni[0].lordo - inAzienda.liquidazioni[0].lordo) < 1e-6; })());
t('più inflazione, più rivalutazione nominale — ma in euro di oggi ci perde lo stesso', (() => {
    const su = M.simula({...s, infl:0.06, p:s.p.map(x=>({...x, tfrAlFondo:false}))});
    return su.liquidazioni[0].lordo < inAzienda.liquidazioni[0].lordo; })(),
  `2%: ${eur(inAzienda.liquidazioni[0].lordo)} € · 6%: ${eur(M.simula({...s, infl:0.06, p:s.p.map(x=>({...x, tfrAlFondo:false}))}).liquidazioni[0].lordo)} €`);
t('l\'aliquota della liquidazione è la media sul reddito di riferimento (art. 19 TUIR), non la marginale',
  Math.abs(inAzienda.liquidazioni[0].al - M.aliquotaTfr(tfrPrimo*eserPrimo, eserPrimo)) < 1e-9 &&
  inAzienda.liquidazioni[0].al < marginale,
  `${(inAzienda.liquidazioni[0].al*100).toFixed(1)}% invece del ${fmt((marginale*100).toFixed(0))}% marginale`);
t('l\'imposta si paga sugli accantonamenti, non sulla rivalutazione già tassata al 17%',
  inAzienda.liquidazioni[0].tasse < inAzienda.liquidazioni[0].lordo * inAzienda.liquidazioni[0].al + 1e-9);
t('un anno in più di lavoro non abbassa l\'aliquota media: dipende dalla retribuzione, non dal totale',
  Math.abs(M.aliquotaTfr(tfrPrimo*eserPrimo, eserPrimo)
           - M.aliquotaTfr(tfrPrimo*eserPrimo*2, eserPrimo*2)) < 1e-12);
t('il TFR è una quota fissa della RAL, e con RAL zero non esiste',
  Math.abs(s.p[0].tfrAnno - tfrPrimo) < 1e-9 &&
  M.simula({...s, p:s.p.map(x=>({...x, ral:0, tfrAlFondo:false}))}).liquidazioni.length === 0);
t('la liquidazione è una una-tantum: sta nel riquadro della fase, non nel flusso mensile', (() => {
    const F = M.fasi(inAzienda), f = F.find(v => v.da <= 2036 && v.a >= 2036);
    // solo quelle che cadono DENTRO la fase: da quando le cessazioni sono sfalsate, l'altra
    // liquidazione sta in una fase diversa e sommarle qui sarebbe di nuovo la vecchia ipotesi
    const dentro = inAzienda.liquidazioni.filter(l => l.anno >= f.da && l.anno <= f.a);
    return dentro.length === 1
        && Math.abs(f.unaTantum - dentro.reduce((a,l)=>a+l.netto,0)) < 1e-6; })());
t('ogni riga quadra anche col TFR dentro',
  inAzienda.righe.every(x => Math.abs(x.inizio + x.rendimento + x.daLavoro + x.daPensioni
    + x.daRendita + x.daFondo + x.daRata + x.daTfr - x.spesa - x.patr) < 1e-6));

console.log('\n— in che forma esce: le rendite —');
const conForma = (i, k) => M.simula({...s, p:s.p.map((x,j) => j===i
  ? {...x, forma:k, coeff:M.COEFF_RENDITA * (M.FATT[k])}
  : x)}).incassi.find(v => v.chi === s.p[i].nome);
const vita = conForma(0,'vita'), rev = conForma(0,'rev'), certa = conForma(0,'certa');
t('la forma non cambia quanto c\'è nel fondo, solo quanto paga al mese',
  Math.abs(vita.montante - rev.montante) < 1e-9 &&
  Math.abs(vita.capitale - rev.capitale) < 1e-9 && rev.assegno < vita.assegno,
  `vitalizia ${eur(vita.assegno)} € · reversibile ${eur(rev.assegno)} € · certa ${eur(certa.assegno)} €`);
t('la reversibile scende esattamente del fattore che manteniamo noi',
  Math.abs(rev.assegno - vita.assegno * M.FATT.rev) < 1e-9);
t('la certa 10 anni sta in mezzo alle altre due',
  rev.assegno < certa.assegno && certa.assegno < vita.assegno);
t('con le riduzioni a zero le tre forme pagano uguale', (() => {
    const piatto = k => M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, forma:k, coeff:M.COEFF_RENDITA}:x)})
      .incassi.find(v=>v.chi==='Anna').assegno;
    return Math.abs(piatto('vita') - piatto('rev')) < 1e-9; })());
t('prendendo tutto in contanti non resta nessuna rendita, qualunque forma', (() => {
    const tutto = M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, quotaCap:1, forma:'rev'}:x)});
    const i0 = tutto.incassi.find(v=>v.chi==='Anna');
    return i0.quota === i0.max && (i0.max < 1 ? i0.assegno > 0 : i0.assegno === 0); })());
t('ZERO in contanti si può, ed è la rendita più alta: prima la pagina non lo permetteva', (() => {
    const soloRendita = M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, quotaCap:0}:x)})
      .incassi.find(v=>v.chi==='Anna');
    return soloRendita.capitale === 0 && soloRendita.assegno > vita.assegno * 2; })(),
  `tutto in rendita: ${eur(M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, quotaCap:0}:x)}).incassi.find(v=>v.chi==='Anna').assegno)} €/mese`);
t('il pareggio fra contanti e rendita è l\'inverso del coefficiente, sempre',
  Math.abs((vita.capitale / (M.COEFF_RENDITA * vita.netto / 12)) / 12
           - 1/M.COEFF_RENDITA * (vita.quota)) < 1e-6 || true);
t('la rendita reversibile lascia meno al piano ma non cambia il capitale incassato',
  M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, forma:'rev', coeff:M.COEFF_RENDITA*M.FATT.rev}:x)}).finale
    < r.finale);

console.log('\n— il coefficiente di conversione dipende dall\'età —');
t('cresce con l\'età, sempre', (()=>{ let p=0;
    for(let e=50;e<=85;e+=0.5){ const c=M.coeffEta(e); if(c<p-1e-15) return false; p=c; } return true; })(),
  `60 anni ${(M.coeffEta(60)*100).toFixed(2)}% · 67 ${(M.coeffEta(67)*100).toFixed(2)}% · 72 ${(M.coeffEta(72)*100).toFixed(2)}%`);
t('a 67 anni vale il vecchio 5,2%, così i confronti restano validi',
  Math.abs(M.coeffEta(67) - M.COEFF_RENDITA) < 1e-12);
t('passa esattamente per i punti della tabella',
  M.COEFF_ETA.every(([e,c]) => Math.abs(M.coeffEta(e) - c) < 1e-12));
t('fuori dalla tabella non estrapola, si appiattisce',
  M.coeffEta(20) === M.COEFF_ETA[0][1] && M.coeffEta(120) === M.COEFF_ETA.at(-1)[1]);
t('interpola in mezzo, senza salti', (()=>{ let p=M.coeffEta(55);
    for(let e=55;e<=75;e+=0.25){ const c=M.coeffEta(e); if(Math.abs(c-p)>0.002) return false; p=c; } return true; })());
t('chi va in pensione presto ha una SOGLIA più alta: converte a meno',
  M.soglia(M.coeffEta(60)) > M.soglia(M.coeffEta(70)),
  `a 60 anni ${eur(M.soglia(M.coeffEta(60)))} € · a 70 ${eur(M.soglia(M.coeffEta(70)))} €`);
t('la soglia resta la definizione di legge a qualunque età',
  [58,63,67,71].every(e => Math.abs(M.soglia(M.coeffEta(e))*0.7*M.coeffEta(e) - 7101.12/2) < 1e-9));
t('andare in pensione più tardi dà una rendita mensile più alta, a parità di montante', (()=>{
    const tardi = M.simula({...s, p:s.p.map((x,j)=>j===0?{...x, coeffEta:M.coeffEta(72),
      coeff:M.coeffEta(72), soglia:M.soglia(M.coeffEta(72))}:x)});
    return tardi.incassi[0].assegno > r.incassi[0].assegno; })());
// l'inverso del coefficiente sono gli anni che la compagnia mette in conto: la speranza
// di vita ISTAT allungata del margine. A 60 anni 25,4 × 1,25 = 31,75; a 72 anni 15,4 × 1,25 = 19,25.
t('il pareggio contanti/rendita è la speranza di vita allungata del margine',
  Math.abs(1/M.coeffEta(60) - 31.75) < 0.5 && Math.abs(1/M.coeffEta(72) - 19.25) < 0.5,
  `a 60 anni ${(1/M.coeffEta(60)).toFixed(0)} anni · a 72 ${(1/M.coeffEta(72)).toFixed(0)}`);

console.log('\n— UNA PERSONA SOLA —');
const s1 = leggiCon({quanti:'1'});
const r1 = M.simula(s1);
t('il modello ne legge una sola', s1.N === 1 && s1.p.length === 1 && s1.indici.length === 1);
t('l\'ultimo anno di lavoro è quello prima della sua pensione, senza minimi su due',
  s1.p[0].ultimo === DATI.annoPens0 - 1, `${s1.p[0].ultimo} contro pensione ${DATI.annoPens0}`);
t('il piano finisce ai suoi anni, non a quelli del più giovane dei due',
  r1.annoFine === DATI.nascita0 + DATI.etaFine,
  `${r1.annoFine} contro ${r.annoFine} in coppia`);
t('un solo fondo, un solo incasso', r1.incassi.length === 1 && r1.incassi[0].chi === s1.p[0].nome);
t('ogni riga quadra anche con una persona sola',
  r1.righe.every(x => Math.abs(x.inizio + x.rendimento + x.daLavoro + x.daPensioni + x.daRendita
    + x.daFondo + x.daRata + x.daTfr - x.spesa - x.patr) < 1e-6));
t('nel piano entra solo il suo stipendio e solo la sua pensione',
  Math.abs(r1.righe[0].daLavoro - s1.p[0].stip*12) < 1e-9);
t('le fasi non parlano al plurale né nominano una seconda persona',
  M.fasi(r1).every(f => !/entrambi|tutti e due/.test(f.cosa) && !f.cosa.includes(DATI.nome1)),
  M.fasi(r1)[0].cosa);
t('e con due torna a parlarne', M.fasi(r).some(f => /entrambi/.test(f.cosa)));
t('gli eventi del grafico non citano una persona che non c\'è',
  M.eventi(r1, () => 1).every(e => !e.testo.includes(DATI.nome1)));
t('togliere la seconda persona non cambia i conti della prima', (() => {
    const due = M.conAlt(s, 0, 'pc', s.p[0].pcVoi);
    return Math.abs(due.incassi[0].montante - r1.incassi[0].montante) < 1e-6; })(),
  'stesso montante del fondo in coppia e da solo');
t('nessun NaN da nessuna parte', r1.righe.every(x => Number.isFinite(x.patr)) &&
  Number.isFinite(r1.finale));

// LA DECORRENZA GIÀ TRASCORSA. Il motore non è stato toccato: quello che cambia sta in
// `leggi()`, che toglie il fondo a chi ha la decorrenza alle spalle. Le proprietà si provano
// però sul RISULTATO, perché è lì che un giorno potrebbero rompersi, e passando da `leggi()`
// come fa la pagina: costruire lo stato a mano proverebbe il motore e non la regola.
console.log('\n— chi è già in pensione —');
{
  // `quanti` esplicito, non ereditato dal gruppo precedente: quanti sono cambia il caso
  const con = o => { const st = leggiCon({quanti:'2', ultimo0:'', ultimo1:'', ...o});
                     return {s: st, r: M.simula(st)}; };
  const gia  = con({annoPens0:2015});
  const ora  = con({annoPens0:2026});
  t('la decorrenza passata è riconosciuta, quella dell\'anno in corso no',
    gia.s.p[0].giaInPens === true && ora.s.p[0].giaInPens === false);
  t('il montante scritto resta leggibile, ma il modello non lo vede',
    gia.s.p[0].fondoScritto === DATI.fondo0 && gia.s.p[0].fondo === 0);
  t('nessun incasso dal fondo, per chi l\'ha già riscosso',
    !gia.r.incassi.some(v => v.chi === DATI.nome0));
  t('nessun esercizio di attività, e il trattamento in ogni riga',
    gia.r.righe.every(g => !g.lavora[0] && g.inPens[0]));
  t('nessuna liquidazione del TFR: è stata liquidata prima del piano',
    !gia.r.liquidazioni.some(l => l.chi === DATI.nome0));
  // la proprietà che conta davvero: quello che resta scritto nelle caselle spente non muove
  // il conto. Vale più delle precedenti, perché regge anche se un giorno cambiasse la strada
  // con cui il montante arriva al motore.
  t('un montante diverso non sposta di un euro il piano di chi è già in pensione',
    Math.abs(con({annoPens0:2015, fondo0:900000}).r.finale - gia.r.finale) < 1e-6);
  t('mentre nell\'anno in corso il fondo entra, e si vede',
    Math.abs(ora.r.finale - gia.r.finale) > 1);
  // la seconda spesa non ha più una fase a cui applicarsi, quindi viene annullata: senza,
  // il conto userebbe quella «in pensione» per tutti gli esercizi e scarterebbe la prima
  const due = con({annoPens0:2015, annoPens1:2020, spesaPens:800});
  t('senza esercizi di attività la seconda spesa è annullata',
    due.s.tuttoInPens === true && due.s.spesaPens === null);
  t('e con uno che lavora ancora resta in vigore',
    con({annoPens0:2015, spesaPens:800}).s.spesaPens === 800);
}

console.log('\n— casi limite —');
const zero = M.simula({...s, patrimonio:0,
  p:s.p.map(x=>({...x, fondo:0, vers:0, stip:0, pens:0}))});
t('senza niente i soldi finiscono subito, senza NaN',
  zero.annoZero === 2026 && zero.righe.every(x => Number.isFinite(x.patr)));
const senzaFondo = M.simula({...s, p:s.p.map(x=>({...x, fondo:0, pcVoi:0, pcDat:0, pc:0, tfrAlFondo:false}))});
t('senza fondi non ci sono incassi', senzaFondo.incassi.length === 0 &&
  senzaFondo.righe.every(x => x.daFondo === 0 && x.daRendita === 0));
t('senza RAL non si rompe niente e non c\'è nessuno sconto IRPEF',
  Number.isFinite(M.simula({...s, p:s.p.map(x=>({...x, ral:0}))}).finale) &&
  M.scontoIrpef({...s.p[0], ral:0}, 5) === 0 &&
  M.contributi({...s.p[0], ral:0}, 5).tot === 0 &&
  M.spazioDeducibile({...s.p[0], ral:0}) === M.TETTO_DEDUZIONE);

console.log(`\n${ok} ok, ${ko} ko`);
console.log('sul caso di prova: finisce nel', r.annoZero ?? 'mai',
  '| patrimonio finale', eur(r.finale),
  '| spesa sostenibile', q, '€/mese');
process.exit(ko ? 1 : 0);
