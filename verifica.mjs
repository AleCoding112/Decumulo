// ============================================================================
//  UN SOLO COMANDO:  node verifica.mjs
//
//  Costruisce e poi passa tutti i controlli, in ordine di costo crescente.
//  Si ferma al primo che fallisce, così l'errore che si vede è il primo che
//  conta e non l'ultimo di una cascata.
//
//  Da lanciare SEMPRE dopo aver toccato il motore o `regole.mjs`.
// ============================================================================
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));

const passi = [
  ['build.mjs',                            'costruisce sorgenti/ → sito/'],
  ['test.mjs',                             'i controlli sul motore'],
  ['verifiche/come-parla.mjs',             'le frasi che il calcolatore scrive, scenario per scenario'],
  ['verifiche/valori-ostili.mjs',          'duemila moduli riempiti con valori impossibili'],
  ['verifiche/tavole-dei-fondi.mjs',       'la curva dei coefficienti contro le tavole vere'],
  ['verifiche/seconda-implementazione.mjs','confronto con un motore riscritto dalle regole'],
  ['verifiche/invarianti.mjs',             'invarianti su piani casuali'],
  ['verifiche/schermi.mjs',                'che niente esca dallo schermo di un telefono'],
  ['verifiche/coerenza.mjs',               'che le pagine dicano quello che il conto fa'],
  ['verifiche/consenso.mjs',               'che il tag non parta senza consenso'],
  ['verifiche/anteprime.mjs',              'la scheda che si vede condividendo il link'],
  // per ultimo, e non per importanza: è l'unico controllo che non guarda il codice ma il
  // calendario. Sta in fondo perché una data scaduta non invalida quello che sta sopra, e
  // vederla per prima bloccherebbe ogni modifica al codice per una ragione che non c'entra.
  ['verifiche/scadenze.mjs',               'se i parametri sono ancora quelli correnti'],
];

let rotto = null;
for (const [file, cosa] of passi){
  process.stdout.write(`\n\x1b[1m▸ ${file}\x1b[0m — ${cosa}\n`);
  try {
    const out = execFileSync('node', [file], {cwd: QUI, encoding: 'utf8'});
    // di ciascuno interessa il verdetto, non il dettaglio: quello si legge lanciandolo a parte
    const righe = out.trim().split('\n');
    const utili = righe.filter(r => /\b(ok|KO|DIVERGE|VIOLATA|✗|!|Cifre|pagine|casi|piani|Scarto|nessuna)\b/.test(r));
    console.log((utili.length ? utili : righe).slice(-8).map(r => '  ' + r.trim()).join('\n'));
  } catch (e){
    console.log((e.stdout || '').split('\n').slice(-14).map(r => '  ' + r).join('\n'));
    console.log((e.stderr || '').split('\n').slice(0, 6).map(r => '  ' + r).join('\n'));
    rotto = file;
    break;
  }
}

console.log(rotto ? `\n\x1b[31m✗ fermato su ${rotto}\x1b[0m`
                  : `\n\x1b[32m✓ tutto verde\x1b[0m — build, motore, frasi, valori ostili, tavole,\n  seconda implementazione, invarianti, schermi, coerenza, consenso, anteprime, scadenze`);
if (rotto) process.exitCode = 1;
