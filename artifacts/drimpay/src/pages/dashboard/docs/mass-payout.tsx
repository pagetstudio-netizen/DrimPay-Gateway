import { useState } from "react";
import { Users, Copy, CheckCircle2, Upload, Download, AlertTriangle } from "lucide-react";
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

export default function DocMassPayout() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Paiement de Masse</h1>
              <p className="text-muted-foreground text-sm">Versez à des milliers de bénéficiaires en une seule requête</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 font-semibold">Jusqu'à 50 000 bénéficiaires</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Frais : 3% par transaction</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-8">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Wallet géolocalisé</p>
            <p className="text-xs text-muted-foreground mt-1">
              Chaque bénéficiaire doit être dans un pays où vous avez un wallet avec un solde suffisant.
              Les paiements multi-pays débitent chaque wallet correspondant séparément.
            </p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Créer un job de paiement de masse</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/mass-payout/jobs</code>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="description" type="string" desc="Libellé du job (ex: Salaires Mai 2024)" />
            <Param name="schedule_at" type="datetime" desc="Heure d'exécution planifiée (ISO 8601, optionnel = immédiat)" />
            <Param name="webhook_url" type="string" desc="URL de callback pour les notifications d'avancement" />
            <Param name="recipients" type="array" required desc="Tableau des bénéficiaires (voir structure ci-dessous)" />
          </div>

          <h3 className="text-sm font-semibold mb-3">Structure d'un bénéficiaire</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="phone" type="string" required desc="Numéro Mobile Money au format international" />
            <Param name="operator" type="string" required desc="Opérateur Mobile Money" />
            <Param name="country_code" type="string" required desc="Code pays ISO 3166-1 alpha-2" />
            <Param name="amount" type="number" required desc="Montant à envoyer dans la devise du pays" />
            <Param name="currency" type="string" required desc="Devise locale (XOF, XAF)" />
            <Param name="name" type="string" desc="Nom du bénéficiaire (pour les rapports)" />
            <Param name="external_ref" type="string" desc="Référence dans votre système (numéro employé, etc.)" />
          </div>

          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/mass-payout/jobs \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Salaires Mai 2024",
    "webhook_url": "https://mon-site.com/webhook/drimpay",
    "recipients": [
      {
        "name": "Kofi Mensah",
        "phone": "+22890000001",
        "operator": "TMoney",
        "country_code": "TG",
        "amount": 150000,
        "currency": "XOF",
        "external_ref": "emp_001"
      },
      {
        "name": "Ama Boateng",
        "phone": "+22997000002",
        "operator": "MTN Bénin",
        "country_code": "BJ",
        "amount": 120000,
        "currency": "XOF",
        "external_ref": "emp_002"
      }
    ]
  }'`} />

          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse (202 Accepted)</h3>
          <CodeBlock code={`{
  "job_id": "mpay_j1k2l3m4",
  "reference": "MASS-1715000000-X1Y2Z3",
  "status": "queued",
  "description": "Salaires Mai 2024",
  "total_recipients": 2,
  "total_amount": 270000,
  "estimated_fee": 8100,
  "estimated_total_debit": 278100,
  "currencies": ["XOF"],
  "estimated_completion": "2024-05-07T14:10:00Z",
  "created_at": "2024-05-07T14:00:00Z"
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Suivre un job</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/mass-payout/jobs/{"{job_id}"}</code>
          </div>
          <CodeBlock lang="curl" code={`curl "https://api.drimpay.africa/v2/mass-payout/jobs/mpay_j1k2l3m4" \\
  -H "Authorization: Bearer dp_live_xxxx"`} />
          <h3 className="text-sm font-semibold mt-6 mb-3">Réponse</h3>
          <CodeBlock code={`{
  "job_id": "mpay_j1k2l3m4",
  "status": "completed",
  "total_recipients": 2,
  "success_count": 2,
  "failed_count": 0,
  "pending_count": 0,
  "total_amount": 270000,
  "total_fee": 8100,
  "total_debit": 278100,
  "currency": "XOF",
  "started_at": "2024-05-07T14:00:05Z",
  "completed_at": "2024-05-07T14:02:18Z"
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Import CSV</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Importez vos bénéficiaires via un fichier CSV pour les grands volumes.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/mass-payout/jobs/csv</code>
          </div>
          <CodeBlock lang="text" code={`# Format CSV attendu
name,phone,operator,country_code,amount,currency,external_ref
Kofi Mensah,+22890000001,TMoney,TG,150000,XOF,emp_001
Ama Boateng,+22997000002,MTN Bénin,BJ,120000,XOF,emp_002
Jean Togo,+22891000003,Moov Togo,TG,80000,XOF,emp_003`} />
          <CodeBlock lang="curl" code={`curl -X POST https://api.drimpay.africa/v2/mass-payout/jobs/csv \\
  -H "Authorization: Bearer dp_live_xxxx" \\
  -F "file=@salaires_mai.csv" \\
  -F "description=Salaires Mai 2024" \\
  -F "webhook_url=https://mon-site.com/webhook/drimpay"`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Webhook de progression</h2>
          <CodeBlock code={`// Événement de progression
{
  "event": "mass_payout.progress",
  "job_id": "mpay_j1k2l3m4",
  "status": "processing",
  "processed": 500,
  "total": 1000,
  "success_count": 490,
  "failed_count": 10,
  "timestamp": "2024-05-07T14:05:00Z"
}

// Événement de complétion
{
  "event": "mass_payout.completed",
  "job_id": "mpay_j1k2l3m4",
  "status": "completed",
  "total_recipients": 1000,
  "success_count": 985,
  "failed_count": 15,
  "total_amount": 50000000,
  "total_fee": 1500000,
  "completed_at": "2024-05-07T14:08:30Z"
}`} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">Autres endpoints</h2>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/mass-payout/jobs", desc: "Lister tous les jobs de paiement" },
              { method: "GET", path: "/mass-payout/jobs/{job_id}/recipients", desc: "Détails de chaque bénéficiaire" },
              { method: "GET", path: "/mass-payout/jobs/{job_id}/report", desc: "Télécharger le rapport CSV du job" },
              { method: "POST", path: "/mass-payout/jobs/{job_id}/cancel", desc: "Annuler un job en attente" },
            ].map((e) => (
              <div key={e.path} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <span className={`text-[10px] px-2 py-1 rounded font-bold font-mono ${e.method === "GET" ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"}`}>{e.method}</span>
                <code className="text-sm font-mono text-muted-foreground flex-1">{e.path}</code>
                <span className="text-sm text-muted-foreground hidden md:block">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
