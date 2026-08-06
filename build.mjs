// ============================================================================
//  Prende quello che sta in `sorgenti/`, ci mette dentro le cifre di
//  `regole.mjs`, e scrive in `sito/`. Si lancia con:  node build.mjs
//
//  Due sostituzioni sole, e sono tutto il build:
//    {{nome}}       nel testo  → la cifra scritta in italiano
//    //@@REGOLE@@   nel codice → le costanti in JavaScript
//
//  Se una pagina cita una cifra a mano invece di usare {{...}}, il build lo
//  segnala: è l'unico modo perché «le aggiorniamo noi» resti vero fra un anno.
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TESTI, REVISIONE, REVISIONE_ISO, blocco, daConfermare, tabellaRegole, statoParametri,
         tabellaSoglie, tabellaPareggi, tabellaTfr, intestazioneTfr } from './regole.mjs';
import { anteprima, icona, ico } from './anteprima.mjs';

const QUI = dirname(fileURLToPath(import.meta.url));
const DA  = join(QUI, 'sorgenti');
const A   = join(QUI, 'sito');
if (!existsSync(A)) mkdirSync(A);

// le cifre che, se compaiono scritte a mano in una pagina, quasi sicuramente
// dovevano essere un segnaposto
const SOSPETTE = [
  ['5.300 €',   'tetto'], ['5300',      'tetto'],
  ['123.002',   'soglia'], ['7.101,12',  'assegnoSociale'],
  ['101.654',   'sogliaChiunque'], ['159.742', 'sogliaNessuno'],
  ['6,9074',    'tfrSuRal'],
  ['9,19',      'ivs']
];

// La favicon in SVG: la curva del decumulo, disegnata qui. Sta in linea perché a questa misura
// pesa meno di una richiesta, e sopra gli schermi fitti resta netta a qualunque ingrandimento.
// Non è però l'unica forma: il file `/favicon.ico` lo scrive `anteprima.mjs`, e il perché sta
// scritto accanto al blocco che compone la testata.
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="7" fill="#faf9f6"/>` +
  `<path d="M4 9 C 12 9, 15 14, 18 20 S 25 27, 28 27" fill="none" stroke="#2f6f4e" ` +
  `stroke-width="3.4" stroke-linecap="round"/></svg>`);

// L'INDICE SI GENERA DAI TITOLI, non si scrive a mano: scritto a mano diverge al primo ritocco a
// una sezione, ed è lo stesso difetto per cui esiste `coerenza.mjs`. Stessa idea delle briciole,
// che si ricavano dalla riga che la pagina già mostra.
//
// Serve dove una pagina è lunga abbastanza da consultarsi invece che leggersi. Su `il-metodo.html`
// una sola sezione — «Fenomeni non rappresentati» — ne contiene quindici, ed è dove si va a
// cercare: senza indice quelle quindici non esistono finché non si scorre.
// `rita.html` non ce l'ha, e resta la prova che una pagina corta non ne ha bisogno.
// L'ETICHETTA E L'ANCORA NON SI RICAVANO ALLO STESSO MODO. L'ancora deve essere ASCII; l'etichetta
// no, e passandola per la stessa strada l'indice diceva «perche» e «mensilita» mentre il titolo
// sotto era scritto giusto. I titoli usano sia le entità sia i caratteri accentati veri, quindi
// per l'ancora si sciolgono le prime e si spogliano i secondi.
const ENTITA = {egrave:'e', eacute:'e', agrave:'a', ograve:'o', ugrave:'u', igrave:'i',
                rsquo:"'", laquo:'', raquo:'', mdash:'-', nbsp:' ', amp:'e', Egrave:'e'};
const etichetta  = t => t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const chiocciola = t => etichetta(t)
  .replace(/&([a-zA-Z]+);/g, (_, e) => ENTITA[e] ?? ' ')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function indice(html, nome){
  if (!html.includes('<!--@@INDICE@@-->')) return html;
  const voci = [];
  // l'id si aggiunge al titolo solo se non ne ha già uno suo
  html = html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (tutto, tag, attr, dentro) => {
    if (/\bid=/.test(attr)) return tutto;
    const id = chiocciola(dentro);
    if (!id) return tutto;
    if (voci.some(v => v.id === id))
      throw new Error(`${nome}: due titoli danno la stessa ancora «${id}». `
        + `L'indice punterebbe due volte allo stesso posto.`);
    voci.push({tag, id, testo: etichetta(dentro)});
    return `<${tag}${attr} id="${id}">${dentro}</${tag}>`;
  });
  if (!voci.length) throw new Error(`${nome}: c'è il marcatore dell'indice ma nessun titolo.`);
  let out = '<nav class="indice" aria-label="Indice della pagina">\n<ul>';
  let dentroH3 = false;
  for (const v of voci){
    if (v.tag === 'h3'){ if (!dentroH3){ out += '\n<ul>'; dentroH3 = true; } }
    else if (dentroH3){ out += '</ul></li>'; dentroH3 = false; }
    else if (out.endsWith('</a>')) out += '</li>';
    out += `\n<li><a href="#${v.id}">${v.testo}</a>`;
    if (v.tag === 'h3') out += '</li>';
  }
  out += (dentroH3 ? '</ul></li>' : '</li>') + '\n</ul>\n</nav>';
  return html.replace('<!--@@INDICE@@-->', out);
}

// L'ORIGINE DEL SITO, letta una volta sola dal canonical della home. Serve per gli URL delle
// immagini di anteprima, che gli scraper pretendono ASSOLUTI. Non si può ricavare dalla pagina
// in corso: la 404 un canonical non ce l'ha, perché non va indicizzata.
const ORIGINE = new URL(readFileSync(join(DA, 'index.html'), 'utf8')
  .match(/<link rel="canonical" href="([^"]*)"/)[1]).origin + '/';

// LE BRICIOLE, dichiarate anche a chi indicizza. In cima a ogni pagina di contenuto c'è già il
// percorso «Decumulo → la RITA»: dirlo in `BreadcrumbList` fa comparire quel percorso nei
// risultati di ricerca al posto dell'indirizzo nudo. Non è un trucco da posizionamento: descrive
// una struttura che esiste davvero, e SI RICAVA da quella riga invece di essere riscritta, o le
// due potrebbero dire cose diverse.
const briciole = (html, url) => {
  const riga = (html.match(/<p class="briciole">([\s\S]*?)<\/p>/) || [, ''])[1];
  if (!riga || !url) return '';
  const foglia = riga.replace(/<[^>]*>/g, '').split(/&rarr;|→/).pop()
                     .replace(/&nbsp;/g, ' ').trim();
  if (!foglia) return '';
  const voce = (n, nome, u) => ({'@type': 'ListItem', position: n, name: nome,
                                 ...(u ? {item: u} : {})});
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [voce(1, 'Decumulo', ORIGINE), voce(2, foglia)]
  })}</script>\n`;
};

// IL CALCOLATORE, DICHIARATO PER QUELLO CHE È. Era l'unica pagina del sito senza dati
// strutturati — le altre nove hanno le briciole — e proprio quella per cui il sito esiste: a
// una macchina non diceva di essere un applicativo, tanto meno gratuito, in italiano e di
// materia finanziaria. Chi legge il sito senza aprirlo — uno scraper, o un assistente che cerca
// mentre risponde — se lo deve dedurre dalla prosa.
//
// QUELLO CHE NON C'È DENTRO CONTA QUANTO QUELLO CHE C'È.
//  · niente `aggregateRating` né `review`: non esistono valutazioni, e inventarle per ottenere
//    un risultato ricco sarebbe l'unica bugia del sito, messa dove nessun umano la controlla.
//    Senza, Google non mostrerà la scheda arricchita — pazienza: qui si dichiara, non si recita;
//  · niente `featureList` né `audience`: la descrizione della pagina già enumera cosa calcola e
//    per chi. Ripeterlo qui vorrebbe dire tenere allineate due prose, e prima o poi divergono;
//  · niente autore né editore: non sono dichiarati da nessuna parte, e non si inventano.
// Identità (nome, indirizzo, descrizione) NON è riscritta: si prende da quello che la pagina
// già dichiara, per la stessa ragione per cui le briciole si ricavano dalla riga che mostrano.
// `dateModified` è la revisione dei PARAMETRI, la stessa che va nella sitemap e in fondo a ogni
// pagina: su un sito che espone cifre di legge è l'unica data che significhi qualcosa. Se si
// tocca il codice senza toccare le regole resta indietro, ed è il verso giusto in cui sbagliare.
const applicazione = (html, url) => {
  if (url !== ORIGINE) return '';           // il calcolatore sta solo sulla home
  const nome = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]
    .replace(/<[^>]*>/g, '').trim();
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].trim();
  if (!nome || !desc) return '';
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: nome,
    url,
    description: desc,
    inLanguage: 'it',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Richiede JavaScript',
    isAccessibleForFree: true,
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'},
    dateModified: REVISIONE_ISO
  })}</script>\n`;
};

// ============================================================================
//  I commenti restano nei sorgenti e non finiscono in `sito/`: con «visualizza
//  sorgente» si leggono come la pagina, e per un po' si sono letti.
//
//  Si tolgono i tre casi in cui è sicuro farlo senza analizzare il linguaggio:
//    · i commenti HTML fuori da <script> e <style>;
//    · dentro <script>, le righe che COMINCIANO con // (`https://` ha due barre
//      a metà riga, e va lasciato stare);
//    · dentro <style>, i blocchi /* */.
//  Un commento in coda a una riga di codice sopravvive: toglierlo richiederebbe
//  di leggere il JavaScript sul serio.
//
//  Quattro guardie qui sotto. Fermano il build invece di pubblicare un danno.
// ============================================================================
// Il segnaposto si costruisce invece di batterlo: un carattere di controllo
// scritto nel sorgente sarebbe invisibile a chi legge questo file.
const SEGNO    = String.fromCharCode(0);
const RIPRENDI = new RegExp(SEGNO + '(\\d+)' + SEGNO, 'g');

const senzaCommenti = (html, nome) => {
  let tolti = 0;

  // GUARDIA 1 — un marcatore HTML dentro al codice. Se un giorno una stringa
  // contenesse `<!--`, tagliare fin dopo il primo `-->` mangerebbe codice vero.
  for (const re of [/<script\b[^>]*>([\s\S]*?)<\/script>/g, /<style\b[^>]*>([\s\S]*?)<\/style>/g])
    for (const m of html.matchAll(re))
      if (m[1].includes('<!--') || m[1].includes('-->'))
        throw new Error(`${nome}: c'è un marcatore di commento HTML dentro <script> o <style>. `
          + `Il taglio dei commenti non è più sicuro: va guardato a mano.`);

  // i commenti HTML, ma solo fuori dal codice: le due zone si mettono da parte e si rimettono
  // identiche, così la regex non le vede. Il segnaposto è un carattere di controllo e non un
  // numero fra spazi: di numeri fra spazi la pagina è piena, e uno si sarebbe ripreso un pezzo
  // di codice al posto suo.
  if (html.includes(SEGNO)) throw new Error(`${nome}: contiene un carattere di controllo NUL`);
  const scorte = [];
  html = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,
                      t => SEGNO + (scorte.push(t) - 1) + SEGNO);
  html = html.replace(/<!--[\s\S]*?-->/g, () => { tolti++; return ''; });
  html = html.replace(RIPRENDI, (_, i) => scorte[+i]);

  // le righe di solo commento dentro al codice
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tutto, attr, codice) => {
    if (/type=/.test(attr) && !/javascript/.test(attr)) return tutto;   // ld+json: non è codice

    // GUARDIA 2 — dentro un template literal una riga che comincia con // è testo, e toglierla
    // cambierebbe quello che la pagina scrive. Il conto delle apici inverse dice se ci siamo
    // dentro. Nota: questo caso compila lo stesso dopo il taglio, quindi la guardia 3 non lo
    // vedrebbe.
    let dentro = false;
    codice.split('\n').forEach((r, i) => {
      if (dentro && /^\s*\/\//.test(r))
        throw new Error(`${nome}: riga ${i + 1} del codice comincia con // ma sta dentro un `
          + `template literal. Non è un commento: il taglio va rifatto a mano.`);
      if ((r.match(/(?<!\\)`/g) || []).length % 2) dentro = !dentro;
    });

    let pulito = codice.split('\n')
      .filter(r => { const c = /^\s*\/\//.test(r); if (c) tolti++; return !c; })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');       // i buchi lasciati dai blocchi tolti

    // GUARDIA 3 — quello che resta deve ancora essere JavaScript valido. `new Function` compila
    // senza eseguire: non serve un browser.
    try { new Function(pulito); }
    catch (e) { throw new Error(`${nome}: togliendo i commenti il codice non compila più `
      + `(${e.message}). Niente è stato pubblicato.`); }

    return `<script${attr}>${pulito}</script>`;
  });

  // I commenti del foglio di stile, sfuggiti al primo giro: nel CSS si commenta con /* */, e
  // centouno di quelli hanno continuato a uscire mentre tutto il resto era pulito.
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/g, (tutto, attr, css) => {
    // GUARDIA 4 — un marcatore dentro una stringa CSS (`content: "/*"`): tagliare a partire da
    // lì mangerebbe regole vere.
    for (const s of css.matchAll(/"[^"\n]*"|'[^'\n]*'/g))
      if (s[0].includes('/*') || s[0].includes('*/'))
        throw new Error(`${nome}: una stringa del foglio di stile contiene ${s[0]}. `
          + `Il taglio dei commenti CSS non è più sicuro: va guardato a mano.`);

    const pulito = css.replace(/\/\*[\s\S]*?\*\//g, () => { tolti++; return ''; })
                      .replace(/[ \t]+$/gm, '')
                      .replace(/\n{3,}/g, '\n\n');
    return `<style${attr}>${pulito}</style>`;
  });

  return { html, tolti };
};

let pagine = 0, avvisi = 0, commentiTolti = 0;
// i file che cominciano con _ non sono pagine: sono pezzi da includere
const pezzo = n => readFileSync(join(DA, n), 'utf8');

for (const nome of readdirSync(DA).filter(f => f.endsWith('.html') && !f.startsWith('_'))) {
  let html = readFileSync(join(DA, nome), 'utf8');

  // 0. i pezzi comuni: stile e piè di pagina stanno in un posto solo.
  //    UN PEZZO PUÒ CONTENERNE UN ALTRO, e serve: il piè di pagina porta con sé il banner del
  //    consenso, così nessuna pagina può dimenticarselo. Con una passata sola il banner sarebbe
  //    andato aggiunto a mano su nove file, cioè dimenticato sul decimo.
  //    Il giro si ferma quando non c'è più niente da sostituire; il tetto impedisce a
  //    un'inclusione circolare di girare all'infinito senza dire perché.
  for (let giro = 0; ; giro++){
    const dopo = html.replace(/<!--@@INCLUDI (_[\w-]+\.html)@@-->/g, (_, f) => pezzo(f));
    if (dopo === html) break;
    if (giro > 5) throw new Error(`${nome}: inclusioni annidate troppo a fondo, forse un cerchio`);
    html = dopo;
  }

  // 1. le costanti dentro al codice
  html = html.replace('//@@REGOLE@@', blocco());

  // 2. dal calcolatore le pagine si aprono in una scheda nuova: chi sta compilando non deve
  //    perdere quello che ha scritto per andare a leggere. Vale solo per index.html, e si fa
  //    qui perché ricordarsene a ogni link nuovo non funzionerebbe.
  if (nome === 'index.html')
    html = html.replace(/<a href="((?!http|#)[^"]+\.html)"/g,
                        '<a href="$1" target="_blank" rel="noopener"');

  // 3. i blocchi generati (la tabella delle regole della pagina «il metodo»)
  html = html.replace('<!--@@TABELLA_REGOLE@@-->', tabellaRegole())
             .replace('<!--@@STATO_PARAMETRI@@-->', statoParametri())
             .replace('<!--@@TABELLA_SOGLIE@@-->', tabellaSoglie())
             .replace('<!--@@TABELLA_PAREGGI@@-->', tabellaPareggi())
             .replace('<!--@@TABELLA_TFR@@-->', tabellaTfr())
             .replace('<!--@@INTESTAZIONE_TFR@@-->', intestazioneTfr());

  // 3-ter. l'indice, e gli id sui titoli che gli servono da bersaglio
  html = indice(html, nome);

  // 3-bis. I METADATI DELLA CONDIVISIONE, ricavati da quello che la pagina già dichiara.
  // Titolo, descrizione e canonical stanno scritti una volta sola in cima a ciascuna pagina:
  // le anteprime li rileggono da lì invece di ripeterli, così non possono divergere.
  //
  // LA FAVICON STA IN DUE FORME, e per un po' ne ha avuta una sola. Era il solo data URI, con
  // la motivazione che «il sito non deve chiedere niente a nessuno»: ma la pagina privacy
  // promette di non caricare risorse da **domini terzi**, non di non servire file propri — e
  // `anteprima.png` e `icona-touch.png` stanno lì da sempre. Intanto **Chrome le favicon che
  // arrivano da un data URI non le disegna**, e il browser chiede `/favicon.ico` per conto suo
  // — preferiti, cronologia, anteprima di un link — trovandoci un 404. Ora l'ICO viene prima
  // per chi guarda solo quello, e l'SVG dopo con il suo `type` per chi sa preferirlo: stesso
  // marchio, disegnato una volta sola in `anteprima.mjs`.
  html = html.replace('</head>', () => {
    const dentro = (re) => (html.match(re) || [, ''])[1].trim();
    const titolo = dentro(/<title>([\s\S]*?)<\/title>/);
    const desc   = dentro(/<meta name="description" content="([^"]*)"/);
    const url    = dentro(/<link rel="canonical" href="([^"]*)"/);
    const esc = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="Decumulo">
<meta property="og:title" content="${esc(titolo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(new URL('anteprima.png', ORIGINE).href)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="La curva del patrimonio: sale finché si lavora, scende dopo.">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#faf9f6">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="${FAVICON}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${esc(new URL('icona-touch.png', ORIGINE).href)}">
${briciole(html, url)}${applicazione(html, url)}</head>`;
  });

  // 4. le cifre dentro al testo
  const mancanti = new Set();
  html = html.replace(/\{\{(\w+)\}\}/g, (tutto, chiave) => {
    if (TESTI[chiave] === undefined) { mancanti.add(chiave); return tutto; }
    return TESTI[chiave];
  });
  for (const k of mancanti) { console.log(`  ✗ ${nome}: {{${k}}} non esiste in regole.mjs`); avvisi++; }

  // 5. le cifre scritte a mano: non è un errore, ma va visto
  for (const [cifra, chiave] of SOSPETTE) {
    const sorgente = readFileSync(join(DA, nome), 'utf8');
    if (sorgente.includes(cifra) && !sorgente.includes(`{{${chiave}}}`)) {
      console.log(`  ! ${nome}: c'è «${cifra}» scritto a mano — forse voleva essere {{${chiave}}}`);
      avvisi++;
    }
  }

  // 6. i commenti restano di qua: quello che si pubblica è la pagina, non il ragionamento
  const pulita = senzaCommenti(html, nome);
  commentiTolti += pulita.tolti;

  writeFileSync(join(A, nome), pulita.html);
  pagine++;
  console.log(`  ✓ ${nome}${pulita.tolti ? ` (${pulita.tolti} commenti tolti)` : ''}`);
}

// --- i due file che non sono pagine ma servono a chi indicizza --------------
// Si generano dall'elenco vero di quello che c'è in sito/: una sitemap scritta a mano si
// scorda l'ultima pagina aggiunta.
const canonicale = f => {
  const h = readFileSync(join(A, f), 'utf8');
  return (h.match(/<link rel="canonical" href="([^"]*)"/) || [, ''])[1];
};
const urls = readdirSync(A).filter(f => f.endsWith('.html') && f !== '404.html')
  .map(canonicale).filter(Boolean).sort();
// `lastmod` non è una data inventata né quella del file: è la REVISIONE dei parametri, cioè
// l'ultima volta che il contenuto è stato verificato. Dirla è un'informazione vera, e si ricava
// da `regole.mjs` come tutto il resto.
writeFileSync(join(A, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + urls.map(u => `  <url><loc>${u}</loc><lastmod>${REVISIONE_ISO}</lastmod></url>`).join('\n')
  + `\n</urlset>\n`);
// IL DOMINIO NON SI RISCRIVE, SI RICAVA. Sta già nei `canonical` di ogni pagina: scriverlo una
// seconda volta qui vorrebbe dire che al primo cambio una delle due copie resta indietro, e il
// sito risponderebbe su un nome mentre si dichiara su un altro.
const dominio = new URL(urls[0]).host;
writeFileSync(join(A, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: https://${dominio}/sitemap.xml\n`);
// GitHub Pages risponde sul dominio solo se nella cartella pubblicata trova un file `CNAME` che
// lo nomina. È un file dell'ospite, non del sito: sta qui e non fra i sorgenti, come sitemap e
// robots, perché `sito/` non si modifica a mano.
writeFileSync(join(A, 'CNAME'), dominio + '\n');
// LA VERIFICA DI BING, e sta qui per la stessa ragione del CNAME: è un file del SERVIZIO, non
// del sito. Bing chiede un file alla radice per accertare che chi rivendica il dominio nel suo
// strumento per i gestori sia chi lo controlla davvero.
//
// MESSO A MANO IN `sito/` SAREBBE DURATO FINO AL PRIMO BUILD, che riscrive quella cartella da
// zero e non copia niente: Bing sarebbe tornato a non verificare, e il sito a non comparire fra
// i suoi risultati, senza che nessuno se ne accorgesse. È il motivo per cui non esiste un solo
// file in `sito/` che il build non sappia rifare.
//
// SERVE PER GLI ASSISTENTI PIÙ CHE PER BING: la ricerca di ChatGPT passa dall'indice di Bing,
// quindi finché il dominio non è verificato lì non c'è modo che un assistente ci arrivi
// cercando. Il codice non è un segreto — identifica il sito, non autorizza nulla, e viene
// servito a un indirizzo pubblico che chiunque può leggere.
const BING = '8C21779985E6DE2E37773FDC7B4CFC43';
writeFileSync(join(A, 'BingSiteAuth.xml'),
  `<?xml version="1.0"?>\n<users>\n\t<user>${BING}</user>\n</users>\n`);
// L'ANTEPRIMA DELLA CONDIVISIONE e l'icona per la schermata home di iOS. Sono gli unici due
// file binari del sito, e sono DISEGNATI, non copiati: un'immagine messa lì a mano sarebbe
// l'unica cosa in `sito/` che il build non sa rifare, e al primo cambio di colore resterebbe
// indietro senza che nessuno se ne accorga.
writeFileSync(join(A, 'anteprima.png'), anteprima());
writeFileSync(join(A, 'icona-touch.png'), icona(180));
writeFileSync(join(A, 'favicon.ico'), ico());
console.log(`  ✓ sitemap.xml (${urls.length} pagine) · robots.txt · CNAME (${dominio})`);

const aperte = daConfermare();
console.log(`\n${pagine} pagine costruite in sito/${avvisi ? `, ${avvisi} avvisi` : ''}`
  + `, ${commentiTolti} commenti tolti.`);
if (aperte.length) {
  console.log(`\nCifre ancora da confermare (${aperte.length}):`);
  for (const r of aperte) console.log(`  · ${r.nome} — ${r.fonte}`);
}
console.log('\nOra i test: node test.mjs');
