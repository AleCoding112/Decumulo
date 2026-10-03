// ============================================================================
//  DOVE STA IL BROWSER, in un posto solo.
//
//  `a-schermo.mjs` e `occhi.mjs` avevano ciascuno il proprio percorso scritto a
//  mano, quello di Google Chrome in /Applications. Il 03/10/2026 Chrome non
//  c'era più su questa macchina, e `a-schermo.mjs` ha stampato «controllo
//  saltato» uscendo con successo: una rilettura intera è finita senza i
//  controlli nel browser, mentre un Chromium utilizzabile stava nella cache di
//  Playwright. Ora si cerca in ordine — la variabile CHROME, Chrome, Chromium,
//  Chrome for Testing di Playwright — e chi non trova niente lo dice per nome.
// ============================================================================
import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

function candidati(){
  const c = [process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  // la cache di Playwright: la versione più recente per prima
  const cache = join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  try {
    for (const d of fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d))
                        .sort((a, b) => +b.split('-')[1] - +a.split('-')[1]))
      for (const arch of ['chrome-mac-arm64', 'chrome-mac', 'chrome-mac-x64'])
        c.push(join(cache, d, arch, 'Google Chrome for Testing.app', 'Contents', 'MacOS',
                    'Google Chrome for Testing'),
               join(cache, d, arch, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'));
  } catch {}
  return c.filter(Boolean);
}

export const CHROME = candidati().find(p => fs.existsSync(p)) || null;
export const SENZA_CHROME = 'nessun Chrome o Chromium trovato (si può indicare con CHROME=<percorso>)';
