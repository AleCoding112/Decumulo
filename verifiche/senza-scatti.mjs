// ============================================================================
//  LA PAGINA NON DEVE SALTARE MENTRE SI TRASCINA UN CURSORE.
//
//      node verifiche/senza-scatti.mjs
//
//  IL DIFETTO CHE HA FATTO NASCERE QUESTO FILE, misurato prima di ripararlo:
//  trascinando il cursore dei versamenti avanti e indietro, i blocchi sotto —
//  l'altro cursore, i tre passi del fondo — si spostavano 8-12 volte per un
//  totale di 124-188 px. Non è un difetto di una frase: è la somma della prosa
//  che REAGISCE al cursore (la riga sopra, i due «picco», l'esito, i pulsanti,
//  la domanda sulla quota minima), che cambia numero di righe a ogni scatto del
//  dito. Nessuna verifica poteva vederlo: le frasi erano giuste, i numeri erano
//  giusti, niente sbordava, e la console era pulita.
//
//  DOVE STA, E PERCHÉ NON ALTROVE. `a-schermo.mjs` misura ma non sa cliccare;
//  `occhi.mjs` sa pilotare il browser ma per mestiere non afferma quasi niente.
//  Qui serve tutte e due le cose — prendere il cursore, trascinarlo, misurare —
//  quindi è un terzo file che prende da `occhi.mjs` il solo modo di aprire
//  Chrome che questo progetto ha. Fuori dalla catena veloce, come gli altri due.
//
//  COSA AFFERMA, e perché la soglia non è zero. Il rimedio in `index.html`
//  (`fermaIlSaltoDeiCursori`) impedisce ai blocchi di RESTRINGERSI mentre si
//  trascina, non di crescere: una frase che ha bisogno di una riga in più deve
//  poterla prendere, l'alternativa sarebbe nascondere del testo. Quindi resta
//  legittimo UN assestamento per blocco, e si controllano due cose diverse:
//  quante volte si muove (poche) e di quanto in tutto (poco).
//
//  IL TRASCINAMENTO SI SIMULA CON `pointerdown` … `pointerup`, e non è un
//  dettaglio: senza quei due eventi il rimedio non si accende, e il file
//  misurerebbe la pagina di prima dichiarandola guarita. Il banco lo verifica da
//  sé — «a secco» deve saltare, «trascinato» no.
// ============================================================================
import { apri } from './occhi.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITO = join(dirname(fileURLToPath(import.meta.url)), '..', 'sito');

// due persone, entrambe al lavoro: è l'assetto in cui i cursori ci sono tutti
const DATI = {quanti:'2', nome0:'Anna', nome1:'Bruno', nascita0:1975, nascita1:1978,
  ral0:38000, ral1:30000, pens0:1500, pens1:1200, annoPens0:2042, annoPens1:2045,
  fondo0:60000, fondo1:40000, iscr0:2005, iscr1:2008, pcVoi0:3, pcVoi1:2, pcDat0:2, pcDat1:1.5,
  cl0:60000, cl1:8000, cl2:40000, cl3:92000, spesa:2500, infl:2, etaFine:95,
  tfrGia0:52000, annoLav0:2001};

// i punti che si guardano mentre si trascina: gli altri cursori e i blocchi vicini.
// Sono quelli che l'occhio segue davvero — chi trascina non guarda il risultato in cima.
const SPIE = ['#cVers0', '#cVers1', '#decVersare', '#decFondo', '#cCap0', '#cCap1'];

const SCATTI_AMMESSI = 2;      // un assestamento per blocco, e uno di margine
const PIXEL_AMMESSI  = 12;     // due righe piccole: sotto non si percepisce

// avanti e indietro DUE VOLTE: è il ritorno a fare la vibrazione, e una corsa
// sola in un verso solo non lo mostrerebbe mai
function misura(b, id, trascinato){
  return b.js(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    const spie = ${JSON.stringify(SPIE)};
    const min = +el.min, max = +el.max, st = +el.step || 1;
    const p = []; for (let k = 0; k <= 20; k++) p.push(min + (max - min) * k / 20);
    const giro = [...p, ...p.slice().reverse(), ...p, ...p.slice().reverse()]
      .map(v => Math.round(v / st) * st);

    el.value = String(giro[0]); el.dispatchEvent(new Event('input', {bubbles:true}));
    // il cursore a mezzo schermo, come lo tiene chi lo sta usando: più in alto o
    // più in basso l'ancoraggio del browser sposterebbe altre cose e la misura
    // parlerebbe di lui invece che della pagina
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight / 2);

    if (${trascinato}) el.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));
    const y = {}; spie.forEach(s => y[s] = []);
    for (const v of giro){
      el.value = String(v); el.dispatchEvent(new Event('input', {bubbles:true}));
      spie.forEach(s => { const e = document.querySelector(s);
        y[s].push(e ? Math.round(e.getBoundingClientRect().top) : null); });
    }
    if (${trascinato}) el.dispatchEvent(new PointerEvent('pointerup', {bubbles:true}));

    let scatti = 0, pixel = 0, chi = '';
    for (const s of spie){
      const a = y[s].filter(v => v !== null);
      let n = 0, tot = 0;
      for (let i = 1; i < a.length; i++){
        const d = Math.abs(a[i] - a[i-1]);
        if (d >= 2){ n++; tot += d; }
      }
      if (tot > pixel){ pixel = tot; chi = s; }
      if (n > scatti) scatti = n;
    }
    return { scatti, pixel, chi };
  })()`);
}

const b = await apri({ larghezza: 1280, altezza: 900 });
let ko = 0;
const dice = (buono, testo, extra = '') =>
  console.log(`  ${buono ? 'ok ' : 'KO '} ${testo}${extra ? '   ' + extra : ''}`) || (buono ? 0 : ko++);

try {
  await b.senzaBanner('file://' + join(SITO, 'index.html'));
  await b.compila(DATI);

  const cursori = await b.js(
    `[...document.querySelectorAll('input[type=range]')].filter(e=>e.offsetWidth).map(e=>e.id)`);
  dice(cursori.length >= 4, `i cursori visibili sono ${cursori.length}`, cursori.join(' '));

  let almenoUnoSaltavaPrima = false;
  for (const id of cursori){
    const secco = await misura(b, id, false);
    const tras  = await misura(b, id, true);
    if (secco.pixel > PIXEL_AMMESSI) almenoUnoSaltavaPrima = true;
    dice(tras.scatti <= SCATTI_AMMESSI && tras.pixel <= PIXEL_AMMESSI,
      `${id}: trascinandolo la pagina non salta`,
      `${tras.scatti} scatti, ${tras.pixel} px (${tras.chi || '—'}); senza il rimedio ` +
      `${secco.scatti} scatti, ${secco.pixel} px`);
  }

  // IL BANCO CONTROLLA SE STESSO. Se un giorno `pointerdown`/`pointerup` non
  // accendessero più il rimedio, tutte le righe qui sopra resterebbero verdi
  // misurando una pagina che non è mai stata riparata.
  dice(almenoUnoSaltavaPrima,
    'e la misura sa ancora vedere il difetto: senza pointerdown la pagina salta');

  dice(b.guai.length === 0, 'nessun errore in console', b.guai.join(' | '));
} finally { await b.chiudi(); }

console.log(ko ? `\n${ko} KO` : '\n✓ trascinare un cursore non muove la pagina');
process.exit(ko ? 1 : 0);
