import { useState } from "react";
import { CreditCard, Copy, CheckCircle2, Zap, Shield, Globe } from "lucide-react";
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
      <div className="w-44 shrink-0"><code className="text-sm font-mono text-primary">{name}</code>{required && <span className="ml-1 text-[10px] text-red-500 font-semibold">*</span>}</div>
      <div className="w-20 shrink-0 text-xs text-muted-foreground font-mono">{type}</div>
      <div className="flex-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

export default function DocVirtualCards() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Cartes Virtuelles</h1>
              <p className="text-muted-foreground text-sm">Emission et gestion de cartes Visa/Mastercard virtuelles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 font-semibold">Visa / Mastercard</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">v2.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Zap, title: "Instantané", desc: "Carte émise en quelques secondes via API" },
            { icon: Shield, title: "Sécurisé", desc: "3D Secure activé, limites de dépenses configurables" },
            { icon: Globe, title: "International", desc: "Utilisable partout dans le monde pour les achats en ligne" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Émettre une carte virtuelle</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/cards/issue</code>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="cardholder_name" type="string" required desc="Nom complet du titulaire de la carte" />
            <Param name="email" type="string" required desc="Email du titulaire (notifications de transactions)" />
            <Param name="currency" type="string" required desc="Devise de la carte (USD, EUR, XOF, XAF)" />
            <Param name="spending_limit" type="number" desc="Limite de dépenses en devise de la carte" />
            <Param name="single_use" type="boolean" desc="true = carte à usage unique (défaut: false)" />
            <Param name="expiry_months" type="integer" desc="Durée de validité en mois (12-60, défaut: 12)" />
            <Param name="metadata" type="object" desc="Données personnalisées attachées à la carte" />
          </div>
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/cards/issue \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cardholder_name": "Jean Dupont",
    "email": "jean@exemple.com",
    "currency": "USD",
    "spending_limit": 500,
    "single_use": false,
    "expiry_months": 12,
    "metadata": {
      "user_id": "usr_123",
      "department": "marketing"
    }
  }'`} />
          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse (201 Created)</h3>
          <CodeBlock code={`{
  "id": "card_9h5m4p1q",
  "status": "active",
  "type": "virtual",
  "network": "visa",
  "cardholder_name": "Jean Dupont",
  "email": "jean@exemple.com",
  "last4": "4242",
  "expiry_month": 5,
  "expiry_year": 2025,
  "cvv": "123",
  "full_number": "4532xxxxxxxx4242",
  "currency": "USD",
  "spending_limit": 500,
  "balance": 500,
  "single_use": false,
  "created_at": "2024-05-07T12:00:00Z"
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Recharger une carte</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/cards/{"{card_id}"}/topup</code>
          </div>
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/cards/card_9h5m4p1q/topup \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100, "currency": "USD"}'`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Autres opérations</h2>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/cards", desc: "Lister toutes les cartes" },
              { method: "GET", path: "/cards/{card_id}", desc: "Détails d'une carte" },
              { method: "GET", path: "/cards/{card_id}/transactions", desc: "Transactions d'une carte" },
              { method: "POST", path: "/cards/{card_id}/freeze", desc: "Geler une carte" },
              { method: "POST", path: "/cards/{card_id}/unfreeze", desc: "Dégeler une carte" },
              { method: "DELETE", path: "/cards/{card_id}", desc: "Désactiver définitivement une carte" },
            ].map((e, i) => (
              <div key={`${e.method}-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <span className={`text-[10px] px-2 py-1 rounded font-bold font-mono ${e.method === "GET" ? "bg-blue-500/10 text-blue-600" : e.method === "DELETE" ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>{e.method}</span>
                <code className="text-sm font-mono text-muted-foreground flex-1">{e.path}</code>
                <span className="text-sm text-muted-foreground">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
