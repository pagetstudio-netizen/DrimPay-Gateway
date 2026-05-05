import { useState } from "react";
import { Radio, Copy, CheckCircle2, Phone, MessageSquare, Wifi } from "lucide-react";
import { DashboardLayout } from "../layout";

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
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

export default function DocCredits() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Crédits de Communication</h1>
              <p className="text-muted-foreground text-sm">Distribution de crédit téléphonique, data et SMS en masse</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 font-semibold">7 pays · 15+ opérateurs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Phone, title: "Crédit voix", desc: "Transfert de crédit téléphonique à n'importe quel numéro" },
            { icon: Wifi, title: "Forfaits data", desc: "Activation de forfaits internet mobile (1Go, 5Go, illimité…)" },
            { icon: MessageSquare, title: "SMS bulk", desc: "Envoi de SMS promotionnels ou transactionnels en masse" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-cyan-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Distribuer des crédits</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/credits/distribute</code>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="type" type="string" required desc="Type de crédit : voice | data | sms" />
            <Param name="operator" type="string" required desc="Opérateur cible (TMoney, MTN, Orange, Moov...)" />
            <Param name="country_code" type="string" required desc="Code pays ISO 3166-1 alpha-2" />
            <Param name="phone" type="string" required desc="Numéro du bénéficiaire au format international" />
            <Param name="amount" type="number" required desc="Montant du crédit voix, ou identifiant du forfait data" />
            <Param name="currency" type="string" required desc="Devise (XOF, XAF)" />
            <Param name="message" type="string" desc="Message personnalisé accompagnant le crédit (SMS uniquement)" />
            <Param name="external_ref" type="string" desc="Référence dans votre système" />
          </div>
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/credits/distribute \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "voice",
    "operator": "TMoney",
    "country_code": "TG",
    "phone": "+22890123456",
    "amount": 500,
    "currency": "XOF",
    "external_ref": "topup_789"
  }'`} />
          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse (201 Created)</h3>
          <CodeBlock code={`{
  "id": "crd_a1b2c3d4",
  "status": "success",
  "type": "voice",
  "operator": "TMoney",
  "country_code": "TG",
  "phone": "+22890123456",
  "amount": 500,
  "currency": "XOF",
  "cost": 510,
  "external_ref": "topup_789",
  "delivered_at": "2024-05-07T13:00:02Z"
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Distribution en masse</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/credits/bulk</code>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Envoyez jusqu'à 10 000 distributions en une seule requête.</p>
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/credits/bulk \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "voice",
    "country_code": "TG",
    "currency": "XOF",
    "description": "Campagne promo Mai 2024",
    "recipients": [
      { "operator": "TMoney", "phone": "+22890000001", "amount": 500 },
      { "operator": "Moov Togo", "phone": "+22890000002", "amount": 1000 },
      { "operator": "TMoney", "phone": "+22890000003", "amount": 500 }
    ]
  }'`} />
          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse</h3>
          <CodeBlock code={`{
  "job_id": "bulk_z9y8x7w6",
  "status": "processing",
  "total_recipients": 3,
  "total_amount": 2000,
  "currency": "XOF",
  "estimated_completion": "2024-05-07T13:05:00Z",
  "webhook_url": null
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Forfaits data disponibles</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <div className="grid grid-cols-4 text-xs font-semibold text-muted-foreground">
                <span>ID forfait</span><span>Volume</span><span>Validité</span><span>Prix</span>
              </div>
            </div>
            {[
              { id: "data_100mb_1d", volume: "100 Mo", validity: "1 jour", price: "100 XOF" },
              { id: "data_1gb_7d", volume: "1 Go", validity: "7 jours", price: "500 XOF" },
              { id: "data_5gb_30d", volume: "5 Go", validity: "30 jours", price: "2 000 XOF" },
              { id: "data_unlimited_7d", volume: "Illimité", validity: "7 jours", price: "1 500 XOF" },
            ].map((p) => (
              <div key={p.id} className="px-5 py-3 border-b border-border last:border-0">
                <div className="grid grid-cols-4 text-sm">
                  <code className="font-mono text-xs text-primary">{p.id}</code>
                  <span>{p.volume}</span>
                  <span className="text-muted-foreground">{p.validity}</span>
                  <span className="font-semibold">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Les forfaits varient selon l'opérateur. Utilisez GET /credits/plans?operator=TMoney&country_code=TG pour la liste complète.</p>
        </section>
      </div>
    </DashboardLayout>
  );
}
