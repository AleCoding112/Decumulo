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
         tabellaSoglie, tabellaPareggi } from './regole.mjs';
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

let pagine = 0, avvisi = 0;
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
             .replace('<!--@@TABELLA_PAREGGI@@-->', tabellaPareggi());

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
${briciole(html, url)}</head>`;
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

  writeFileSync(join(A, nome), html);
  pagine++;
  console.log(`  ✓ ${nome}`);
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
// L'ANTEPRIMA DELLA CONDIVISIONE e l'icona per la schermata home di iOS. Sono gli unici due
// file binari del sito, e sono DISEGNATI, non copiati: un'immagine messa lì a mano sarebbe
// l'unica cosa in `sito/` che il build non sa rifare, e al primo cambio di colore resterebbe
// indietro senza che nessuno se ne accorga.
writeFileSync(join(A, 'anteprima.png'), anteprima());
writeFileSync(join(A, 'icona-touch.png'), icona(180));
writeFileSync(join(A, 'favicon.ico'), ico());
console.log(`  ✓ sitemap.xml (${urls.length} pagine) · robots.txt · CNAME (${dominio})`);

const aperte = daConfermare();
console.log(`\n${pagine} pagine costruite in sito/${avvisi ? `, ${avvisi} avvisi` : ''}.`);
if (aperte.length) {
  console.log(`\nCifre ancora da confermare (${aperte.length}):`);
  for (const r of aperte) console.log(`  · ${r.nome} — ${r.fonte}`);
}
console.log('\nOra i test: node test.mjs');
