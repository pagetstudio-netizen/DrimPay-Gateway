'use strict';
// ─── Passenger/Plesk compatibility wrapper ─────────────────────────────────
// Passenger may load startup files via require() which cannot handle .mjs
// (ESM) files. This CJS wrapper uses dynamic import() with a file:// URL
// to correctly load the ESM bundle on any Node.js 14+ runtime.
// ───────────────────────────────────────────────────────────────────────────

var path = require('path');
var fs   = require('fs');
var url  = require('url');

var bundlePath = path.join(__dirname, 'artifacts', 'api-server', 'dist', 'index.mjs');
var logPath    = path.join(__dirname, 'logs', 'startup-errors.log');

function writeLog(msg) {
  try {
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
    fs.appendFileSync(logPath, '[' + new Date().toISOString() + '] ' + msg + '\n');
  } catch (_) {}
  process.stderr.write(msg + '\n');
}

writeLog('[start.cjs] Node.js ' + process.version + ' — démarrage');
writeLog('[start.cjs] __dirname = ' + __dirname);
writeLog('[start.cjs] PORT = ' + (process.env.PORT || '(non défini)'));
writeLog('[start.cjs] NODE_ENV = ' + (process.env.NODE_ENV || '(non défini)'));

if (!fs.existsSync(bundlePath)) {
  writeLog('[start.cjs] ERREUR FATALE: Bundle introuvable: ' + bundlePath);
  writeLog('[start.cjs] Contenu de artifacts/api-server/dist/:');
  try {
    var distDir = path.join(__dirname, 'artifacts', 'api-server', 'dist');
    if (fs.existsSync(distDir)) {
      fs.readdirSync(distDir).forEach(function(f) { writeLog('  - ' + f); });
    } else {
      writeLog('  (dossier dist/ absent)');
    }
  } catch (e) { writeLog('  (impossible de lister: ' + e.message + ')'); }
  process.exit(1);
}

writeLog('[start.cjs] Bundle trouvé — chargement via import()...');

// Convert absolute path to file:// URL for maximum compatibility
var bundleUrl = url.pathToFileURL(bundlePath).href;

import(bundleUrl).then(function() {
  writeLog('[start.cjs] Bundle chargé avec succès');
}).catch(function(err) {
  writeLog('[start.cjs] ERREUR au chargement du bundle:');
  writeLog(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
