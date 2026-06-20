'use strict';
// ─── Passenger/Plesk compatibility wrapper ─────────────────────────────────
// Passenger may load startup files via require() which cannot handle .mjs
// (ESM) files. This CJS wrapper uses dynamic import() with a file:// URL
// to correctly load the ESM bundle on any Node.js 14+ runtime.
//
// En cas d'erreur de démarrage, lance un mini serveur HTTP de diagnostic
// pour que l'erreur soit visible dans le navigateur (au lieu de la page
// générique Passenger "We're sorry").
// ───────────────────────────────────────────────────────────────────────────

var path = require('path');
var fs   = require('fs');
var url  = require('url');
var http = require('http');
var os   = require('os');

var bundlePath = path.join(__dirname, 'artifacts', 'api-server', 'dist', 'index.mjs');
var logPath    = path.join(__dirname, 'logs', 'startup-errors.log');
var startTime  = new Date().toISOString();
var errors     = [];

function writeLog(msg) {
  try {
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
    fs.appendFileSync(logPath, '[' + new Date().toISOString() + '] ' + msg + '\n');
  } catch (_) {}
  process.stderr.write(msg + '\n');
}

function addError(msg) {
  errors.push(msg);
  writeLog(msg);
}

// ── Collecte diagnostics ──────────────────────────────────────────────────
var diag = {
  nodeVersion:  process.version,
  platform:     process.platform,
  arch:         process.arch,
  cwd:          process.cwd(),
  dirname:      __dirname,
  port:         process.env.PORT || '(non défini)',
  nodeEnv:      process.env.NODE_ENV || '(non défini)',
  startTime:    startTime,
};

// Fichiers clés
var keyFiles = {
  'start.cjs':               path.join(__dirname, 'start.cjs'),
  'api-server dist':         bundlePath,
  'frontend dist':           path.join(__dirname, 'artifacts', 'drimpay', 'dist', 'public', 'index.html'),
  'pnpm-lock.yaml':          path.join(__dirname, 'pnpm-lock.yaml'),
  'node_modules':            path.join(__dirname, 'node_modules'),
};
var fileStatus = {};
for (var k in keyFiles) {
  fileStatus[k] = fs.existsSync(keyFiles[k]) ? '✓ présent' : '✗ ABSENT';
}

// Variables d'env importantes (existence seulement)
var envKeys = [
  'NODE_ENV','PORT','SESSION_SECRET',
  'SUPABASE_DATABASE_URL','DATABASE_URL',
  'SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY',
  'CLAPAY_API_TOKEN','CLAPAY_BASE_URL',
  'RESEND_API_KEY','ACTIVE_AGGREGATOR',
];
var envStatus = {};
for (var i = 0; i < envKeys.length; i++) {
  var key = envKeys[i];
  envStatus[key] = process.env[key]
    ? '✓ (' + process.env[key].length + ' chars)'
    : '✗ MANQUANT';
}

// Contenu dist/
var distContents = [];
try {
  var distDir = path.join(__dirname, 'artifacts', 'api-server', 'dist');
  if (fs.existsSync(distDir)) {
    distContents = fs.readdirSync(distDir);
  }
} catch (e) { distContents = ['(erreur lecture: ' + e.message + ')']; }

// ── Logs initaux ──────────────────────────────────────────────────────────
writeLog('[start.cjs] Node.js ' + process.version + ' — démarrage');
writeLog('[start.cjs] __dirname = ' + __dirname);
writeLog('[start.cjs] PORT = ' + diag.port);
writeLog('[start.cjs] NODE_ENV = ' + diag.nodeEnv);

// ── Serveur de diagnostic (affiché si le bundle plante) ─────────────────
function startDiagServer(crashError) {
  var port = parseInt(process.env.PORT || '8080', 10);

  function renderHtml(extraError) {
    var rows = function(obj) {
      return Object.keys(obj).map(function(k) {
        var v = String(obj[k]);
        var ok = v.indexOf('✓') === 0;
        var bad = v.indexOf('✗') === 0;
        var color = ok ? '#22c55e' : bad ? '#ef4444' : '#94a3b8';
        return '<tr><td style="padding:4px 12px 4px 0;color:#94a3b8">' + k + '</td>'
          + '<td style="color:' + color + ';font-family:monospace">' + v + '</td></tr>';
      }).join('');
    };

    return '<!DOCTYPE html><html><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>DrimPay — Diagnostic démarrage</title>'
      + '<style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#e2e8f0;padding:24px;max-width:800px;margin:0 auto}'
      + 'h1{color:#ef4444;margin-bottom:4px}h2{color:#c5ff4a;font-size:14px;margin:24px 0 8px}'
      + 'pre{background:#1e1e1e;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;color:#fca5a5;white-space:pre-wrap;word-break:break-all}'
      + 'table{width:100%;border-collapse:collapse}p{color:#94a3b8;font-size:14px}'
      + '.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:#1e1e1e}'
      + '</style></head><body>'
      + '<h1>⚠️ DrimPay — Erreur de démarrage</h1>'
      + '<p>Le serveur n\'a pas pu démarrer. Voici les détails pour diagnostiquer.</p>'

      + '<h2>ERREUR PRINCIPALE</h2>'
      + '<pre>' + (extraError || 'Aucune erreur capturée').replace(/</g,'&lt;') + '</pre>'

      + '<h2>SERVEUR</h2>'
      + '<table>' + rows(diag) + '</table>'

      + '<h2>FICHIERS CLÉS</h2>'
      + '<table>' + rows(fileStatus) + '</table>'

      + '<h2>CONTENU dist/</h2>'
      + '<pre>' + (distContents.length ? distContents.join('\n') : '(dossier vide ou absent)') + '</pre>'

      + '<h2>VARIABLES D\'ENVIRONNEMENT</h2>'
      + '<table>' + rows(envStatus) + '</table>'

      + '<h2>ERREURS COLLECTÉES</h2>'
      + '<pre>' + (errors.length ? errors.join('\n').replace(/</g,'&lt;') : '(aucune)') + '</pre>'

      + '<p style="margin-top:32px;font-size:12px;color:#475569">Généré le ' + new Date().toISOString() + '</p>'
      + '</body></html>';
  }

  var diagServer = http.createServer(function(req, res) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHtml(crashError));
  });

  diagServer.listen(port, '0.0.0.0', function() {
    writeLog('[start.cjs] Serveur de diagnostic démarré sur port ' + port);
  });
}

// ── Chargement du bundle principal ────────────────────────────────────────
if (!fs.existsSync(bundlePath)) {
  addError('[start.cjs] ERREUR FATALE: Bundle introuvable: ' + bundlePath);
  startDiagServer('Bundle introuvable: ' + bundlePath + '\n\nContenu dist/:\n' + distContents.join('\n'));
} else {
  writeLog('[start.cjs] Bundle trouvé — chargement via import()...');
  var bundleUrl = url.pathToFileURL(bundlePath).href;

  import(bundleUrl).then(function() {
    writeLog('[start.cjs] Bundle chargé avec succès');
  }).catch(function(err) {
    var msg = err && err.stack ? err.stack : String(err);
    addError('[start.cjs] ERREUR au chargement du bundle:\n' + msg);
    startDiagServer(msg);
  });
}
