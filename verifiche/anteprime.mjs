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
      ['icona',          /rel="apple-touch-icon" href="([^"]*)"/]
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
