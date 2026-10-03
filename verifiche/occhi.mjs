// ============================================================================
//  GUARDARE LA PAGINA, non misurarla.
//
//      node verifiche/occhi.mjs          → scrive i ritagli in verifiche/scatti/
//
//  DIVISIONE DEL LAVORO, e va tenuta chiara perché due strumenti che aprono lo
//  stesso browser sono un invito a duplicarsi:
//   · `a-schermo.mjs` MISURA — sbordamenti a quattro larghezze, nomi
//     accessibili, `hidden` battuti da un `display`, la stampa, il consenso.
//     Dà un verdetto, e sta fuori dalla catena veloce perché apre Chrome;
//   · questo GUARDA. Non afferma quasi niente: produce immagini dei pezzi che
//     contano, perché esiste una classe di difetti che nessuna misura vede.
//     La prova è il difetto che ha trovato appena scritto: «niente: 0 €» andava
//     a capo fra la cifra e il simbolo. Non è uno sbordamento — la pagina resta
//     larga uguale, `a-schermo` era verde — è solo brutto, e si vede soltanto.
//
//  L'UNICA COSA CHE AFFERMA È LA CONSOLE. `EL()` segnala lì gli elementi
//  mancanti, e il commento nel calcolatore dice da mesi «in console non guarda
//  nessuno». Le armature la catturano perché la sostituiscono; la pagina vera
//  no. Qui si legge quella vera, e un errore fa fallire il comando.
//
//  PERCHÉ IL PROTOCOLLO E NON `--dump-dom`. `a-schermo` usa Chrome in un colpo
//  solo, che basta a misurare ma non sa fotografare né cliccare a comando. Qui
//  serve muovere un cursore e POI scattare, quindi Chrome resta aperto e si
//  pilota col DevTools Protocol. Zero dipendenze: `WebSocket` è dentro Node.
//  Non si introduce un secondo modo di misurare — quello resta uno solo.
// ============================================================================
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const SITO = join(QUI, '..', 'sito');
const SCATTI = join(QUI, 'scatti');
import { CHROME, SENZA_CHROME } from './_chrome.mjs';

export async function apri({ larghezza = 1200, altezza = 1400 } = {}) {
  if (!CHROME) throw new Error(SENZA_CHROME);
  // `WebSocket` è dentro Node dalla 22: con la 20 serve `--experimental-websocket`. Detto per
  // nome, perché «WebSocket is not defined» non dice cosa fare
  if (typeof WebSocket !== 'function')
    throw new Error('serve Node 22 o più recente (o node --experimental-websocket): qui manca WebSocket');
  const prof = fs.mkdtempSync(join(os.tmpdir(), 'decumulo-occhi-'));
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0',
    `--user-data-dir=${prof}`, `--window-size=${larghezza},${altezza}`, 'about:blank'],
    { stdio: 'ignore' });

  // la porta la sceglie Chrome e la scrive nel profilo: leggerla è più solido che fissarne una
  const file = join(prof, 'DevToolsActivePort');
  let porta = null;
  for (let k = 0; k < 100 && porta === null; k++) {
    await new Promise(r => setTimeout(r, 100));
    if (fs.existsSync(file)) porta = +fs.readFileSync(file, 'utf8').split('\n')[0] || null;
  }
  if (!porta) { ch.kill(); throw new Error('Chrome non ha aperto la porta di debug'); }

  const lista = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
  const ws = new WebSocket(lista.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));

  let id = 0;
  const attese = new Map();
  const guai = [];                       // quello che la pagina scrive in console, e nessuno legge
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && attese.has(m.id)) { attese.get(m.id)(m); attese.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown')
      guai.push('eccezione: ' + (m.params.exceptionDetails.exception?.description
                                 || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type))
      guai.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  });
  const cmd = (method, params = {}) => new Promise((ok, no) => {
    const n = ++id;
    attese.set(n, m => m.error ? no(new Error(method + ': ' + m.error.message)) : ok(m.result));
    ws.send(JSON.stringify({ id: n, method, params }));
  });

  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',
    { width: larghezza, height: altezza, deviceScaleFactor: 2, mobile: false });

  const b = {
    guai,
    async larga(px) {
      await cmd('Emulation.setDeviceMetricsOverride',
        { width: px, height: altezza, deviceScaleFactor: 2, mobile: false });
      await new Promise(r => setTimeout(r, 250));
    },
    // IL BANNER DEL CONSENSO ATTRAVERSA OGNI SCATTO. È `position:fixed`, quindi in un'immagine
    // a pagina intera viene dipinto in mezzo al contenuto: si guarda il modulo e si vede il
    // banner. Si risponde NO prima di caricare — la risposta più prudente, e quella che lascia
    // il sito senza tag — così le immagini mostrano la pagina e non la sua prima domanda.
    // La scelta si scrive nella memoria del sito, quindi va fatta DOPO un primo carico (prima
    // l'origine non esiste) e prima di quello che si fotografa.
    async senzaBanner(url) {
      await b.vai(url);
      await b.js(`try { localStorage.setItem('decumulo-it-consenso', 'no'); } catch(e){}`);
      await b.vai(url);
    },
    async vai(url) {
      await cmd('Page.navigate', { url });
      for (let k = 0; k < 100; k++) {
        await new Promise(r => setTimeout(r, 100));
        if ((await cmd('Runtime.evaluate', { expression: 'document.readyState' }))
              .result.value === 'complete') break;
      }
      await new Promise(r => setTimeout(r, 300));
    },
    async js(expression) {
      const { result, exceptionDetails } = await cmd('Runtime.evaluate',
        { expression, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(exceptionDetails.text + ' — ' +
        (exceptionDetails.exception?.description || '').split('\n')[0]);
      return result.value;
    },
    // si compila col valore E con l'evento, così si prova anche il cablaggio invece che
    // scavalcarlo chiamando `calc()` a mano
    async compila(dati) {
      return b.js(`(() => { for (const [k, v] of Object.entries(${JSON.stringify(dati)})){
        const e = document.getElementById(k); if (!e) continue;
        e.value = String(v);
        e.dispatchEvent(new Event('input', {bubbles:true}));
        e.dispatchEvent(new Event('change', {bubbles:true})); } return true; })()`);
    },
    async dove(sel) {
      return b.js(`(() => { const e = document.querySelector(${JSON.stringify(sel)});
        if (!e) return null; const r = e.getBoundingClientRect();
        return {x: r.x + scrollX - 10, y: r.y + scrollY - 10,
                width: r.width + 20, height: r.height + 20}; })()`);
    },
    // il ritaglio è quello che serve: una pagina intera da sette schermate non si guarda
    async scatta(nome, sel = null) {
      const clip = sel ? await b.dove(sel) : null;
      if (sel && !clip) throw new Error('non trovo ' + sel);
      const { data } = await cmd('Page.captureScreenshot',
        clip ? { format: 'png', captureBeyondViewport: true, clip: { ...clip, scale: 1 } }
             : { format: 'png', captureBeyondViewport: true });
      fs.mkdirSync(SCATTI, { recursive: true });
      const dove = join(SCATTI, nome + '.png');
      fs.writeFileSync(dove, Buffer.from(data, 'base64'));
      return dove;
    },
    // LA STAMPA, come la fa il browser: A4, margini di Chrome, `beforeprint` compreso. Restituisce
    // il file e il numero di pagine, che è la prima cosa da guardare (erano 17).
    async pdf(nome) {
      await b.js(`dispatchEvent(new Event('beforeprint')); true`);
      const { data } = await cmd('Page.printToPDF', { paperWidth: 8.27, paperHeight: 11.69,
        marginTop: 0.4, marginBottom: 0.4, marginLeft: 0.4, marginRight: 0.4,
        printBackground: true, preferCSSPageSize: true });
      await b.js(`dispatchEvent(new Event('afterprint')); true`);
      const buf = Buffer.from(data, 'base64');
      fs.mkdirSync(SCATTI, { recursive: true });
      const dove = join(SCATTI, nome + '.pdf');
      fs.writeFileSync(dove, buf);
      return { dove, pagine: (buf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length };
    },
    // Chrome muore con calma: cancellare il profilo subito dopo il kill trova file ancora aperti
    // e `rmSync` esplode. Si aspetta, e se non ci riesce pazienza — è una cartella temporanea.
    async chiudi() {
      try { ws.close(); } catch {}
      ch.kill();
      await new Promise(r => setTimeout(r, 500));
      try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
      catch {}
    }
  };
  return b;
}

// --- gli scatti che si guardano dopo ogni modifica di aspetto ----------------
// Sono i punti in cui l'aspetto è già stato rotto almeno una volta, non una rassegna.
const DATI = {quanti:'1', nome0:'Anna', nascita0:1975, ral0:38000,
  pens0:1500, annoPens0:2042, fondo0:60000, iscr0:2005, pcVoi0:3, pcDat0:2,
  // il patrimonio non si scrive più intero: è la somma delle quattro classi. Qui la ripartizione
  // è realistica e NON è indifferente come negli altri banchi — questo apre un browser vero,
  // quindi gli ascoltatori scattano e da queste quattro cifre discende il rendimento mostrato.
  cl0:60000, cl1:8000, cl2:40000, cl3:92000, spesa:2500, infl:2, etaFine:95,
  // il TFR già accantonato è SCRITTO, non vuoto: le caselle vanno fotografate piene, o si
  // guarderebbe un riquadro che non mostra il contenuto più lungo che può portare
  tfrGia0:52000, annoLav0:2001};

if (process.argv[1] && import.meta.url === 'file://' + process.argv[1]) {
  const b = await apri({ larghezza: 1200 });
  const fatti = [];
  try {
    await b.senzaBanner('file://' + join(SITO, 'index.html'));
    await b.compila(DATI);

    fatti.push(await b.scatta('modulo-contributi', '.gruppo.largo.rigalav + .due'));
    // QUI SI FOTOGRAFAVA IL MENU DELL'ADESIONE, che era il punto più stretto del modulo. Al suo
    // posto c'è la nota sulla quota del datore, che ha il problema opposto: è una frase a tutta
    // riga dentro una griglia i cui contenuti vanno a gruppi di tre, e nessuna misura sa dire se
    // sfalsa le celle sotto o se va a capo in un punto stupido.
    fatti.push(await b.scatta('nota-datore', '.due:has(#notaDatore)'));
    // IL RIQUADRO DEL TFR, che è nuovo di oggi e porta due caselle e una tendina sullo stesso
    // asse. Si guarda che le tre righe siano allineate come quelle del fondo qui sopra — è la
    // ragione per cui è un riquadro a sé — e che la nota sull'imposta sotto la prima casella non
    // vada a capo in un punto stupido: è larga 134 px come tutte, ma porta una cifra E una
    // percentuale, che è il contenuto più lungo di ogni suggerimento del modulo.
    fatti.push(await b.scatta('riquadro-tfr', '.due:has(#tfrGia0)'));
    // LE IPOTESI, che da oggi hanno una casella in più. La griglia è `auto-fit` con colonne da
    // 200 px: aggiungendo la quinta voce il numero di colonne per riga può cambiare, e con esso
    // l'allineamento delle etichette — che a occhio si vede e a misura no. Si guarda anche che
    // «Che tipo di fondo è» non vada a capo, perché una riga in più su UNA casella disallinea
    // tutta la fila: è già successo con «Comparto del fondo pensione».
    fatti.push(await b.scatta('ipotesi', '.caselle:has(#rend)'));
    // il fondo di ciascuno, con la riga dei nomi in testa alle due colonne (03/10/2026)
    await b.compila({quanti: '2', nome1: 'Bruno', nascita1: 1977, ral1: 33000, pens1: 1300,
                     annoPens1: 2044, fondo1: 40000, iscr1: 2010, rendFondo1: '0,49'});
    await b.js(`document.getElementById('strIpotesi').open = true; true`);
    fatti.push(await b.scatta('ipotesi-fondi', '.due:has(#comparto0)'));
    fatti.push(await b.scatta('ipotesi-frasi', '#confrontoRend'));
    await b.compila({quanti: '1'});
    fatti.push(await b.scatta('risultato', '#titolo'));
    // LA COLONNA FISSA E IL COLPO D'OCCHIO (08/09/2026). A 1200 px il risultato sta a destra del
    // modulo: si guarda che il blocco intero — titolo su tre righe, le tre righe del colpo
    // d'occhio, il grafico stretto con le sue etichette — stia in una schermata e si legga.
    fatti.push(await b.scatta('colonna-fissa', '.appiccica'));
    fatti.push(await b.scatta('colpo-d-occhio', '#sguardo'));

    // IL GRAFICO, che fino all'11/08/2026 non era fotografato da nessuno — ed è il pezzo della
    // pagina che si giudica SOLO guardandolo: nessuna verifica sa dire se due tinte pallide si
    // distinguono, se una banda sottile sparisce sul bianco del riquadro, se un gradino si legge
    // come una perdita. Si scatta insieme alla legenda perché è lì che i colori si confrontano:
    // i quadratini e le aree sono divergiuti per mesi senza che niente lo vedesse.
    // DUE SCATTI, PERCHÉ SONO DUE DISEGNI DIVERSI. Con il TFR al fondo — la scelta di partenza —
    // resta la sola banda del pregresso, che è sottile: è il caso in cui una tinta troppo chiara
    // sparirebbe. Portandolo in azienda la banda diventa un quinto del totale, e lì si guarda
    // l'altra cosa: che alla liquidazione si spenga di colpo mentre il patrimonio sale di meno,
    // perché in mezzo c'è l'imposta dell'art. 19.
    // il riquadro e la legenda sono due FRATELLI, e si scattano separatamente: `#riquadroGrafico
    // + .legenda` sembra prenderli tutti e due e prende solo il secondo. Sbagliato la prima
    // volta, e non se ne accorge nessuno finché non si guarda il file che è uscito.
    fatti.push(await b.scatta('grafico-col-pregresso', '#riquadroGrafico'));
    await b.js(`document.getElementById('tfrDove0').value = 'azienda'; calc();`);
    fatti.push(await b.scatta('grafico-tfr-in-azienda', '#riquadroGrafico'));
    fatti.push(await b.scatta('grafico-legenda', '#legendaGrafico'));
    // E SENZA TFR DI NESSUN GENERE, che è il caso in cui la terza voce deve SPARIRE invece di
    // indicare un colore che nel disegno non c'è. Ci vogliono DUE caselle, e la prima volta ne
    // avevo cambiata una sola: azzerare il pregresso non basta se il TFR va comunque in azienda,
    // perché ne matura di nuovo ogni anno che si lavora. Lo scatto mostrava il quadratino e
    // sembrava un difetto del codice: era la prova a non descrivere il caso che diceva di
    // descrivere. Vale in generale — una prova sullo stato «assente» va guardata, non dedotta.
    await b.js(`document.getElementById('tfrGia0').value = '';
                document.getElementById('tfrDove0').value = 'fondo'; calc();`);
    fatti.push(await b.scatta('grafico-legenda-senza-tfr', '#legendaGrafico'));
    await b.js(`document.getElementById('tfrGia0').value = '52000'; calc();`);

    // LA COMPOSIZIONE E LA SUA BARRA. Nessuna misura sa dire se quattro segmenti si distinguono,
    // se la legenda va a capo in un punto stupido, se il gradino più chiaro sparisce sul bianco:
    // sono esattamente i difetti per cui questo file esiste. Gli importi sono squilibrati apposta
    // — un segmento largo, uno sottile — perché è lì che una barra si rompe, non su quattro quarti.
    fatti.push(await b.scatta('composizione', 'fieldset:has(#composizione)'));

    // il cursore SOTTO quello che si versa: è lì che compare la domanda sul minimo, ed è il
    // pezzo che nessuna verifica sa giudicare
    await b.js(`document.getElementById('pc0').value = '2'; calc();`);
    fatti.push(await b.scatta('cursore-sotto-il-versato', '#decVersare .cur'));

    // e come sta in mano, che è dove il testo lungo si spezza male
    await b.larga(390);
    fatti.push(await b.scatta('telefono-contributi', '.gruppo.largo.rigalav + .due'));
    fatti.push(await b.scatta('telefono-cursore', '#decVersare .cur'));
    // in mano le quattro caselle si impilano e la legenda deve spezzarsi bene: è la larghezza
    // in cui una legenda a quattro voci si sfascia, se si sfascia
    fatti.push(await b.scatta('telefono-composizione', 'fieldset:has(#composizione)'));
    // e il grafico in mano, che è dove le bande si assottigliano: a 390 px l'SVG rende a poco
    // più di un terzo, quindi una banda da quindici unità di `viewBox` diventa sei pixel veri.
    // È la larghezza in cui una terza banda smette di essere una banda, se smette.
    await b.js(`document.getElementById('tfrDove0').value = 'azienda'; calc();`);
    fatti.push(await b.scatta('telefono-grafico', '#riquadroGrafico'));
    fatti.push(await b.scatta('telefono-grafico-legenda', '#legendaGrafico'));

    // LA STAMPA, da guardare pagina per pagina: era il pezzo più trascurato del sito, quattordici
    // pagine col modulo intero, e nessuno scatto la mostrava
    await b.compila({tfrDove0: 'fondo', pc0: ''});
    const carta = await b.pdf('stampa');
    fatti.push(carta.dove);
    console.log(`  la stampa fa ${carta.pagine} pagine`);

    console.log('  ' + fatti.length + ' scatti in verifiche/scatti/');
    for (const f of fatti) console.log('      · ' + f.split('/').slice(-1)[0]);

    // LE DUE TENDINE DEL FONDO, E PERCHÉ IL CONTROLLO STA QUI. Comparto e forma scrivono
    // insieme il rendimento, e il rendimento riscritto a mano le rimette a posto: è un giro
    // completo che nessuna delle sedici verifiche può fare, perché quelle tendine la pagina le
    // COSTRUISCE a runtime e in un DOM finto non hanno opzioni. Senza questo blocco il cablaggio
    // poteva rompersi e restare rotto, con tutte le verifiche verdi.
    {
      const giro = await b.js(`(() => {
        // la prima persona; la seconda ha lo stesso cablaggio, scritto dallo stesso ciclo
        const C = document.getElementById('comparto0'), F = document.getElementById('formaFondo0'),
              R = document.getElementById('rendFondo0'), fuori = [];
        const tocca = (e, v) => { e.value = v; e.dispatchEvent(new Event('input',{bubbles:true})); };
        for (let f = 0; f < FORME_FONDO.length; f++)
          for (let i = 0; i < COMPARTI.length; i++){
            tocca(C, String(i)); tocca(F, String(f));
            const scritto = R.value;                       // dalle tendine al numero
            tocca(R, '0'); tocca(R, scritto);              // e ritorno, dal numero alle tendine
            if (C.value !== String(i) || F.value !== String(f))
              fuori.push(\`\${COMPARTI[i][0]}/\${FORME_FONDO[f][0]} → \${scritto}% → \${C.value}/\${F.value}\`);
          }
        tocca(R, '4,2');                                   // un numero che non è di nessuno
        const aMano = C.value === '' && F.value === '';
        return {fuori, aMano}; })()`);
      if (giro.fuori.length){
        console.log('  ✗ le tendine non riconoscono il numero che hanno scritto:');
        for (const g of giro.fuori) console.log('      · ' + g);
        process.exitCode = 1;
      } else if (!giro.aMano){
        console.log('  ✗ un rendimento che non è di nessun comparto non riporta le tendine a «scritto a mano»');
        process.exitCode = 1;
      } else console.log('  ok  le due tendine del fondo, andata e ritorno su tutte e 12 le combinazioni');
    }
    if (b.guai.length) {
      console.log('  ✗ la pagina ha scritto in console:');
      for (const g of [...new Set(b.guai)]) console.log('      · ' + g.slice(0, 160));
      process.exitCode = 1;
    } else console.log('  ok  nessun errore in console, che nessun altro controllo legge');
  } finally { await b.chiudi(); }
}
