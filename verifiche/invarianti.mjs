import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// PERCORSO RELATIVO, come le altre verifiche. Qui c'era un percorso assoluto con la cartella
// personale di chi l'ha scritto: funzionava solo su quella macchina, e avrebbe fatto fallire la
// pubblicazione automatica al primo tentativo. Un percorso assoluto in un progetto che vive in
// un repository è un errore che si scopre soltanto altrove.
const QUI = dirname(fileURLToPath(import.meta.url));
// LA PAGINA HA PIÙ DI UNO <script>. Da quando il piè di pagina porta con sé il banner del
// consenso, il primo è quello: prendere «il primo» faceva caricare quaranta righe di banner al
// posto del motore, e l'armatura falliva su un codice giusto.
// Si sceglie dicendo COSA si vuole — il blocco che contiene il motore — invece di fidarsi
// dell'ordine in cui il build monta i pezzi.
const src = [...fs.readFileSync(join(QUI, '..', 'sito', 'index.html'), 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(t => /function simula\(/.test(t));
let DATI={};
const finto=()=>({value:'',innerHTML:'',className:'',textContent:'',checked:false,min:'',max:'',disabled:false,style:{},dataset:{},addEventListener(){},get nextElementSibling(){return finto()},get parentElement(){return finto()}});
// `body` serve perché la pagina, appena caricata, spegne la seconda colonna quando la persona
// è una sola: è l'unica cosa che `calc()` fa PRIMA di accorgersi che il modulo è incompleto.
// Era l'unica delle cinque armature a non averlo, e finché quella riga stava in fondo non si
// vedeva. Un DOM finto incompleto non dice «manca un pezzo qui»: fa fallire il codice buono.
// `addEventListener` sulla finestra: la pagina lo usa per aprire il dettaglio prima della
// stampa. Nei DOM finti non esiste, ed è la quinta volta che un'armatura incompleta fa
// cadere codice buono: si completa l'armatura, non si indebolisce la pagina.
globalThis.addEventListener = globalThis.addEventListener || (() => {});
// `window` esiste sempre in un browser, e la pagina lo nomina per l'evento della misurazione.
// Nei DOM finti non c'era: sesta volta che un'armatura incompleta fa cadere codice buono.
// Puntato a `globalThis`, così `window.gtag` resta indefinito e l'evento non parte mai qui.
globalThis.window = globalThis;
globalThis.document={body:{classList:{toggle(){}}},
  getElementById:id=>Object.assign(finto(),{value:String(DATI[id]??0)}),querySelectorAll:()=>[]};
const M=new Function(src+`\nreturn {leggi,simula,irpef,aliquota,aliquotaTfr,quotaMax,SOGLIA_TUTTO,soglia,coeffEta,
  COEFF_RENDITA,QUOTA_ORDINARIA,ASSEGNO_SOCIALE,TETTO_DEDUZIONE,TFR_SU_RAL,spazioDeducibile,contributi,costoAnnuo,pcTetto,
  aiSuperstiti,TRATT_MINIMO_ANNO,REVERSIBILITA,vitaIntera,FRAZ_ANNI_MIN,aliquotaFraz};`)();

let n=0; const rotte={};
const ko=(k,d)=>{ (rotte[k]??=[]).push(d); };
const R=(a,b)=>a+Math.random()*(b-a), I=(a,b)=>Math.floor(R(a,b+1)), P=l=>l[I(0,l.length-1)];

for (let t=0; t<4000; t++){
  const n0=I(1950,1990), n1=I(1950,1990);
  DATI={patrimonio:Math.round(R(0,900000)), spesa:Math.round(R(0,9000)),
    spesaPens: P(['', Math.round(R(0,9000))]),
    rend:+R(-2,12).toFixed(1), infl:+R(0,8).toFixed(1), rendFondo:+R(-2,12).toFixed(1),
    etaFine:I(70,105),
    quanti: P(['1','2']), nome0:'Anna', nome1:'Bruno', forma0:P(['vita','rev','certa','durata','frazionata']), forma1:P(['vita','rev','certa','durata','frazionata']),
    anniFraz0:P(['', I(1,40)]), anniFraz1:P(['', I(1,40)]),
    cresc0: P(['', +R(0,6).toFixed(1)]), cresc1: P(['', +R(0,6).toFixed(1)]),
    nascita0:n0, ral0:Math.round(R(0,200000)),
    // LA DECORRENZA PUÒ ESSERE GIÀ TRASCORSA: chi è in pensione da anni usa questa pagina come
    // chiunque altro, ed è il caso in cui il fondo non deve rientrare nel piano. Il confine
    // (l'anno in corso) va attraversato spesso, non sfiorato: si estrae da un intervallo che
    // lo contiene, così una regola scritta con `<=` invece di `<` non passa inosservata.
    pens0:Math.round(R(0,6000)), annoPens0:I(1995,2055),
    fondo0:Math.round(R(0,600000)), pcVoi0:+R(0,4).toFixed(1), pcDat0:+R(0,4).toFixed(1), pc0:'',
    tipoFondo0:P(['collettiva','individuale']),
    tfrDove0:P(['fondo','azienda']), iscr0:I(1980,2030),
    quotaCap0:+R(0,1).toFixed(2),
    nascita1:n1, ral1:Math.round(R(0,200000)),
    pens1:Math.round(R(0,6000)), annoPens1:I(1995,2055),
    fondo1:Math.round(R(0,600000)), pcVoi1:+R(0,4).toFixed(1), pcDat1:+R(0,4).toFixed(1), pc1:'',
    tipoFondo1:P(['collettiva','individuale']),
    tfrDove1:P(['fondo','azienda']), iscr1:I(1980,2030),
    quotaCap1:+R(0,1).toFixed(2)};
  DATI.rita0=I(2026,DATI.annoPens0); DATI.rita1=I(2026,DATI.annoPens1);
  // l'ultimo anno di lavoro: vuoto (fino alla propria pensione), prima, o anche dopo —
  // quest'ultimo dev'essere ricondotto, e le invarianti lo controllano
  DATI.ultimo0=P(['', I(2020,2060)]); DATI.ultimo1=P(['', I(2020,2060)]);
  // L'ABITAZIONE. L'anno si estrae da un intervallo che contiene sia l'anno in corso sia la
  // fine di molti piani: così vengono attraversati tutti e tre i confini — la vendita già
  // trascorsa che va ricondotta, quella nel primo esercizio, e quella oltre l'orizzonte, che
  // non deve entrare nel conto. Il prezzo della nuova può superare il valore venduto: il
  // ricavato negativo è un caso lecito, non uno da escludere.
  DATI.casaCosa = P(['resto','resto','piccola','affitto']);
  DATI.casaAnno = P(['', I(2015,2075)]);
  DATI.casaValore = P(['', Math.round(R(0,700000))]);
  DATI.casaNuova  = P(['', Math.round(R(0,700000))]);
  DATI.casaCanone = P(['', Math.round(R(0,3000))]);
  let s,r;
  try { s=M.leggi(); r=M.simula(s); } catch(e){ ko('il motore va in errore', e.message); continue; }
  n++;
  // --- niente NaN, niente infiniti, da nessuna parte
  if (!r.righe.every(g=>[g.patr,g.inizio,g.rendimento,g.daLavoro,g.daPensioni,g.daRendita,
      g.daFondo,g.daRata,g.daTfr,g.daCasa].every(Number.isFinite))) ko('NaN o Infinity in una riga','');
  // --- CONTABILITÀ: ogni riga deve quadrare. `daCasa` ci sta dentro perché è una voce di
  // flusso come le altre: se un giorno entrasse nel patrimonio senza passare di qui, la riga
  // smetterebbe di essere rifacibile a mano ed è quello che la tabella promette.
  for (const g of r.righe){
    const q = g.inizio+g.rendimento+g.daLavoro+g.daPensioni+g.daRendita+g.daFondo+g.daRata+g.daTfr+g.daCasa-g.spesa-g.patr;
    if (Math.abs(q) > 1e-6*Math.max(1,Math.abs(g.patr))) ko('una riga non quadra', q);
  }
  // --- L'ABITAZIONE ------------------------------------------------------------------
  {
    const c = s.casa;
    const somma = r.righe.reduce((a,g)=>a+g.daCasa, 0);
    const dentro = c.attiva && c.anno <= r.annoFine;
    // il ricavato entra UNA VOLTA SOLA, e solo se l'anno cade dentro il piano
    if (Math.abs(somma - (dentro ? c.ricavato : 0)) > 1e-6)
      ko('il ricavato della casa non entra una volta sola', somma+' contro '+(dentro?c.ricavato:0));
    if (dentro && r.righe.some(g => g.daCasa !== 0 && g.anno !== c.anno))
      ko('il ricavato della casa entra in un anno che non è il suo','');
    // scegliere «resto» deve lasciare il piano identico a quello di chi non ha scritto nulla:
    // se una casella della casa filtrasse nel conto da spenta, sarebbe invisibile in pagina
    if (!c.attiva){
      const nudo = M.simula({...s, casa: {...c, valore:0, nuova:0, canone:0,
                                          ricavato:0, spesaAnnua:0}});
      if (Math.abs(nudo.finale - r.finale) > 1e-6)
        ko('la casa muove il piano anche da spenta', nudo.finale - r.finale);
    }
    // IL CANONE NON PASSA DALLA BISEZIONE. `spesaSostenibile` cerca la spesa massima scalando
    // `spesa` di un fattore: se il canone finisse dentro quel fattore, il conto «risolverebbe»
    // un piano stretto facendo pagare meno di affitto, che non è una leva di chi ci abita.
    // La proprietà si controlla al contrario, ed è esatta: la differenza di spesa fra due
    // simulazioni con importi diversi non deve dipendere dal canone.
    if (c.attiva && c.spesaAnnua > 0 && s.spesa > 0){
      const a1 = M.simula(s, s.spesa), a2 = M.simula(s, s.spesa * 2);
      const senza = {...s, casa: {...c, spesaAnnua: 0}};
      const b1 = M.simula(senza, s.spesa), b2 = M.simula(senza, s.spesa * 2);
      for (let k = 0; k < a1.righe.length; k++){
        const d1 = a1.righe[k].spesa - b1.righe[k].spesa;
        const d2 = a2.righe[k].spesa - b2.righe[k].spesa;
        if (Math.abs(d1 - d2) > 1e-6){ ko('il canone si muove con la spesa cercata', d1+' contro '+d2); break; }
      }
      // E NEMMENO DALLA SCALA DI EQUIVALENZA, che è un moltiplicatore diverso e va controllato
      // a parte: la prima versione di questa invariante guardava solo la bisezione, e spostando
      // il canone dentro `equiv` restava verde su tutti e 4.000 i piani.
      // Un appartamento già affittato costa uguale in uno o in due; la scala vale sui consumi.
      if (s.N === 2){
        const quando = Math.min(c.anno + 3, r.annoFine);
        const m = {chi: 0, anno: quando, equiv: 0.60};
        const conM   = M.simula({...s, manca: m});
        const senzaM = M.simula({...s, manca: m, casa: {...c, spesaAnnua: 0}});
        const dopo = conM.righe.findIndex(g => g.anno === quando);
        if (dopo >= 0 && Math.abs((conM.righe[dopo].spesa - senzaM.righe[dopo].spesa)
                                  - c.spesaAnnua) > 1e-6)
          ko('il canone si riduce con la scala di equivalenza',
             (conM.righe[dopo].spesa - senzaM.righe[dopo].spesa) + ' contro ' + c.spesaAnnua);
      }
    }
  }
  for (let i=1;i<r.righe.length;i++)
    if (Math.abs(r.righe[i].inizio - r.righe[i-1].patr) > 1e-9) ko('discontinuità fra due anni','');
  // --- LEGGE: quota in capitale mai oltre il massimo concesso
  for (const i of r.incassi){
    const atteso = i.montante < i.soglia ? 1 : M.QUOTA_ORDINARIA;
    if (Math.abs(i.max-atteso)>1e-12) ko('il massimo di legge non segue la soglia', i.montante);
    if (i.quota > i.max + 1e-12) ko('capitale oltre il massimo di legge', i.quota+'>'+i.max);
    if (i.quota < -1e-12) ko('quota negativa', i.quota);
    if (i.al < 0.09-1e-12 || i.al > 0.15+1e-12) ko('aliquota fondo fuori dal 9–15%', i.al);
    if (i.base > i.montante + 1e-6) ko('base imponibile sopra il montante', i.base-i.montante);
    if (i.base < -1e-9) ko('base imponibile negativa', i.base);
    if (i.tasse > i.montante + 1e-6) ko('imposta sopra il montante','');
    if (i.capitale < -1e-9) ko('capitale negativo','');
    if (i.assegno < -1e-9) ko('rendita negativa','');
    // capitale + valore della rendita non può superare il netto
    if (i.capitale > (i.montante-i.tasse) + 1e-6) ko('capitale sopra il netto','');
  }
  // --- LEGGE: la liquidazione TFR e la sua aliquota
  for (const l of r.liquidazioni){
    if (l.al < 0 || l.al > 0.43+1e-12) ko('aliquota TFR fuori scala', l.al);
    if (l.tasse > l.lordo + 1e-6) ko('imposta TFR sopra il lordo','');
    if (l.netto < -1e-9) ko('TFR netto negativo','');
    // l'ultimo anno di lavoro è di ciascuno: il TFR di uno non può essere liquidato quando
    // smette l'altro. Prima questo controllo leggeva sempre `p[0]`, e reggeva solo perché il
    // motore imponeva la stessa data a tutti e due.
    const suo = s.p.find(x => x.nome === l.chi);
    if (!suo) ko('liquidazione TFR senza una persona a cui attribuirla', l.chi);
    else if (l.anno !== suo.ultimo)
      ko('TFR liquidato in un anno che non è l\'ultimo di lavoro di quella persona',
         `${l.chi}: ${l.anno} invece di ${suo.ultimo}`);
  }
  // --- LEGGE: il tetto di deducibilità non lo tocca il TFR
  if (s.p.length !== s.N) ko('p e N non concordano','');
  for (const x of s.p){
    const c0 = M.contributi(x, x.pcVoi), cSotto = M.contributi(x, Math.max(0,x.pcVoi-0.01));
    if (x.pcVoi > 0 && cSotto.dat !== 0) ko('il datore versa anche sotto il minimo','');
    if (x.pcVoi > 0 && x.pcDat > 0 && x.ral > 0 && !(M.contributi(x, x.pcVoi*5).dat === c0.dat))
      ko('il contributo del datore cresce col versamento (non deve)','');
    // Su un fondo sottoscritto per conto proprio il datore non versa a NESSUNA percentuale.
    // Basta una combinazione che lo faccia comparire perché il conto prometta denaro che non
    // arriverà, ed è l'errore in direzione ottimistica: quello che fa versare di più.
    if (x.fondoIndividuale)
      for (const pc of [0, 0.1, x.pcVoi, x.pcVoi + 1, 50])
        if (M.contributi(x, pc).dat !== 0)
          ko('fondo individuale con contributo del datore', `al ${pc}%`);
    if (M.spazioDeducibile(x) > M.TETTO_DEDUZIONE + 1e-9 || M.spazioDeducibile(x) < 0)
      ko('spazio deducibile fuori scala', M.spazioDeducibile(x));
    if (!Number.isFinite(M.costoAnnuo(x, x.pcVoi + 1))) ko('costo annuo NaN','');
    if (x.pens > x.pensLorda + 1e-9) ko('pensione netta sopra la lorda','');
    if (x.pensLorda > 0 && x.pens <= 0) ko('pensione netta azzerata','');
    // NESSUNO LAVORA OLTRE LA PROPRIA DECORRENZA: il conto pagherebbe retribuzione e
    // trattamento nello stesso esercizio. Vale anche per chi scrive un anno più in là,
    // che dev'essere ricondotto e non accettato.
    if (x.ultimo > x.annoPens - 1)
      ko('attività oltre la decorrenza del proprio trattamento', `${x.ultimo} con decorrenza ${x.annoPens}`);
  }
  // --- CHI HA LA DECORRENZA GIÀ TRASCORSA: il fondo sta fuori dal piano.
  // La prestazione è stata riscossa prima dell'anno iniziale, quindi quel capitale è già dentro
  // «patrimonio investito». Se rientrasse verrebbe contato due volte, e all'insaputa di chi
  // compila: è l'errore in direzione ottimistica, il peggiore su questa pagina. Il confine è
  // l'anno in corso ESCLUSO — chi decorre nel 2026 riscuote dentro il piano, all'età giusta.
  for (const i of s.indici){
    const x = s.p[i];
    if (!x.giaInPens) continue;
    if (x.fondo !== 0) ko('fondo non azzerato per chi è già in pensione', x.fondo);
    if (r.righe.some(g => g.fondi[i] !== 0)) ko('montante non nullo per chi è già in pensione','');
    if (r.incassi.some(v => v.chi === x.nome)) ko('incasso dal fondo a chi è già in pensione','');
    if (r.righe.some(g => g.rate[i])) ko('rate anticipate a chi è già in pensione','');
    if (r.righe.some(g => g.lavora[i])) ko('esercizio di attività a chi è già in pensione','');
    if (r.liquidazioni.some(l => l.chi === x.nome)) ko('TFR liquidato a chi è già in pensione','');
    // il piano principale non fa mancare nessuno, quindi il trattamento c'è in ogni esercizio
    if (!r.righe.every(g => g.inPens[i]))
      ko('un esercizio senza trattamento per chi è già in pensione', x.annoPens);
  }
  // LA PROPRIETÀ FORTE, che le precedenti non colgono: quello che si scrive nella casella del
  // fondo non deve muovere il piano di chi è già in pensione. Le altre guardano il risultato di
  // UNA lettura; questa rifà il conto con un montante diverso, ed è il modo di accorgersi se un
  // giorno il fondo rientrasse da una porta laterale — un cursore, un valore salvato da una
  // visita precedente, una scorciatoia che salta `leggi()`.
  if (s.indici.some(i => s.p[i].giaInPens)){
    const salva = {...DATI};
    s.indici.forEach(i => { if (s.p[i].giaInPens) DATI['fondo'+i] = 777000; });
    let f2 = null;
    try { f2 = M.simula(M.leggi()).finale; } catch(e){ ko('il motore va in errore', e.message); }
    DATI = salva;
    if (f2 !== null && Math.abs(f2 - r.finale) > 1e-6)
      ko('il fondo scritto muove il piano di chi è già in pensione',
         `${Math.round(r.finale)} contro ${Math.round(f2)}`);
  }
  // e nel piano, l'attività di ciascuno segue il PROPRIO ultimo anno, non quello dell'altro
  for (const g of r.righe)
    for (const i of s.indici)
      if (g.lavora[i] !== (g.anno <= s.p[i].ultimo))
        ko('un esercizio di attività non segue l\'ultimo anno di quella persona', g.anno);
  // --- LE FORME CHE CONSUMANO IL MONTANTE ------------------------------------
  // Il difetto che questa invariante esiste per prendere è già successo: con una durata che
  // arrivava a NaN il montante veniva azzerato SENZA uscire da nessuna parte, e il piano
  // perdeva trecentomila euro senza che nulla in pagina lo dicesse. Un errore che toglie soldi
  // in silenzio è peggio di uno che esplode.
  //
  // LA PRIMA VERSIONE DI QUESTA INVARIANTE ERA SBAGLIATA, e vale la pena averlo scritto:
  // pretendeva che dal fondo uscisse almeno metà del montante. Ma su un piano con rendimento
  // reale molto negativo le rate valgono molto meno del montante di partenza, e non è denaro
  // perso: è un fondo che ha reso male. Segnalava quattro piani su quattromila, tutti sani.
  // La proprietà giusta non dipende dai rendimenti: il residuo dev'essere USCITO o RIMASTO.
  for (const i of s.indici){
    const x = s.p[i];
    if (x.forma !== 'durata' && x.forma !== 'frazionata') continue;
    const inc = r.incassi.find(v => v.chi === x.nome);
    if (!inc) continue;                        // fondo vuoto: niente da erogare
    if (!(inc.convertito > 1)) continue;       // preso tutto in capitale: nessun residuo
    if (!(inc.rate >= 1)) ko('forma che consuma senza nemmeno una rata', inc.rate);
    if (x.forma === 'frazionata' && inc.rate < M.FRAZ_ANNI_MIN)
      ko('erogazione frazionata sotto il minimo di legge', inc.rate);
    if (x.forma === 'durata' && inc.rate !== M.vitaIntera(x.etaPens))
      ko('durata definita diversa dalla vita attesa in anni interi',
         `${inc.rate} invece di ${M.vitaIntera(x.etaPens)}`);
    const uscite = r.righe.filter(g => g.anno >= inc.anno).reduce((a, g) => a + g.daRata, 0);
    const dentro = r.righe.at(-1).fondi[i];
    if (!(uscite > 0) && !(dentro > 0))
      ko('il residuo di una forma che consuma non è né uscito né rimasto',
         `residuo ${Math.round(inc.convertito)} sparito`);
    // e chi consuma non converte: da quel fondo non esce nessuna rendita a vita
    if (s.N === 1 && r.righe.some(g => g.anno > inc.anno && g.daRendita > 0))
      ko('una forma che consuma ha prodotto anche una rendita', '');
  }

  // --- niente rendimento su un buco
  if (!r.righe.every(g => g.inizio >= 0 || g.rendimento === 0)) ko('rendimento su patrimonio negativo','');
  // --- LO SCENARIO DEL SUPERSTITE: le proprietà che devono valere sempre
  if (s.N === 2){
    const anno = Math.max(s.p[0].annoPens, s.p[1].annoPens) + 5;
    for (const chi of [0, 1]){
      const v = M.simula({...s, manca: {chi, anno, equiv: 0.6}});
      if (!v.righe.every(g => Number.isFinite(g.patr))) ko('lo scenario del superstite dà NaN','');
      // chi manca non lavora e non percepisce la propria pensione, mai
      for (const g of v.righe)
        if (g.anno >= anno && (g.lavora[chi] || g.inPens[chi]))
          ko('chi manca continua a lavorare o a percepire la pensione', g.anno);
      // la reversibilità non può superare la pensione del defunto: è una QUOTA di essa
      const def = s.p[chi], sup = s.p[1-chi];
      const dopo = v.righe.find(g => g.anno === anno + 1);
      const prima = r.righe.find(g => g.anno === anno + 1);
      if (dopo && prima && dopo.daPensioni > prima.daPensioni + 1e-6)
        ko('le pensioni salgono quando uno dei due manca', `${prima.daPensioni} → ${dopo.daPensioni}`);
    }
  }
  // e la funzione di legge, ai punti che contano
  {
    const L = 30000, TMA = M.TRATT_MINIMO_ANNO;
    if (M.aiSuperstiti(L, 0) !== L * M.REVERSIBILITA) ko('senza redditi propri la quota non è quella piena','');
    if (M.aiSuperstiti(0, 0) !== 0) ko('senza pensione del defunto la reversibilità non è zero','');
    let prec = -Infinity;
    for (let R = 0; R < TMA * 7; R += 500){
      const q = M.aiSuperstiti(L, R);
      if (q < 0 || q > L * M.REVERSIBILITA + 1e-9) ko('reversibilità fuori scala', q);
      // IL TOTALE non deve mai scendere quando il reddito sale: è la salvaguardia di legge,
      // e senza di essa superare una soglia farebbe perdere più di quanto si guadagna
      if (R + q < prec - 1e-6) ko('un euro di reddito in più ne fa perdere di più', R);
      prec = R + q;
    }
  }

  // --- LA PROVA DI TENUTA NON PUÒ MAI MIGLIORARE UN PIANO, con nessuna combinazione di
  //     rendimenti. Su rendimenti reali negativi lo faceva: portarli a zero era un regalo.
  //     Questa è l'invariante che lo impedisce, e gira su rendimenti da −50% a +100%.
  {
    const pv = M.simula({...s, prova: 10});
    // L'ECCEZIONE È DI LEGGE, NON DEL MODELLO, e va esclusa o l'invariante segnala il sito
    // giusto. Abbassando i rendimenti la prova può portare il montante SOTTO la soglia dei
    // montanti di importo contenuto: lì la legge concede il 100% in capitale invece del 60%,
    // ed esce più denaro subito. È lo stesso effetto di confine che la pagina dichiara per
    // l'erogazione anticipata. Capita su circa un piano su diecimila, tutti già in perdita.
    const confine = r.incassi.some((v, k) => pv.incassi[k] && Math.abs(v.max - pv.incassi[k].max) > 1e-9);
    if (!Number.isFinite(pv.finale)) ko('la prova di tenuta produce un finale non finito','');
    else if (pv.finale > r.finale + 1e-6 && !confine)
      ko('la prova di tenuta MIGLIORA il piano', `${Math.round(r.finale)} → ${Math.round(pv.finale)}`);
    if (r.annoZero !== null && (pv.annoZero === null || pv.annoZero > r.annoZero))
      ko('con la prova il patrimonio dura di più', `${r.annoZero} → ${pv.annoZero}`);
    if (M.simula({...s, prova: 0}).finale !== r.finale)
      ko('prova a zero esercizi non coincide col piano di partenza','');
  }
}
console.log(`${n} piani casuali simulati.\n`);
const rotti = Object.entries(rotte);
if (!rotti.length) console.log('nessuna invariante violata.');
else for (const [k,v] of rotti) console.log(`VIOLATA (${v.length}x)  ${k}   es: ${v[0]}`);

// --- controlli chiusi sulle funzioni di legge
console.log('\n— le funzioni di legge, ai punti esatti —');
const c=(nome,cond,extra='')=>console.log((cond?'  ok  ':'  KO  ')+nome+(extra?'   '+extra:''));
c('IRPEF: scaglioni esatti ai confini',
  Math.abs(M.irpef(28000)-6440)<1e-9 && Math.abs(M.irpef(50000)-6440-7260)<1e-9);
c('IRPEF: continua e crescente', (()=>{let p=-1;for(let y=0;y<=300000;y+=137){const v=M.irpef(y);if(v<p-1e-9)return false;p=v;}return true;})());
// l'epsilon è 1e-9 e non 1e-12: la differenza di due IRPEF da ~40.000 € porta con sé
// un errore di virgola mobile dell'ordine di 1e-11, che non è un difetto della funzione
c('IRPEF: marginale mai sopra il 43%',
  (()=>{ for(let y=0;y<300000;y+=311) if((M.irpef(y+1)-M.irpef(y)) > 0.43+1e-9) return false;
         return true; })());
c('fondo: 15% fino a 15 anni, poi −0,30/anno, pavimento 9%',
  M.aliquota(0)===0.15 && M.aliquota(15)===0.15 && Math.abs(M.aliquota(20)-0.135)<1e-12
  && M.aliquota(35)===0.09 && M.aliquota(99)===0.09);
c('soglia «tutto in capitale» = metà assegno sociale / (70% × coeff)',
  Math.abs(M.SOGLIA_TUTTO - (0.5*M.ASSEGNO_SOCIALE)/(0.7*M.COEFF_RENDITA))<1e-9,
  `${Math.round(M.SOGLIA_TUTTO).toLocaleString('it-IT')} €`);
c('alla soglia esatta la regola cambia, e nel verso giusto',
  M.quotaMax(M.SOGLIA_TUTTO-0.01,M.COEFF_RENDITA)===1 && M.quotaMax(M.SOGLIA_TUTTO,M.COEFF_RENDITA)===M.QUOTA_ORDINARIA);
c('verifica inversa: convertendo il 70% della soglia, la rendita è metà assegno sociale',
  Math.abs(M.SOGLIA_TUTTO*0.7*M.COEFF_RENDITA - M.ASSEGNO_SOCIALE/2)<1e-9);
c('TFR = un tredicesimo e mezzo meno lo 0,50%',
  Math.abs(M.TFR_SU_RAL - (1/13.5 - 0.005)) < 5e-7, `${(M.TFR_SU_RAL*100).toFixed(4)}%`);
c('aliquota TFR: media, non marginale, e sempre ≤ marginale',
  M.aliquotaTfr(100000,10) < 0.43 && M.aliquotaTfr(1e7,1) <= 0.43 + 1e-12,
  `100.000 € in 10 anni → ${(M.aliquotaTfr(100000,10)*100).toFixed(1)}%`);
c('aliquota TFR: non dipende dal totale ma dalla retribuzione annua',
  Math.abs(M.aliquotaTfr(50000,10) - M.aliquotaTfr(100000,20)) < 1e-12);
