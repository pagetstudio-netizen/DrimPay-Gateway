import { useState } from "react";
import { ArrowUpRight, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
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

export default function DocPayout() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Pay-out</h1>
              <p className="text-muted-foreground text-sm">Transferts Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Frais : 3%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">v2.0</span>
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

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Initier un Pay-out</h2>
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

          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/payout/initiate \\
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
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Vérifier le statut</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/{"{reference}"}</code>
          </div>
          <CodeBlock lang="curl" code={`curl "https://api.drimpay.africa/v2/payout/OUT-1715000000-E5F6G7H8" \\
  -H "Authorization: Bearer dp_live_xxxx"`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Webhook Pay-out</h2>
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
  "timestamp": "2024-05-07T11:04:12Z",
  "signature": "sha256=xyz789..."
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Calcul des frais</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-4">
              Les frais de <strong className="text-foreground">3%</strong> sont calculés sur le montant brut et déduits de votre wallet.
            </p>
            <CodeBlock code={`// Exemple : pay-out de 25 000 XOF
amount       = 25 000 XOF
fee (3%)     =    750 XOF
total_debit  = 25 750 XOF  // Montant prélevé sur votre wallet
beneficiary  = 25 000 XOF  // Montant reçu par le bénéficiaire`} lang="text" />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
