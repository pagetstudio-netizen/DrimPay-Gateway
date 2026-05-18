import { useState } from "react";
import {
  ArrowUpRight, Copy, CheckCircle2, AlertTriangle,
  Send, SearchCheck, Webhook, Activity, UserCheck,
  Lock, ShieldCheck, RefreshCw, Calculator, Globe, Shield
} from "lucide-react";
import apiIconImg from "@assets/6213702_1778508885407.png";
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

function Param({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-0">
      <div className="w-40 shrink-0"><code className="text-sm font-mono text-primary">{name}</code>{required && <span className="ml-1 text-[10px] text-red-500 font-semibold">*</span>}</div>
      <div className="w-20 shrink-0 text-xs text-muted-foreground font-mono">{type}</div>
      <div className="flex-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-blue-500 shrink-0" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DocPayout() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img src={apiIconImg} alt="" className="w-12 h-12 object-contain shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">API Pay-out</h1>
              <p className="text-muted-foreground text-sm">Transferts Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Frais Entreprise : 3%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">v2.0</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-4">
          <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Compte Entreprise uniquement</p>
            <p className="text-xs text-muted-foreground mt-1">
              L'API Pay-out est <strong className="text-foreground">exclusivement réservée aux comptes Entreprise</strong> vérifiés (KYB approuvé).
              Les comptes personnels ne peuvent pas utiliser cette API. Pour retirer des fonds depuis un compte personnel,
              utilisez la fonctionnalité <strong className="text-foreground">Reversement</strong> depuis votre dashboard (frais : 5%).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-8">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Règle géographique des wallets</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les pay-outs sont déboursés depuis le wallet du pays cible. Les fonds reçus au Togo ne peuvent être retirés que via le wallet Togo.
              Assurez-vous d'avoir un solde suffisant dans le wallet du pays avant d'initier un pay-out.
            </p>
          </div>
        </div>

        <Section title="Introduction" icon={Globe}>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            L'API Pay-out DrimPay vous permet d'envoyer des fonds vers un numéro Mobile Money dans 7 pays d'Afrique de l'Ouest et Centrale.
            Les frais de <strong className="text-foreground">3%</strong> sont débités du wallet du pays cible à chaque transaction réussie.
          </p>
          <div className="rounded-xl border border-border bg-card overflow-hidden font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-muted-foreground">Live :</span>
              <span className="text-primary">https://drimpay.com/api/v2</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground">Sandbox :</span>
              <span className="text-yellow-500">https://drimpay.com/sandbox-api/v2</span>
            </div>
          </div>
        </Section>

        <Section title="Initier un Pay-out" icon={Send}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/initiate</code>
          </div>

          <h3 className="text-sm font-semibold mb-3">Paramètres</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="amount" type="number" required desc="Montant à transférer au bénéficiaire" />
            <Param name="currency" type="string" required desc="Devise ISO 4217 (XOF, XAF)" />
            <Param name="country_code" type="string" required desc="Code pays du bénéficiaire (TG, BJ, CM, BF, ML, SN, CI)" />
            <Param name="operator" type="string" required desc="Opérateur Mobile Money du bénéficiaire" />
            <Param name="phone" type="string" required desc="Numéro Mobile Money du bénéficiaire au format international" />
            <Param name="description" type="string" desc="Motif du transfert" />
            <Param name="external_ref" type="string" desc="Référence dans votre système" />
            <Param name="webhook_url" type="string" desc="URL de callback pour les notifications" />
          </div>

          <CodeBlock lang="curl" code={`curl -X POST https://drimpay.com/api/v2/payout/initiate \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "currency": "XOF",
    "country_code": "TG",
    "operator": "TMoney",
    "phone": "+22890123456",
    "description": "Paiement fournisseur",
    "external_ref": "supplier_pmt_456",
    "webhook_url": "https://votre-site.com/webhook/drimpay"
  }'`} />

          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse (201 Created)</h3>
          <CodeBlock code={`{
  "id": "out_8g4l3n0o",
  "reference": "OUT-1715000000-E5F6G7H8",
  "status": "processing",
  "type": "payout",
  "amount": 25000,
  "fee": 750,
  "total_debit": 25750,
  "fee_rate": "3%",
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "description": "Paiement fournisseur",
  "wallet_debited": true,
  "wallet_id": "wal_tg_001",
  "wallet_balance_after": 224250,
  "created_at": "2024-05-07T11:00:00Z",
  "estimated_completion": "2024-05-07T11:05:00Z"
}`} />
        </Section>

        <Section title="Vérifier le statut" icon={SearchCheck}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/{"{reference}"}</code>
          </div>
          <CodeBlock lang="curl" code={`curl "https://drimpay.com/api/v2/payout/OUT-1715000000-E5F6G7H8" \\
  -H "Authorization: Bearer dp_live_xxxx"`} />
        </Section>

        <Section title="Webhook & Signature" icon={Webhook}>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-4">
            <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-500 mb-1">Signature obligatoire</p>
              <p className="text-xs text-muted-foreground">Chaque webhook inclut un header <code className="font-mono text-primary">X-DrimPay-Signature: sha256=HASH</code>. Vérifiez toujours cette signature avant de traiter l'événement.</p>
            </div>
          </div>
          <CodeBlock lang="bash" code={`X-DrimPay-Signature: sha256=a3f9e1c2b4d5...`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Payload du webhook</h3>
          <CodeBlock code={`{
  "event": "payout.success",
  "reference": "OUT-1715000000-E5F6G7H8",
  "status": "success",
  "amount": 25000,
  "fee": 750,
  "total_debit": 25750,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "external_ref": "supplier_pmt_456",
  "timestamp": "2024-05-07T11:04:12Z"
}`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Vérification (Node.js)</h3>
          <CodeBlock lang="javascript" code={`const crypto = require("crypto");

app.post("/webhook/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-drimpay-signature"]; // "sha256=<hex>"

  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(req.body) // Buffer brut
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);
  // Gérer les statuts : queued | processing | success | failed | reversed | cancelled
  res.status(200).send("OK");
});`} />
        </Section>

        <Section title="Statuts de transaction" icon={Activity}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[
              { status: "queued", color: "text-purple-600 bg-purple-500/10", desc: "Requête acceptée, en attente dans la file" },
              { status: "pending", color: "text-yellow-600 bg-yellow-500/10", desc: "En attente chez l'opérateur" },
              { status: "processing", color: "text-blue-600 bg-blue-500/10", desc: "Traitement en cours chez l'opérateur" },
              { status: "success", color: "text-green-600 bg-green-500/10", desc: "Validé — bénéficiaire crédité" },
              { status: "failed", color: "text-red-600 bg-red-500/10", desc: "Échec de la transaction" },
              { status: "reversed", color: "text-red-600 bg-red-500/10", desc: "Remboursé — fonds retournés au wallet" },
              { status: "cancelled", color: "text-red-600 bg-red-500/10", desc: "Annulé avant traitement" },
            ].map((s) => (
              <div key={s.status} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold font-mono ${s.color}`}>{s.status}</span>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="KYB Obligatoire" icon={UserCheck}>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Vérification KYB requise</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les pay-outs en production sont bloqués tant que votre KYB n'est pas approuvé. Soumettez vos documents dans les paramètres de votre compte.
              </p>
            </div>
          </div>
          <CodeBlock code={`// Réponse si KYB non approuvé
{
  "error": "KYB_REQUIRED",
  "message": "Votre compte doit compléter la vérification KYB avant d'effectuer des pay-outs en production"
}`} />
        </Section>

        <Section title="Protection du wallet (anti double dépense)" icon={Lock}>
          <p className="text-sm text-muted-foreground mb-4">
            DrimPay utilise un verrou au niveau de la base de données pour chaque débit de wallet. Les requêtes simultanées sont sérialisées — votre solde ne peut jamais passer en négatif. Utilisez toujours un <code className="font-mono text-primary">order_id</code> unique pour éviter les doublons.
          </p>
          <CodeBlock lang="sql" code={`-- Logique interne DrimPay (simplifiée)
BEGIN;

SELECT balance FROM wallets
  WHERE id = :wallet_id
  FOR UPDATE; -- verrou ligne, bloque les débits concurrents

UPDATE wallets
  SET balance = balance - :total_debit
  WHERE id = :wallet_id;

COMMIT;`} />
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
        </Section>

        <Section title="Retry automatique" icon={RefreshCw}>
          <p className="text-sm text-muted-foreground mb-4">
            En cas d'échec réseau, réessayez avec le même <code className="font-mono text-primary">order_id</code>. L'API est idempotente et ne débitera jamais deux fois le même paiement.
          </p>
          <CodeBlock lang="javascript" code={`async function payoutAvecRetry(payload, tentatives = 0) {
  if (tentatives >= 3) throw new Error("Nombre max de tentatives atteint");

  try {
    const res = await fetch("https://drimpay.com/api/v2/payout/send", {
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
    return payoutAvecRetry(payload, tentatives + 1);
  }
}`} />
        </Section>

        <Section title="Calcul des frais" icon={Calculator}>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-4">
              Les frais de <strong className="text-foreground">3% (Compte Entreprise)</strong> sont calculés sur le montant brut et déduits de votre wallet.
              Les comptes personnels ne peuvent pas accéder à l'API Pay-out — ils utilisent le Reversement dashboard (5%).
            </p>
            <CodeBlock code={`// Exemple : pay-out de 25 000 XOF (compte entreprise)
amount       = 25 000 XOF
fee (3%)     =    750 XOF
total_debit  = 25 750 XOF  // Montant prélevé sur votre wallet
beneficiary  = 25 000 XOF  // Montant reçu par le bénéficiaire`} lang="text" />
          </div>
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
              { flag: "🇹🇬", name: "Togo",          code: "TG", currency: "XOF", operators: ["TMoney", "Moov Money"],                      note: "Mobile Money principal" },
              { flag: "🇧🇯", name: "Bénin",         code: "BJ", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"],            note: "Forte adoption mobile" },
              { flag: "🇨🇲", name: "Cameroun",      code: "CM", currency: "XAF", operators: ["MTN MoMo", "Orange Money"],                  note: "Pays siège DrimPay" },
              { flag: "🇧🇫", name: "Burkina Faso",  code: "BF", currency: "XOF", operators: ["Orange Money", "Moov Money"],                note: "Paiement mobile dominant" },
              { flag: "🇲🇱", name: "Mali",          code: "ML", currency: "XOF", operators: ["Orange Money", "Moov Money"],                note: "Zone UEMOA" },
              { flag: "🇸🇳", name: "Sénégal",       code: "SN", currency: "XOF", operators: ["Orange Money", "Wave"],                      note: "Forte utilisation fintech" },
              { flag: "🇨🇮", name: "Côte d'Ivoire", code: "CI", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"], note: "Marché très actif" },
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
