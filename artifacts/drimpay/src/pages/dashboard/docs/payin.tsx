import { useState } from "react";
import {
  ArrowDownLeft, Copy, CheckCircle2, ChevronDown, ChevronRight,
  BookOpen, KeyRound, Send, SearchCheck, List, Webhook, Activity,
  ShieldCheck, RefreshCw, Globe, Shield
} from "lucide-react";
import { DashboardLayout } from "../layout";

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl border border-border bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-[10px] font-mono text-white/40 uppercase">{lang}</span>
        <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors text-xs flex items-center gap-1.5">
          {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />Copié</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
        </button>
      </div>
      <pre className="p-4 text-sm text-white/80 overflow-x-auto font-mono leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-green-500 shrink-0" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Param({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-0">
      <div className="w-40 shrink-0">
        <code className="text-sm font-mono text-primary">{name}</code>
        {required && <span className="ml-1 text-[10px] text-red-500 font-semibold">*</span>}
      </div>
      <div className="w-20 shrink-0 text-xs text-muted-foreground font-mono">{type}</div>
      <div className="flex-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

export default function DocPayin() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Pay-in</h1>
              <p className="text-muted-foreground text-sm">Encaissements Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold">Frais : 3%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">v2.0</span>
          </div>
        </div>

        <Section title="Introduction" icon={BookOpen}>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            L'API Pay-in DrimPay vous permet d'initier des collectes de fonds via Mobile Money dans 7 pays d'Afrique de l'Ouest et Centrale.
            Chaque transaction est créditée sur le wallet du pays correspondant.
            Des frais de <strong className="text-foreground">3%</strong> sont prélevés sur chaque transaction réussie.
          </p>
          <div className="rounded-xl border border-border bg-card p-4 font-mono text-sm">
            <span className="text-muted-foreground">Base URL : </span>
            <span className="text-primary">https://api.drimpay.africa/v2</span>
          </div>
        </Section>

        <Section title="Authentification" icon={KeyRound}>
          <p className="text-sm text-muted-foreground mb-4">
            Toutes les requêtes doivent inclure votre clé API dans le header <code className="text-primary font-mono">Authorization</code>.
          </p>
          <CodeBlock lang="http" code={`Authorization: Bearer dp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
        </Section>

        <Section title="Initier un Pay-in" icon={Send}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/payin/initiate</code>
          </div>

          <h3 className="text-sm font-semibold mb-3">Paramètres de la requête</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="amount" type="number" required desc="Montant à collecter dans la devise locale (ex: 5000)" />
            <Param name="currency" type="string" required desc="Devise ISO 4217 (XOF, XAF)" />
            <Param name="country_code" type="string" required desc="Code pays ISO 3166-1 alpha-2 (TG, BJ, CM, BF, ML, SN, CI)" />
            <Param name="operator" type="string" required desc="Opérateur Mobile Money (ex: TMoney, MTN, Orange)" />
            <Param name="phone" type="string" required desc="Numéro Mobile Money du payeur au format international (+228XXXXXXXX)" />
            <Param name="description" type="string" desc="Description de la transaction (max 255 caractères)" />
            <Param name="external_ref" type="string" desc="Référence externe dans votre système (unique)" />
            <Param name="webhook_url" type="string" desc="URL de callback pour les notifications de statut" />
          </div>

          <h3 className="text-sm font-semibold mb-3">Exemple de requête</h3>
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/payin/initiate \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "XOF",
    "country_code": "TG",
    "operator": "TMoney",
    "phone": "+22890123456",
    "description": "Paiement commande #1234",
    "external_ref": "order_1234",
    "webhook_url": "https://votre-site.com/webhook/drimpay"
  }'`} />

          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse (201 Created)</h3>
          <CodeBlock code={`{
  "id": "pay_7f3k2m9n",
  "reference": "PAY-1715000000-A1B2C3D4",
  "status": "pending",
  "type": "payin",
  "amount": 50000,
  "fee": 1500,
  "net_amount": 48500,
  "fee_rate": "3%",
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "description": "Paiement commande #1234",
  "external_ref": "order_1234",
  "wallet_id": "wal_tg_001",
  "created_at": "2024-05-07T10:00:00Z",
  "expires_at": "2024-05-07T10:15:00Z"
}`} />
        </Section>

        <Section title="Vérifier le statut" icon={SearchCheck}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payin/{"{reference}"}</code>
          </div>
          <CodeBlock lang="curl" code={`curl -X GET https://api.drimpay.africa/v2/payin/PAY-1715000000-A1B2C3D4 \\
  -H "Authorization: Bearer dp_live_xxxx"`} />
          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse</h3>
          <CodeBlock code={`{
  "id": "pay_7f3k2m9n",
  "reference": "PAY-1715000000-A1B2C3D4",
  "status": "success",
  "amount": 50000,
  "fee": 1500,
  "net_amount": 48500,
  "currency": "XOF",
  "operator": "TMoney",
  "phone": "+22890123456",
  "wallet_credited": true,
  "wallet_id": "wal_tg_001",
  "completed_at": "2024-05-07T10:02:35Z"
}`} />
        </Section>

        <Section title="Lister les Pay-ins" icon={List}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payin?page=1&limit=20&status=success&country_code=TG</code>
          </div>
          <CodeBlock lang="curl" code={`curl "https://api.drimpay.africa/v2/payin?page=1&limit=20&status=success" \\
  -H "Authorization: Bearer dp_live_xxxx"`} />
        </Section>

        <Section title="Webhooks & Signature" icon={Webhook}>
          <p className="text-sm text-muted-foreground mb-4">
            DrimPay envoie des notifications POST en temps réel à votre <code className="font-mono text-primary">webhook_url</code> lors de chaque changement de statut. Chaque requête inclut un header de signature obligatoire.
          </p>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mb-4">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">Header de signature</p>
              <p className="text-xs text-muted-foreground">Chaque webhook est signé avec votre <code className="font-mono text-primary">webhook_secret</code>. Vérifiez toujours la signature avant de traiter l'événement.</p>
            </div>
          </div>
          <CodeBlock lang="bash" code={`X-DrimPay-Signature: sha256=a3f9e1c2b4d5...`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Payload du webhook</h3>
          <CodeBlock code={`{
  "event": "payin.success",
  "reference": "PAY-1715000000-A1B2C3D4",
  "status": "success",
  "amount": 50000,
  "fee": 1500,
  "net_amount": 48500,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "external_ref": "order_1234",
  "timestamp": "2024-05-07T10:02:35Z"
}`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Vérification de signature (Node.js)</h3>
          <CodeBlock lang="javascript" code={`const crypto = require("crypto");

// Utiliser express.raw() pour conserver le body brut
app.post("/webhook/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-drimpay-signature"]; // "sha256=<hex>"

  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(req.body) // Buffer brut — ne pas parser en JSON avant
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);
  if (event.status === "success") {
    // Valider la commande
  }
  res.status(200).send("OK");
});`} />
        </Section>

        <Section title="Statuts de transaction" icon={Activity}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[
              { status: "queued", color: "text-purple-600 bg-purple-500/10", desc: "Requête acceptée, en attente dans la file" },
              { status: "pending", color: "text-yellow-600 bg-yellow-500/10", desc: "Transaction initiée, en attente de paiement du client" },
              { status: "processing", color: "text-blue-600 bg-blue-500/10", desc: "Paiement reçu, traitement en cours chez l'opérateur" },
              { status: "success", color: "text-green-600 bg-green-500/10", desc: "Transaction complète, wallet crédité" },
              { status: "failed", color: "text-red-600 bg-red-500/10", desc: "Transaction échouée (annulée, expirée, ou refusée)" },
              { status: "reversed", color: "text-red-600 bg-red-500/10", desc: "Remboursement effectué au client" },
              { status: "cancelled", color: "text-red-600 bg-red-500/10", desc: "Transaction annulée avant traitement" },
            ].map((s) => (
              <div key={s.status} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold font-mono ${s.color}`}>{s.status}</span>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Limites & Sécurité" icon={ShieldCheck}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { label: "Max par transaction", value: "1 000 000 FCFA" },
              { label: "Max par jour", value: "10 000 000 FCFA" },
              { label: "Limite de requêtes", value: "100 req / min / clé" },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-lg font-bold text-primary mb-1">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Les requêtes dépassant ces limites reçoivent une réponse <code className="font-mono text-primary">403 LIMIT_EXCEEDED</code>. Contactez le support pour augmenter vos limites.</p>
        </Section>

        <Section title="Retry automatique" icon={RefreshCw}>
          <p className="text-sm text-muted-foreground mb-4">
            En cas d'échec réseau, réessayez avec le même <code className="font-mono text-primary">order_id</code> — l'API est idempotente et ne créera pas de doublon. DrimPay réessaie automatiquement les webhooks jusqu'à 3 fois avec backoff exponentiel.
          </p>
          <CodeBlock lang="javascript" code={`async function initierPayinAvecRetry(payload, tentatives = 0) {
  if (tentatives >= 3) throw new Error("Nombre max de tentatives atteint");

  try {
    const res = await fetch("https://api.drimpay.africa/v2/payin/initiate", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.DRIMPAY_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // même order_id à chaque tentative
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    const delai = 2000 * Math.pow(2, tentatives); // 2s, 4s, 8s
    await new Promise(resolve => setTimeout(resolve, delai));
    return initierPayinAvecRetry(payload, tentatives + 1);
  }
}`} />
        </Section>

        <Section title="Pays et opérateurs supportés" icon={Globe}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-4 gap-0 px-4 py-2.5 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
              <span>Pays</span>
              <span>Code</span>
              <span>Opérateurs supportés</span>
              <span>Remarques</span>
            </div>
            {[
              { flag: "🇹🇬", name: "Togo",          code: "TG", currency: "XOF", operators: ["TMoney", "Moov Money"],                        note: "Mobile Money principal" },
              { flag: "🇧🇯", name: "Bénin",         code: "BJ", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"],              note: "Forte adoption mobile" },
              { flag: "🇨🇲", name: "Cameroun",      code: "CM", currency: "XAF", operators: ["MTN MoMo", "Orange Money"],                    note: "Pays siège DrimPay" },
              { flag: "🇧🇫", name: "Burkina Faso",  code: "BF", currency: "XOF", operators: ["Orange Money", "Moov Money"],                  note: "Paiement mobile dominant" },
              { flag: "🇲🇱", name: "Mali",          code: "ML", currency: "XOF", operators: ["Orange Money", "Moov Money"],                  note: "Zone UEMOA" },
              { flag: "🇸🇳", name: "Sénégal",       code: "SN", currency: "XOF", operators: ["Orange Money", "Wave"],                        note: "Forte utilisation fintech" },
              { flag: "🇨🇮", name: "Côte d'Ivoire", code: "CI", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"],   note: "Marché très actif" },
            ].map((c) => (
              <div key={c.code} className="grid grid-cols-4 gap-0 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary">{c.code}</code>
                  <span className="text-xs text-muted-foreground">{c.currency}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.operators.map(op => (
                    <span key={op} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{op}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
