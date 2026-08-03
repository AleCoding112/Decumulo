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
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function apri({ larghezza = 1200, altezza = 1400 } = {}) {
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
  cl0:60000, cl1:8000, cl2:40000, cl3:92000, spesa:2500, infl:2, etaFine:95};

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
    fatti.push(await b.scatta('risultato', '#titolo'));

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

    console.log('  ' + fatti.length + ' scatti in verifiche/scatti/');
    for (const f of fatti) console.log('      · ' + f.split('/').slice(-1)[0]);
    if (b.guai.length) {
      console.log('  ✗ la pagina ha scritto in console:');
      for (const g of [...new Set(b.guai)]) console.log('      · ' + g.slice(0, 160));
      process.exitCode = 1;
    } else console.log('  ok  nessun errore in console, che nessun altro controllo legge');
  } finally { await b.chiudi(); }
}
