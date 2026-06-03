'use strict';
// ─── Passenger/Plesk compatibility wrapper ─────────────────────────────────
// Phusion Passenger may load the startup file via require() which cannot
// handle .mjs (ESM) files directly. This CJS wrapper uses dynamic import()
// to load the ESM bundle, which works correctly in Node 18+.
//
// Plesk startup file: start.cjs
// ───────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

const bundlePath = path.join(__dirname, 'artifacts', 'api-server', 'dist', 'index.mjs');

if (!fs.existsSync(bundlePath)) {
  const msg = '[DrimPay] ERREUR: Bundle introuvable: ' + bundlePath + '\n' +
              'Vérifiez que artifacts/api-server/dist/index.mjs est bien dans le repo git.\n';
  process.stderr.write(msg);
  process.exit(1);
}

import(bundlePath).catch(function (err) {
  const msg = '[DrimPay startup error] ' + (err && err.stack ? err.stack : String(err)) + '\n';
  process.stderr.write(msg);
  // Aussi logguer dans un fichier lisible depuis Plesk File Manager
  try {
    const logDir = path.join(__dirname, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'startup-errors.log'), '[' + new Date().toISOString() + '] ' + msg);
  } catch (_) {}
  process.exit(1);
});
