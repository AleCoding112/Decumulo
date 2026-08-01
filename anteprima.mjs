// ============================================================================
//  L'IMMAGINE DI ANTEPRIMA, disegnata qui.
//
//  Mandando il link su WhatsApp, Telegram o LinkedIn, chi lo riceve vede una
//  scheda. Senza `og:image` quella scheda è un rettangolo di testo nudo, e per
//  un sito che vive di condivisioni è la mancanza che si vede di più.
//
//  PERCHÉ UN PNG GENERATO E NON UN FILE. `og:image` deve puntare a un file
//  vero: i data URI, che il sito usa per la favicon, gli scraper non li
//  leggono. Un file disegnato a mano però sarebbe l'unica cosa in `sito/` che
//  il build non sa rifare, e alla prima modifica del colore resterebbe
//  indietro. Qui il PNG si scrive con `zlib`, che sta già in Node: nessuna
//  dipendenza, nessuno strumento esterno, e si rigenera con tutto il resto.
//
//  COSA DISEGNA, e non è una decorazione: la curva del patrimonio che sale
//  finché si lavora e scende dopo. È esattamente la figura che il calcolatore
//  produce, negli stessi colori. Chi vede l'anteprima ha già visto il prodotto.
//
//  Niente scritte: comporre lettere pixel per pixel senza un font darebbe un
//  risultato posticcio, e il titolo la scheda lo mette già da sé sotto
//  l'immagine, leggendolo da `og:title`.
// ============================================================================
import { deflateSync } from 'node:zlib';

// --- PNG: firma, IHDR, IDAT, IEND. Niente di più serve. ---------------------
const TAB = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++){
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = buf => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TAB[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (tipo, dati) => {
  const t = Buffer.from(tipo, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(dati.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dati])));
  return Buffer.concat([len, t, dati, crc]);
};
function png(w, h, rgb){
  // ogni riga porta davanti il byte del filtro: 0 = nessuno. Il PNG è piccolo e
  // le tinte sono piatte, quindi deflate fa già tutto il lavoro.
  const righe = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++){
    righe[y * (w * 3 + 1)] = 0;
    rgb.copy(righe, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;            // 8 bit per canale, colore RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(righe, {level: 9})),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// --- una tela, disegnata al triplo e poi rimpicciolita ----------------------
// È il modo più semplice di avere bordi non seghettati senza scrivere un
// antialiasing: si disegna a pixel duri su una tela tre volte più grande e si
// fa la media di ogni quadrato 3×3. Su una curva sottile la differenza fra
// questo e un bordo netto è tutta la differenza fra un disegno e un errore.
const S = 3;
function tela(w, h, sfondo){
  const W = w * S, H = h * S, buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++){
    buf[i*3] = sfondo[0]; buf[i*3+1] = sfondo[1]; buf[i*3+2] = sfondo[2];
  }
  const punto = (x, y, c, a = 1) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) buf[i+k] = Math.round(buf[i+k] * (1 - a) + c[k] * a);
  };
  return {
    W, H,
    rett(x0, y0, x1, y1, c, a = 1){
      for (let y = Math.max(0, y0|0); y < Math.min(H, y1|0); y++)
        for (let x = Math.max(0, x0|0); x < Math.min(W, x1|0); x++) punto(x, y, c, a);
    },
    // Il tratto si disegna per distanza dal segmento, non per interpolazione: così gli
    // angoli fra due segmenti restano pieni e non si aprono. Si visita solo il rettangolo
    // intorno a ciascun segmento, altrimenti il conto sarebbe sull'intera tela per ogni pezzo.
    tratto(punti, spess, c){
      const r = spess * S / 2;
      for (let i = 1; i < punti.length; i++){
        const [ax, ay] = punti[i-1], [bx, by] = punti[i];
        const dx = bx - ax, dy = by - ay, L2 = dx*dx + dy*dy;
        for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++)
          for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++){
            const t = L2 ? Math.max(0, Math.min(1, ((x-ax)*dx + (y-ay)*dy) / L2)) : 0;
            const px = ax + t*dx - x, py = ay + t*dy - y;
            if (px*px + py*py <= r*r) punto(x, y, c);
          }
      }
    },
    // riduce a w×h facendo la media di ogni quadrato S×S
    finita(){
      const out = Buffer.alloc(w * h * 3);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++){
          let r = 0, g = 0, b = 0;
          for (let j = 0; j < S; j++)
            for (let i = 0; i < S; i++){
              const p = ((y*S + j) * W + (x*S + i)) * 3;
              r += buf[p]; g += buf[p+1]; b += buf[p+2];
            }
          const n = S*S, o = (y*w + x)*3;
          out[o] = Math.round(r/n); out[o+1] = Math.round(g/n); out[o+2] = Math.round(b/n);
        }
      return png(w, h, out);
    }
  };
}

// --- i colori sono quelli del sito, non altri -------------------------------
const SFONDO = [0xfa, 0xf9, 0xf6];   // --bg
const VERDE  = [0x2f, 0x6f, 0x4e];   // --su, la curva del patrimonio
const LINEA  = [0xe0, 0xdd, 0xd6];   // --line
const TENUE  = [0xc9, 0xc4, 0xba];   // la linea di base, un poco più marcata

// LA CURVA: sale finché si lavora, e scende dopo. Il colmo sta a poco più di
// metà, dove cade la fine dell'attività in quasi tutti i piani, e la discesa
// non arriva a zero: il caso normale è che il patrimonio duri.
function curva(n = 220){
  const COLMO = 0.58, RESTA = 0.30, W = 0.16;
  // I DUE RAMI SI MESCOLANO INTORNO AL COLMO. Accostati e basta si incontrano con pendenze
  // diverse, e il vertice viene uno spigolo: a 1200 px si legge come un errore di disegno,
  // non come una curva. Ciascun ramo prosegue oltre il proprio tratto (`pot` tiene il segno,
  // o la potenza di un numero negativo darebbe NaN) e il passaggio è una `smoothstep`.
  const pot = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  const sale  = t => 0.10 + 0.90 * pot(t / COLMO, 2.0);
  const scende = t => 1 - (1 - RESTA) * pot((t - COLMO) / (1 - COLMO), 1.7);
  const punti = [];
  for (let i = 0; i <= n; i++){
    const t = i / n;
    const s = Math.min(1, Math.max(0, (t - (COLMO - W)) / (2 * W)));
    const k = s * s * (3 - 2 * s);
    punti.push([t, sale(t) * (1 - k) + scende(t) * k]);
  }
  return punti;
}

export function anteprima(){
  const W = 1200, H = 630, t = tela(W, H, SFONDO);
  const sx = 96*S, dx = (W-96)*S, su = 120*S, giu = (H-118)*S;
  const X = u => sx + u * (dx - sx);
  const Y = v => giu - v * (giu - su);

  // le linee di riferimento, appena visibili: fanno leggere la figura come un
  // grafico invece che come uno scarabocchio
  for (let k = 1; k <= 4; k++) t.rett(sx, Y(k/4), dx, Y(k/4) + 2*S, LINEA);

  const c = curva();
  const p = c.map(([u, v]) => [X(u), Y(v)]);
  // L'AREA SOTTO LA CURVA, nella stessa tinta molto diluita: è come la disegna il sito.
  // Ogni colonna si riempie UNA VOLTA SOLA. Riempiendo per segmento, i rettangoli adiacenti
  // si sovrapponevano di un pixel e quella colonna riceveva la tinta due volte: nel risultato
  // si vedevano strisce verticali chiare e scure, che a colpo d'occhio sembravano una texture.
  for (let x = Math.ceil(sx); x < dx; x++){
    const u = (x - sx) / (dx - sx);
    const i = Math.min(c.length - 2, Math.floor(u * (c.length - 1)));
    const f = u * (c.length - 1) - i;
    const v = c[i][1] + (c[i+1][1] - c[i][1]) * f;
    t.rett(x, Y(v), x + 1, giu, VERDE, 0.10);
  }
  t.rett(sx, giu, dx, giu + 3*S, TENUE);      // la linea di base
  t.tratto(p, 9, VERDE);
  return t.finita();
}

// L'ICONA PER LA SCHERMATA HOME di iOS, che non legge la favicon SVG.
//
// NON è la curva dell'anteprima rimpicciolita, ed è una correzione: dentro un quadrato la
// salita seguita dalla discesa diventa una punta, e a 180 px si legge come un accento
// circonflesso invece che come un grafico. Qui va lo STESSO segno della favicon — la sola
// discesa, appoggiata a una linea di base — perché un marchio è uno, in due misure.
export function icona(lato = 180){
  const t = tela(lato, lato, SFONDO);
  // Le proporzioni sono quelle della favicon, non altre: margine 12,5%, discesa dal 28% all'84%,
  // tratto al 10,6% del lato. Un marchio che cambia spessore fra due misure sembra due marchi.
  const L = lato * S, m = L * 0.125, su = L * 0.28, giu = L * 0.84;
  const p = [];
  for (let i = 0; i <= 80; i++){
    const u = i / 80, k = u * u * (3 - 2 * u);   // discesa dolce, ferma ai due estremi
    p.push([m + u * (L - 2*m), su + k * (giu - su)]);
  }
  t.tratto(p, lato * 0.106, VERDE);
  return t.finita();
}
