// ============================================================================
//  COME IL SITO SI PRESENTA A CHI NON L'HA ANCORA APERTO.
//
//  Chi riceve il link su WhatsApp o lo trova su Google non vede il sito: vede
//  una scheda fatta di titolo, descrizione, immagine e briciole. Quella scheda
//  la costruisce il build da quello che le pagine già dichiarano, e nessun
//  altro controllo la guarda: si può rompere in silenzio e restare rotta per
//  mesi, perché aprendo il sito si vede tutto giusto.
//
//  Qui si controlla il SITO COSTRUITO, che è quello che gli scraper leggono.
// ============================================================================
import fs from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const SITO = join(QUI, '..', 'sito');
const pagine = fs.readdirSync(SITO).filter(f => f.endsWith('.html'));
const testo = Object.fromEntries(pagine.map(p => [p, fs.readFileSync(join(SITO, p), 'utf8')]));

let ko = 0;
const c = (nome, cond, extra = '') => {
  if (!cond) ko++;
  console.log(`  ${cond ? 'ok ' : 'KO '} ${nome}${extra ? '   ' + extra : ''}`);
};
const attr = (h, re) => (h.match(re) || [, ''])[1];

// --- 1. L'IMMAGINE ESISTE, ED È UN PNG VERO ---------------------------------
// `og:image` deve puntare a un file raster raggiungibile: gli scraper non leggono i data URI
// (che il sito usa per la favicon) e quasi nessuno accetta SVG. Un indirizzo che risponde 404
// dà una scheda senza immagine, cioè esattamente il difetto che si voleva togliere.
{
  for (const f of ['anteprima.png', 'icona-touch.png']){
    const p = join(SITO, f);
    const c1 = fs.existsSync(p);
    // firma PNG + dimensioni lette dall'IHDR, che è la sola prova che il file è quello che dice
    let dim = '';
    if (c1){
      const b = fs.readFileSync(p);
      const firma = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
      dim = `${b.readUInt32BE(16)}×${b.readUInt32BE(20)}, ${(b.length/1024).toFixed(1)} KB`;
      c(`${f} è un PNG valido`, firma, dim);
    } else c(`${f} esiste`, false);
  }
  const b = fs.readFileSync(join(SITO, 'anteprima.png'));
  c('l\'anteprima ha le proporzioni che le anteprime si aspettano',
    b.readUInt32BE(16) === 1200 && b.readUInt32BE(20) === 630);
  // LA FAVICON COME FILE. Il data URI da solo non basta: Chrome non lo disegna, e `/favicon.ico`
  // il browser lo chiede comunque — preferiti, cronologia, anteprima di un link — trovando un
  // 404 se non c'è. Qui si controlla che ci sia, che sia un ICO vero (le prime sei cifre sono
  // l'intestazione: riservato 0, tipo 1, quante misure) e che ogni pagina lo dichiari.
  {
    const p = join(SITO, 'favicon.ico');
    if (!fs.existsSync(p)) c('favicon.ico esiste', false);
    else {
      const f = fs.readFileSync(p);
      const misure = f.readUInt16LE(4);
      c('favicon.ico è un ICO valido',
        f.readUInt16LE(0) === 0 && f.readUInt16LE(2) === 1 && misure > 0,
        `${misure} misure, ${f.length} byte`);
      // ogni voce deve puntare dentro il file, o il browser legge fuori e mostra niente
      const dentro = Array.from({length: misure}, (_, i) => {
        const v = 6 + 16 * i;
        return f.readUInt32LE(v + 12) + f.readUInt32LE(v + 8) <= f.length;
      }).every(Boolean);
      c('e ogni misura sta dentro il file', dentro);
    }
  }
  // un'immagine sopra il mezzo mega viene scartata da alcuni scraper, e comunque è un peso
  // che il sito non deve avere
  c('e sta abbondantemente sotto il limite pratico degli scraper',
    b.length < 300 * 1024, `${(b.length/1024).toFixed(1)} KB`);
}

// --- 2. OGNI PAGINA HA UNA SCHEDA COMPLETA ----------------------------------
{
  const manca = [];
  for (const p of pagine){
    const h = testo[p];
    for (const [nome, re] of [
      ['og:title',       /property="og:title" content="([^"]*)"/],
      ['og:description', /property="og:description" content="([^"]*)"/],
      ['og:image',       /property="og:image" content="([^"]*)"/],
      ['twitter:card',   /name="twitter:card" content="([^"]*)"/],
      ['icona',          /rel="apple-touch-icon" href="([^"]*)"/],
      // tutte e due le forme: il file per chi non legge i data URI — Chrome — e l'SVG per gli
      // altri. Con una sola delle due il difetto torna su una parte dei browser, cioè invisibile
      ['favicon.ico',    /rel="icon" href="(\/favicon\.ico)"/],
      ['favicon SVG',    /rel="icon" href="(data:image\/svg\+xml[^"]*)"/]
    ]) if (!attr(h, re)) manca.push(`${p}: ${nome}`);
  }
  c('ogni pagina porta titolo, descrizione, immagine e icona', manca.length === 0,
    manca.slice(0, 4).join(' · '));

  // L'INDIRIZZO DELL'IMMAGINE DEV'ESSERE ASSOLUTO. Relativo, la scheda resta senza immagine e
  // il sito sembra a posto perché nel browser non cambia niente. È il difetto che questo
  // controllo esiste per prendere.
  const relativi = pagine.filter(p => !/^https:\/\//.test(attr(testo[p], /property="og:image" content="([^"]*)"/)));
  c('e l\'indirizzo dell\'immagine è assoluto, non relativo', relativi.length === 0,
    relativi.join(', '));

  // con un'immagine larga la scheda va dichiarata grande, o resta il francobollo
  c('la scheda è dichiarata grande, visto che un\'immagine c\'è',
    pagine.every(p => attr(testo[p], /name="twitter:card" content="([^"]*)"/) === 'summary_large_image'));

  // il titolo della scheda è quello della pagina: se divergono, chi condivide promette una cosa
  // e chi apre ne trova un'altra
  const divergono = pagine.filter(p =>
    attr(testo[p], /<title>([\s\S]*?)<\/title>/).trim() !== attr(testo[p], /property="og:title" content="([^"]*)"/));
  c('il titolo della scheda è quello della pagina', divergono.length === 0, divergono.join(', '));

  // --- LA VETRINA STA DENTRO LA CORNICE ------------------------------------
  // Un risultato di ricerca ha una misura, e chi la supera viene TAGLIATO: si perde sempre la
  // coda, cioè la parte che convince a cliccare. L'08/08/2026 erano fuori misura cinque titoli su
  // dieci (fino a 81 caratteri) e DIECI descrizioni su dieci (fino a 187) — allungate una parola
  // alla volta, senza che nessun controllo le guardasse. Le due misure sono quelle pratiche di
  // Google: ~60 caratteri per il titolo, ~158 per la descrizione.
  // La banda ha anche un MINIMO: una descrizione di sessanta caratteri non è concisa, è una
  // riga di spazio regalata a nessuno.
  {
    const testa = (p, re) => attr(testo[p], re).replace(/\s+/g, ' ').trim();
    const TIT = 60, DES_MIN = 135, DES_MAX = 158;
    const lunghi = pagine.map(p => [p, testa(p, /<title>([\s\S]*?)<\/title>/)])
      .filter(([, t]) => t.length > TIT);
    c(`ogni titolo sta in ${TIT} caratteri, o il risultato lo taglia`, lunghi.length === 0,
      lunghi.map(([p, t]) => `${p}: ${t.length}`).join(' · '));

    const fuori = pagine.map(p => [p, testa(p, /name="description" content="([^"]*)"/)])
      .filter(([, d]) => d.length > DES_MAX || d.length < DES_MIN);
    c(`e ogni descrizione sta fra ${DES_MIN} e ${DES_MAX}`, fuori.length === 0,
      fuori.map(([p, d]) => `${p}: ${d.length}`).join(' · '));

    // DUE PAGINE CON LA STESSA VETRINA competono fra loro per la stessa ricerca, e il motore ne
    // sceglie una. Oggi sono tutte diverse: è una proprietà da mantenere, non da riconquistare.
    const doppioni = (re, come) => {
      const visti = new Map();
      for (const p of pagine){ const k = testa(p, re); visti.set(k, [...(visti.get(k) || []), p]); }
      return [...visti.values()].filter(v => v.length > 1).map(v => `${come}: ${v.join(' = ')}`);
    };
    const uguali = [...doppioni(/<title>([\s\S]*?)<\/title>/, 'titolo'),
                    ...doppioni(/name="description" content="([^"]*)"/, 'descrizione')];
    c('e nessuna pagina porta la vetrina di un\'altra', uguali.length === 0, uguali.join(' · '));
  }
}

// --- 3. LE BRICIOLE DICHIARATE SONO QUELLE MOSTRATE -------------------------
// `BreadcrumbList` fa comparire il percorso nei risultati di ricerca. Se dichiarasse un
// percorso diverso da quello scritto in cima alla pagina sarebbe una dichiarazione falsa a un
// motore di ricerca, che è il modo migliore per essere puniti.
{
  const conBriciole = pagine.filter(p => /class="briciole"/.test(testo[p]));
  c('le pagine di contenuto hanno le briciole', conBriciole.length >= 7, `${conBriciole.length} pagine`);
  const guai = [];
  for (const p of conBriciole){
    const h = testo[p];
    const dati = attr(h, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    // la 404 non ha canonical e non va indicizzata: giusto che non dichiari un percorso
    if (!dati){ if (p !== '404.html') guai.push(`${p}: nessun dato strutturato`); continue; }
    let j; try { j = JSON.parse(dati); } catch(e){ guai.push(`${p}: JSON rotto`); continue; }
    const foglia = attr(h, /<p class="briciole">([\s\S]*?)<\/p>/)
      .replace(/<[^>]*>/g, '').split(/&rarr;|→/).pop().replace(/&nbsp;/g, ' ').trim();
    const dichiarata = (j.itemListElement || []).at(-1)?.name;
    if (dichiarata !== foglia) guai.push(`${p}: dice «${dichiarata}» ma mostra «${foglia}»`);
  }
  c('e dichiarano lo stesso percorso che mostrano', guai.length === 0, guai.slice(0, 3).join(' · '));
}

// --- 3-bis. IL CALCOLATORE SI DICHIARA PER QUELLO CHE È ---------------------
// Stessa regola delle briciole, applicata all'unica pagina che non ne ha: quello che si dice a
// una macchina dev'essere quello che la pagina mostra a una persona. Qui il rischio non è di
// posizionamento ma di ONESTÀ, perché nessun umano legge questo blocco: sono i due campi in cui
// si è tentati di scrivere quello che fa comodo — una valutazione che non esiste, un prezzo che
// non è zero — e nessuno se ne accorgerebbe mai aprendo il sito.
{
  const dati = p => {
    const m = [...testo[p].matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const x of m){ try { const j = JSON.parse(x[1]);
      if (j['@type'] === 'WebApplication') return j; } catch(e){} }
    return null;
  };
  const dove = pagine.filter(p => dati(p));
  c('solo il calcolatore si dichiara un applicativo', dove.length === 1 && dove[0] === 'index.html',
    dove.join(', ') || 'nessuna pagina');

  const j = dati('index.html');
  if (!j){ c('la home dichiara l\'applicativo', false); }
  else {
    const h = testo['index.html'];
    // identità: nessuno dei tre è riscritto a mano, quindi devono coincidere con la pagina
    const h1   = attr(h, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]*>/g, '').trim();
    const desc = attr(h, /<meta name="description" content="([^"]*)"/);
    const can  = attr(h, /<link rel="canonical" href="([^"]*)"/);
    const guai = [];
    if (j.name !== h1)         guai.push(`nome «${j.name}» invece di «${h1}»`);
    if (j.description !== desc) guai.push('descrizione diversa da quella della pagina');
    if (j.url !== can)          guai.push(`indirizzo «${j.url}» invece di «${can}»`);
    c('e dichiara la stessa identità che mostra', guai.length === 0, guai.join(' · '));

    // QUESTA È LA GUARDIA CHE CONTA. Una valutazione inventata farebbe comparire le stelline nei
    // risultati di ricerca: è il difetto più redditizio e più disonesto che questo file possa
    // lasciar passare, ed è invisibile a chiunque non legga il sorgente.
    const inventate = ['aggregateRating', 'review', 'ratingValue'].filter(k => k in j);
    c('non inventa valutazioni per farsi mostrare meglio', inventate.length === 0,
      inventate.join(', '));
    c('e dichiara gratuito quello che è gratuito',
      j.isAccessibleForFree === true && j.offers?.price === '0', JSON.stringify(j.offers));

    const { REVISIONE_ISO } = await import('../regole.mjs');
    c('la data è la revisione dei parametri, come nella sitemap',
      j.dateModified === REVISIONE_ISO, String(j.dateModified));
  }
}

// --- 3-ter. IL SITO RESTA VERIFICATO PRESSO CHI LO INDICIZZA ----------------
// Il file di Bing è l'unica cosa del sito che, sparendo, non si vede sparire: la pagina si apre
// uguale, nessun controllo si accorge di niente, e intanto il dominio smette di essere
// verificato — quindi il sito esce dall'indice da cui passa la ricerca degli assistenti. È
// esattamente la classe di guasti per cui questo file esiste. Il CNAME invece non ha bisogno di
// guardia: se manca, il sito non risponde più sul dominio, e si vede da sé.
{
  const p = join(SITO, 'BingSiteAuth.xml');
  const c1 = fs.existsSync(p);
  c('il sito resta verificato presso Bing', c1, c1 ? '' : 'BingSiteAuth.xml non c\'è');
  if (c1){
    const x = fs.readFileSync(p, 'utf8');
    c('e il file porta un codice, non un segnaposto',
      /<users>\s*<user>[0-9A-F]{32}<\/user>\s*<\/users>/.test(x),
      x.replace(/\s+/g, ' ').trim());
  }
}

// --- 4. LA SITEMAP DICE QUANDO IL CONTENUTO È STATO VERIFICATO --------------
{
  const sm = fs.readFileSync(join(SITO, 'sitemap.xml'), 'utf8');
  const loc = (sm.match(/<loc>/g) || []).length, mod = (sm.match(/<lastmod>/g) || []).length;
  c('ogni voce della sitemap porta la data di revisione', loc > 0 && loc === mod,
    `${loc} pagine, ${mod} date`);
  // la data non è quella del file né di oggi: è la revisione dei parametri, l'unica che
  // significhi qualcosa su una pagina che espone cifre di legge
  const { REVISIONE_ISO } = await import('../regole.mjs');
  c('e la data è la revisione dei parametri, non quella del momento',
    sm.includes(`<lastmod>${REVISIONE_ISO}</lastmod>`), REVISIONE_ISO);
}

console.log(ko ? `\n✗ ${ko} controlli falliti` : '\n  la scheda che si vede condividendo il link è completa');
if (ko) process.exitCode = 1;
