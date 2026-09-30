import { useState, useEffect } from "react";

function useFeeRate() {
  const [rate, setRate] = useState<{ payout: number; payout_display: string } | null>(null);
  useEffect(() => {
    fetch("/api/dashboard/fee-rate", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.payout != null) setRate({ payout: d.payout, payout_display: d.payout_display }); })
      .catch(() => {});
  }, []);
  return rate;
}
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
  const feeRate = useFeeRate();
  const feeRateLabel = feeRate?.payout_display ?? "Chargement...";
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
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Frais Pay-out : {feeRateLabel}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">v2.0</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-4">
          <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">KYB requis pour le mode Live</p>
            <p className="text-xs text-muted-foreground mt-1">
              Une clé API Live ne peut initier un pay-out que si votre KYB est approuvé. Le Sandbox ne nécessite pas de KYB,
              mais exige un wallet Sandbox actif et suffisamment approvisionné.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-8">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Règle géographique des wallets</p>
            <p className="text-xs text-muted-foreground mt-1">
              Le wallet débité correspond au pays de destination et au mode de la clé API (Sandbox ou Live).
              Les fonds reçus au Togo ne peuvent être payés qu'à partir du wallet Togo du même mode.
              Le solde doit couvrir le montant demandé plus les frais.
            </p>
          </div>
        </div>

        <Section title="Introduction" icon={Globe}>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            L'API Pay-out DrimPay vous permet d'envoyer des fonds vers un numéro Mobile Money dans 7 pays d'Afrique de l'Ouest et Centrale.
            Le bénéficiaire reçoit le montant demandé. Les frais dépendent du pays et de l'opérateur ; ils sont ajoutés au débit du wallet correspondant au pays cible et au mode de la clé API.
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
          <p className="text-xs text-muted-foreground mt-3">
            Utilisez une clé <code className="font-mono text-primary">dp_sandbox_sk_</code> avec Sandbox, ou
            une clé <code className="font-mono text-primary">dp_live_sk_</code> avec Live. Ne partagez jamais une clé secrète dans le navigateur.
          </p>
        </Section>

        <Section title="Initier un Pay-out" icon={Send}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 font-bold font-mono">POST</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/initiate</code>
          </div>

          <h3 className="text-sm font-semibold mb-3">Paramètres</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
            <Param name="amount" type="number" required desc="Montant reçu par le bénéficiaire; minimum 200 (les frais sont ajoutés au débit du wallet)" />
            <Param name="currency" type="string" required desc="Devise ISO 4217 (XOF, XAF)" />
            <Param name="country_code" type="string" required desc="Code pays du bénéficiaire (TG, BJ, CM, BF, ML, SN, CI)" />
            <Param name="operator" type="string" required desc="Opérateur Mobile Money configuré pour le pays cible" />
            <Param name="phone" type="string" required desc="Numéro local ou international correspondant au pays cible" />
            <Param name="external_ref" type="string" desc="Référence unique (max. 128 caractères); obligatoire si order_id est absent" />
            <Param name="order_id" type="string" desc="Alias de external_ref; si les deux sont fournis, ils doivent être identiques" />
            <Param name="description" type="string" desc="Motif du transfert (max. 255 caractères)" />
            <Param name="webhook_url" type="string" desc="URL HTTPS facultative pour les notifications" />
            <Param name="operator_otp" type="string" desc="OTP opérateur facultatif si demandé" />
            <Param name="metadata" type="object" desc="Données personnalisées clé-valeur renvoyées dans la réponse et le webhook" />
          </div>

          <CodeBlock lang="curl" code={`curl -X POST https://drimpay.com/api/v2/payout/initiate \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx" \\
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
  "id": 12345,
  "reference": "OUT-1778058000000-A1B2C3D4",
  "external_ref": "supplier_pmt_456",
  "order_id": "supplier_pmt_456",
  "status": "processing",
  "type": "payout",
  "amount": 25000,
  "fee": 750,
  "total_debit": 25750,
  "net_amount": 25000,
  "fee_rate": "3%",
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "mode": "live",
  "gateway_reference": "provider-reference",
  "failure_reason": null,
  "webhook_url": "https://votre-site.com/webhook/drimpay",
  "metadata": {},
  "created_at": "2026-05-07T11:00:00.000Z",
  "updated_at": "2026-05-07T11:00:01.000Z",
  "idempotent": false,
  "message": "Payout accepted and processing. Check the status endpoint for updates; webhook delivery depends on provider notifications."
}`} />
          <p className="text-xs text-muted-foreground mt-3">Exemple indicatif : le montant des frais et le taux renvoyé dépendent de la règle effective pour le pays et l'opérateur.</p>
          <p className="text-xs text-muted-foreground mt-3">
            Une création renvoie HTTP 201. Une nouvelle soumission idempotente renvoie HTTP 200 avec la transaction existante.
            Le Sandbox renvoie immédiatement <code className="font-mono text-primary">success</code>; une initiation Live acceptée renvoie <code className="font-mono text-primary">processing</code>.
          </p>
        </Section>

        <Section title="Vérifier le statut" icon={SearchCheck}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/{"{reference}"}</code>
          </div>
          <CodeBlock lang="curl" code={`curl "https://drimpay.com/api/v2/payout/OUT-1715000000-E5F6G7H8" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
          <p className="text-xs text-muted-foreground mt-3">La référence DrimPay ou votre <code className="font-mono text-primary">external_ref</code> peut être utilisée. Le mode de la clé doit correspondre au mode de la transaction.</p>
          <p className="text-xs text-muted-foreground mt-2">La réponse est l'objet pay-out présenté dans l'exemple d'initiation.</p>
        </Section>

        <Section title="Lister les pay-outs" icon={SearchCheck}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 font-bold font-mono">GET</span>
            <code className="text-sm font-mono text-muted-foreground">/payout/transactions</code>
          </div>
          <p className="text-sm text-muted-foreground mb-3">La liste est paginée. Filtres facultatifs : <code className="font-mono text-primary">page</code>, <code className="font-mono text-primary">limit</code> (1 à 100), <code className="font-mono text-primary">country_code</code> et <code className="font-mono text-primary">status</code>.</p>
          <CodeBlock lang="curl" code={`curl "https://drimpay.com/api/v2/payout/transactions?page=1&limit=20&country_code=TG&status=processing" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
          <CodeBlock code={`{
  "data": [{ "reference": "OUT-1778058000000-A1B2C3D4", "status": "processing" }],
  "meta": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
}`} />
        </Section>

        <Section title="Webhook & Signature" icon={Webhook}>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-4">
            <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-500 mb-1">Signature obligatoire</p>
              <p className="text-xs text-muted-foreground">La signature HMAC-SHA256 est calculée sur <code className="font-mono text-primary">timestamp.corps_JSON_brut</code> avec le secret webhook associé à la clé API. Vérifiez-la avant de traiter l'événement.</p>
            </div>
          </div>
          <CodeBlock lang="bash" code={`X-DrimPay-Signature: t=1715000000,v1=<64 caractères hexadécimaux>
X-DrimPay-Timestamp: 1715000000
X-DrimPay-Event: payout.success`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Payload du webhook</h3>
          <CodeBlock code={`{
  "event": "payout.success",
  "reference": "OUT-1778058000000-A1B2C3D4",
  "external_ref": "supplier_pmt_456",
  "order_id": "supplier_pmt_456",
  "status": "success",
  "amount": 25000,
  "fee": 750,
  "net_amount": 25000,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "TMoney",
  "phone": "+22890123456",
  "mode": "live",
  "gateway_reference": "provider-reference",
  "failure_reason": null,
  "metadata": {},
  "created_at": "2026-05-07T11:00:00.000Z",
  "updated_at": "2026-05-07T11:04:12.000Z"
}`} />
          <h3 className="text-sm font-semibold mt-5 mb-3">Vérification (Node.js)</h3>
          <CodeBlock lang="javascript" code={`const crypto = require("crypto");

app.post("/webhook/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const header = String(req.headers["x-drimpay-signature"] || "");
  const [tPart, v1Part] = header.split(",");
  const timestamp = tPart?.startsWith("t=") ? tPart.slice(2) : "";
  const signature = v1Part?.startsWith("v1=") ? v1Part.slice(3) : "";
  if (!/^\\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return res.status(400).send("Invalid or expired signature");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(timestamp + "." + req.body.toString("utf8")) // corps brut exact
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");

  if (!crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString("utf8"));
  // Traiter l'événement puis répondre en 2xx.
  res.status(200).send("OK");
});`} />
          <p className="text-xs text-muted-foreground mt-3">Configurez le parseur de corps brut avant tout parseur JSON global sur cette route. En Live, le polling interne ne déclenche pas à lui seul le webhook marchand ; le callback dépend de la notification du fournisseur. Les tentatives de livraison peuvent varier selon le fournisseur; certains callbacks de fournisseur ajoutent leur propre champ de référence.</p>

          <h3 className="text-sm font-semibold mt-5 mb-3">Renvoyer le webhook</h3>
          <p className="text-sm text-muted-foreground mb-3">Le renvoi utilise le webhook URL et le secret enregistrés sur le pay-out. La référence DrimPay ou la référence externe peut être utilisée.</p>
          <CodeBlock lang="curl" code={`curl -X POST https://drimpay.com/api/v2/payout/OUT-1778058000000-A1B2C3D4/resend-webhook \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
        </Section>

        <Section title="Statuts de transaction" icon={Activity}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[
              { status: "queued", color: "text-purple-600 bg-purple-500/10", desc: "Requête acceptée, en attente dans la file" },
              { status: "pending", color: "text-yellow-600 bg-yellow-500/10", desc: "En attente chez l'opérateur" },
              { status: "processing", color: "text-blue-600 bg-blue-500/10", desc: "Traitement en cours chez l'opérateur" },
              { status: "success", color: "text-green-600 bg-green-500/10", desc: "Validé — bénéficiaire crédité" },
              { status: "failed", color: "text-red-600 bg-red-500/10", desc: "Échec de la transaction" },
              { status: "cancelled", color: "text-red-600 bg-red-500/10", desc: "Annulé avant traitement" },
              { status: "expired", color: "text-red-600 bg-red-500/10", desc: "La demande a expiré" },
              { status: "reversed", color: "text-red-600 bg-red-500/10", desc: "Opération inversée, si ce statut est signalé par le fournisseur" },
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
                Les pay-outs Live sont bloqués tant que votre KYB n'est pas approuvé. Soumettez vos documents dans la section KYB du dashboard.
              </p>
            </div>
          </div>
          <CodeBlock code={`// Réponse Live si KYB non approuvé (HTTP 403)
{
  "error": "KYB_NOT_APPROVED",
  "message": "Your account must complete KYB verification before sending live payouts."
}`} />
        </Section>

        <Section title="Erreurs courantes" icon={AlertTriangle}>
          <p className="text-sm text-muted-foreground mb-4">Toutes les réponses d'erreur de l'API incluent généralement <code className="font-mono text-primary">error</code> et <code className="font-mono text-primary">message</code>. Les erreurs de validation peuvent aussi fournir <code className="font-mono text-primary">details</code>.</p>
          <CodeBlock lang="json" code={`// Solde insuffisant (HTTP 402)
{
  "error": "INSUFFICIENT_FUNDS",
  "message": "Insufficient wallet balance. Required: 25750 XOF, including 750 XOF in fees.",
  "available": 20000,
  "required": 25750
}

// Même external_ref réutilisé avec d'autres détails (HTTP 409)
{
  "error": "IDEMPOTENCY_CONFLICT",
  "message": "This external_ref was already used with different payout details.",
  "reference": "OUT-1778058000000-A1B2C3D4"
}`} />
          <p className="text-sm text-muted-foreground mt-3">Autres codes possibles : <code className="font-mono text-primary">INVALID_REQUEST</code>, <code className="font-mono text-primary">WALLET_NOT_FOUND</code>, <code className="font-mono text-primary">WALLET_INACTIVE</code>, <code className="font-mono text-primary">INVALID_COUNTRY</code>, <code className="font-mono text-primary">INVALID_CURRENCY</code>, <code className="font-mono text-primary">INVALID_PHONE</code>, <code className="font-mono text-primary">RATE_LIMITED</code> et <code className="font-mono text-primary">GATEWAY_ERROR</code>.</p>
        </Section>

        <Section title="Protection du wallet (anti double dépense)" icon={Lock}>
          <p className="text-sm text-muted-foreground mb-4">
            DrimPay réserve le débit dans une transaction de base de données et verrouille le wallet sélectionné. Le wallet est choisi par pays de destination et mode de la clé API. Utilisez la même référence externe pour résoudre une réponse incertaine sans créer un doublon.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { label: "Minimum par transaction", value: "200" },
              { label: "Initiations", value: "10 req / min / IP" },
              { label: "Limite API générale", value: "100 req / min / clé" },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
                <p className="text-lg font-bold text-primary mb-1">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Aucun montant maximum ni plafond journalier fixe n'est défini dans cet endpoint; les plafonds de l'opérateur peuvent s'appliquer. Les limites d'initiation sont calculées par adresse IP, tandis que la limite générale API est appliquée par clé. Le paiement de masse existe dans le dashboard, mais pas comme route publique de l'API.</p>
        </Section>

        <Section title="Retry automatique" icon={RefreshCw}>
          <p className="text-sm text-muted-foreground mb-4">
            Si l'initiation expire côté client et que vous ignorez si le pay-out a été accepté, vérifiez d'abord le statut en utilisant votre <code className="font-mono text-primary">external_ref</code> comme référence. Si aucune transaction n'est trouvée, répétez exactement la même requête avec la même référence et les mêmes détails : l'API renvoie la transaction existante si elle a déjà été créée. Cette répétition ne relance pas un pay-out en échec. Utilisez une nouvelle référence uniquement pour une nouvelle opération.
          </p>
          <CodeBlock lang="bash" code={`# Vérifier d'abord l'opération par sa référence DrimPay :
curl "https://drimpay.com/api/v2/payout/supplier_pmt_456" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"

# Si la réponse initiale est incertaine, répéter le POST original avec
# le même external_ref et exactement les mêmes détails.`} />
        </Section>

        <Section title="Calcul des frais" icon={Calculator}>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-4">
              Les frais de <strong className="text-foreground">{feeRateLabel}</strong> sont calculés sur le montant demandé et payés par le marchand. Le bénéficiaire reçoit exactement le montant demandé ; le wallet est débité de <strong className="text-foreground">montant + frais</strong>.
              Le taux affiché ici est votre taux réel actuel — il peut être personnalisé par l'équipe DrimPay selon votre volume.
            </p>
            <CodeBlock code={`// Exemple : pay-out de 25 000 XOF
amount       = 25 000 XOF
fee (${feeRateLabel.replace(".", ",")})     = ${feeRate === null ? "—" : Math.round(25000 * feeRate.payout / 100).toLocaleString("fr-FR")} XOF
total_debit  = ${feeRate === null ? "—" : (25000 + Math.round(25000 * feeRate.payout / 100)).toLocaleString("fr-FR")} XOF  // Montant prélevé sur votre wallet
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
