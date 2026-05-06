import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, ChevronRight, Copy, Check, BookOpen, Shield, Globe,
  Zap, Webhook, Code, Terminal, AlertTriangle, CheckCircle2, Clock, XCircle, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "introduction", label: "Introduction", group: "GETTING STARTED" },
  { id: "authentication", label: "Authentication", group: "GETTING STARTED" },
  { id: "environments", label: "Environments", group: "GETTING STARTED" },
  { id: "sandbox", label: "Sandbox / Test Mode", group: "GETTING STARTED" },
  { id: "request", label: "Request Format", group: "API REFERENCE" },
  { id: "response", label: "Response Format", group: "API REFERENCE" },
  { id: "errors", label: "Error Codes", group: "API REFERENCE" },
  { id: "initiate", label: "Initiate a Pay-in", group: "ENDPOINTS" },
  { id: "status", label: "Check Status", group: "ENDPOINTS" },
  { id: "list", label: "List Transactions", group: "ENDPOINTS" },
  { id: "webhooks", label: "Webhooks", group: "WEBHOOKS" },
  { id: "resend", label: "Resend Webhook", group: "WEBHOOKS" },
];

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative rounded-xl border border-border bg-[#0a0a0a] overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/10">
        <span className="text-xs font-mono text-muted-foreground">{lang}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function Badge({ children, color = "blue" }: { children: string; color?: string }) {
  const cls = { blue: "bg-blue-500/10 text-blue-400 border-blue-500/20", green: "bg-green-500/10 text-green-400 border-green-500/20", red: "bg-red-500/10 text-red-400 border-red-500/20", yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", purple: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
  return <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded border font-mono", cls[color as keyof typeof cls] ?? cls.blue)}>{children}</span>;
}

function ParamRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-3 pr-4 align-top">
        <code className="text-xs font-mono text-primary">{name}</code>
        {required && <span className="ml-1 text-[10px] text-red-400">*</span>}
      </td>
      <td className="py-3 pr-4 align-top"><Badge color="blue">{type}</Badge></td>
      <td className="py-3 text-sm text-muted-foreground">{desc}</td>
    </tr>
  );
}

export default function DocsPayin() {
  const [active, setActive] = useState("introduction");
  const [langTab, setLangTab] = useState("curl");

  const scroll = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const LANGS = ["curl", "node.js", "php", "python"];

  const initiateExamples: Record<string, string> = {
    "curl": `curl -X POST https://api.drimpay.africa/v2/payin/initiate \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "XOF",
    "country_code": "TG",
    "operator": "tmoney",
    "phone": "+22890000000",
    "order_id": "ORDER-20240501-001",
    "webhook_url": "https://yourapp.com/webhook/drimpay",
    "return_url": "https://yourapp.com/payment/success",
    "description": "Payment for order #001"
  }'`,
    "node.js": `const response = await fetch(
  "https://api.drimpay.africa/v2/payin/initiate",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 5000,
      currency: "XOF",
      country_code: "TG",
      operator: "tmoney",
      phone: "+22890000000",
      order_id: "ORDER-20240501-001",
      webhook_url: "https://yourapp.com/webhook/drimpay",
      return_url: "https://yourapp.com/payment/success",
      description: "Payment for order #001",
    }),
  }
);
const data = await response.json();
console.log(data.reference); // TG-A1B2C3D4E5F6...`,
    "php": `<?php
$ch = curl_init("https://api.drimpay.africa/v2/payin/initiate");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount"      => 5000,
    "currency"    => "XOF",
    "country_code"=> "TG",
    "operator"    => "tmoney",
    "phone"       => "+22890000000",
    "order_id"    => "ORDER-20240501-001",
    "webhook_url" => "https://yourapp.com/webhook/drimpay",
    "description" => "Payment for order #001",
  ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response["reference"];`,
    "python": `import requests

response = requests.post(
    "https://api.drimpay.africa/v2/payin/initiate",
    headers={
        "Authorization": "Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
        "Content-Type": "application/json",
    },
    json={
        "amount": 5000,
        "currency": "XOF",
        "country_code": "TG",
        "operator": "tmoney",
        "phone": "+22890000000",
        "order_id": "ORDER-20240501-001",
        "webhook_url": "https://yourapp.com/webhook/drimpay",
        "description": "Payment for order #001",
    },
)
data = response.json()
print(data["reference"])`,
  };

  const groups = [...new Set(SECTIONS.map(s => s.group))];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-6 gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base leading-none">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight">DrimPay</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ArrowDownLeft className="w-4 h-4 text-primary" /> Pay-in API
          </span>
        </div>
        <div className="flex-1" />
        <Link href="/docs/payout">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pay-out Docs →</span>
        </Link>
        <Link href="/signup">
          <button className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            Create Account
          </button>
        </Link>
      </header>

      <div className="flex pt-14 flex-1">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/30 fixed top-14 bottom-0 overflow-y-auto">
          <nav className="px-4 py-6 space-y-0.5">
            {groups.map(g => (
              <div key={g} className="mb-4">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">{g}</p>
                {SECTIONS.filter(s => s.group === g).map(s => (
                  <button key={s.id} onClick={() => scroll(s.id)}
                    className={cn("w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}>
                    {active === s.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 lg:ml-64 min-w-0 px-6 md:px-12 lg:px-16 py-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3 h-3" /> Pay-in API
                </span>
                <Badge color="green">v2.0</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">Pay-in Documentation</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Collect Mobile Money payments from your customers across West & Central Africa. One unified endpoint, all operators, all countries.
              </p>
            </div>

            <section id="introduction" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The DrimPay Pay-in API lets you initiate Mobile Money collection requests directly from your application. When a customer places an order, you call our API — we trigger a payment prompt on their phone, they confirm it, and you receive a webhook notification with the result.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DrimPay charges a flat <strong className="text-foreground">3% fee</strong> on every successful transaction. The net amount (gross minus fee) is credited to your country-specific wallet instantly upon confirmation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Zap, title: "Instant confirmation", desc: "Real-time webhook on payment success or failure" },
                  { icon: Globe, title: "7+ countries", desc: "Togo, Bénin, Cameroun, Sénégal, Côte d'Ivoire, Mali, Burkina Faso" },
                  { icon: Shield, title: "Secure by default", desc: "TLS 1.3, signed webhooks, idempotent requests" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-border bg-card">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="authentication" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Authentication</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All API requests must include your secret key in the <code className="text-primary text-sm font-mono bg-primary/10 px-1.5 py-0.5 rounded">Authorization</code> header using Bearer token scheme.
              </p>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">Keep your key secret</p>
                  <p className="text-sm text-muted-foreground">Never expose your live secret key in frontend code, mobile apps, or version control. Use environment variables on your server.</p>
                </div>
              </div>
              <CodeBlock lang="bash" code={`Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
              <p className="text-sm text-muted-foreground mt-2">
                Use keys prefixed with <code className="font-mono text-xs text-primary">dp_sandbox_sk_</code> for testing, and <code className="font-mono text-xs text-primary">dp_live_sk_</code> in production. Manage your keys in the <Link href="/dashboard/api-keys" className="text-primary hover:underline">API Keys dashboard</Link>.
              </p>
            </section>

            <section id="environments" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Environments</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Environment</th>
                    <th className="text-left px-4 py-3 font-semibold">Base URL</th>
                    <th className="text-left px-4 py-3 font-semibold">Key prefix</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3"><Badge color="yellow">sandbox</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">https://sandbox.drimpay.africa/v2</td>
                      <td className="px-4 py-3 font-mono text-xs"><code className="text-primary">dp_sandbox_sk_</code></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><Badge color="green">live</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">https://api.drimpay.africa/v2</td>
                      <td className="px-4 py-3 font-mono text-xs"><code className="text-primary">dp_live_sk_</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="sandbox" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-primary" /> Sandbox / Test Mode</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The sandbox environment is fully isolated — no real money moves. Use these test phone numbers to simulate different outcomes:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Phone number</th>
                    <th className="text-left px-4 py-3 font-semibold">Simulates</th>
                    <th className="text-left px-4 py-3 font-semibold">Result</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["+22890000001", "Successful payment", "success"],
                      ["+22890000002", "Payment declined by user", "failed"],
                      ["+22890000003", "Timeout (no response)", "failed"],
                      ["+22890000004", "Insufficient funds", "failed"],
                      ["+22890000005", "Delayed confirmation (30s)", "success"],
                    ].map(([phone, sim, res]) => (
                      <tr key={phone} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sim}</td>
                        <td className="px-4 py-3">
                          <Badge color={res === "success" ? "green" : "red"}>{res}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="request" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-primary" /> Request Format</h2>
              <p className="text-muted-foreground mb-4">All requests must use <code className="text-primary font-mono text-sm">Content-Type: application/json</code>. Request bodies must be valid JSON encoded in UTF-8.</p>
              <p className="text-muted-foreground mb-2">To prevent duplicate charges, pass a unique <code className="text-primary font-mono text-sm">order_id</code> per transaction. If you retry with the same <code className="text-primary font-mono text-sm">order_id</code>, the API returns the original transaction without creating a duplicate.</p>
            </section>

            <section id="response" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4">Response Format</h2>
              <p className="text-muted-foreground mb-4">All responses are JSON. Successful responses return HTTP <Badge color="green">200</Badge> or <Badge color="green">201</Badge>. Errors return the appropriate 4xx/5xx code with an <code className="font-mono text-primary text-sm">error</code> field.</p>
              <CodeBlock lang="json" code={`{
  "reference": "TG-A1B2C3D4E5F677809900AABBCC",
  "order_id": "ORDER-20240501-001",
  "status": "pending",
  "amount": 5000,
  "fee": 150,
  "net_amount": 4850,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "tmoney",
  "phone": "+22890000000",
  "mode": "live",
  "created_at": "2026-05-06T08:30:00.000Z"
}`} />
            </section>

            <section id="errors" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4">Error Codes</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">HTTP Code</th>
                    <th className="text-left px-4 py-3 font-semibold">Error</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["400", "INVALID_PARAMS", "Missing or malformed request parameters"],
                      ["401", "UNAUTHORIZED", "Missing or invalid API key"],
                      ["402", "INSUFFICIENT_FUNDS", "Customer wallet has insufficient funds"],
                      ["409", "DUPLICATE_ORDER", "order_id already exists — original transaction returned"],
                      ["422", "OPERATOR_UNAVAILABLE", "Operator temporarily unavailable, retry later"],
                      ["429", "RATE_LIMITED", "Too many requests — slow down"],
                      ["500", "INTERNAL_ERROR", "Server error — contact support"],
                    ].map(([code, err, desc]) => (
                      <tr key={code} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3"><Badge color={code.startsWith("4") ? "red" : "yellow"}>{code}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs text-orange-400">{err}</td>
                        <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="initiate" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Initiate a Pay-in</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payin/initiate</code>
              </div>
              <p className="text-muted-foreground mb-5">Creates a new payment collection request and sends a prompt to the customer's Mobile Money phone.</p>

              <h3 className="text-base font-semibold mb-3">Request Parameters</h3>
              <div className="rounded-xl border border-border overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Description</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    <ParamRow name="amount" type="number" required desc="Amount to collect in the smallest currency unit (e.g. 5000 = 5000 XOF)" />
                    <ParamRow name="currency" type="string" required desc="ISO 4217 currency code: XOF, XAF" />
                    <ParamRow name="country_code" type="string" required desc="ISO 3166-1 alpha-2 country code: TG, BJ, CM, SN, CI, ML, BF" />
                    <ParamRow name="operator" type="string" required desc="Mobile Money operator slug: tmoney, moov, mtn, orange, wave, flooz" />
                    <ParamRow name="phone" type="string" required desc="Customer's Mobile Money phone number in E.164 format (+22890000000)" />
                    <ParamRow name="order_id" type="string" required desc="Your unique order/transaction ID for idempotency (max 128 chars)" />
                    <ParamRow name="webhook_url" type="string" required desc="HTTPS URL where DrimPay sends payment status notifications" />
                    <ParamRow name="return_url" type="string" desc="URL to redirect the customer after payment (optional)" />
                    <ParamRow name="description" type="string" desc="Payment description visible on the customer receipt (max 255 chars)" />
                    <ParamRow name="metadata" type="object" desc="Any custom key-value data you want attached to this transaction" />
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mb-2">
                {LANGS.map(l => (
                  <button key={l} onClick={() => setLangTab(l)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all", langTab === l ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
              <CodeBlock lang={langTab} code={initiateExamples[langTab] ?? ""} />

              <h3 className="text-base font-semibold mb-3 mt-6">Response</h3>
              <CodeBlock lang="json" code={`{
  "reference": "TG-A1B2C3D4E5F677809900AABBCC",
  "order_id": "ORDER-20240501-001",
  "status": "pending",
  "amount": 5000,
  "fee": 150,
  "net_amount": 4850,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "tmoney",
  "phone": "+22890000000",
  "mode": "live",
  "created_at": "2026-05-06T08:30:00.000Z"
}`} />
            </section>

            <section id="status" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Check Payment Status</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payin/{"{reference}"}</code>
              </div>
              <p className="text-muted-foreground mb-5">Retrieve the current status of a pay-in transaction by its reference. Use this as a fallback if your webhook wasn't received.</p>
              <CodeBlock lang="bash" code={`curl https://api.drimpay.africa/v2/payin/TG-A1B2C3D4E5F677809900AABBCC \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />

              <h3 className="text-base font-semibold mb-2 mt-4">Status values</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { s: "pending", icon: Clock, desc: "Waiting for customer to confirm", color: "yellow" },
                  { s: "processing", icon: AlertCircle, desc: "Operator is processing", color: "blue" },
                  { s: "success", icon: CheckCircle2, desc: "Payment confirmed and credited", color: "green" },
                  { s: "failed", icon: XCircle, desc: "Payment declined or timed out", color: "red" },
                ].map(({ s, icon: Icon, desc, color }) => (
                  <div key={s} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card flex-1 min-w-[200px]">
                    <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", { yellow: "text-yellow-400", blue: "text-blue-400", green: "text-green-400", red: "text-red-400" }[color])} />
                    <div>
                      <p className="text-xs font-mono font-bold">{s}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="list" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">List Transactions</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payin/transactions</code>
              </div>
              <p className="text-muted-foreground mb-4">Returns a paginated list of all your pay-in transactions.</p>
              <CodeBlock lang="bash" code={`curl "https://api.drimpay.africa/v2/payin/transactions?page=1&limit=20&status=success&country_code=TG" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
              <h3 className="text-base font-semibold mb-3 mt-4">Query Parameters</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border/40">
                    <ParamRow name="page" type="integer" desc="Page number (default: 1)" />
                    <ParamRow name="limit" type="integer" desc="Results per page, max 100 (default: 20)" />
                    <ParamRow name="status" type="string" desc="Filter by status: pending, processing, success, failed" />
                    <ParamRow name="country_code" type="string" desc="Filter by country code" />
                    <ParamRow name="from" type="string" desc="Start date ISO 8601 (e.g. 2026-01-01T00:00:00Z)" />
                    <ParamRow name="to" type="string" desc="End date ISO 8601" />
                  </tbody>
                </table>
              </div>
            </section>

            <section id="webhooks" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Webhook className="w-5 h-5 text-primary" /> Webhooks</h2>
              <p className="text-muted-foreground mb-4">
                When a payment is confirmed or fails, DrimPay makes an HTTP POST to your <code className="text-primary font-mono text-sm">webhook_url</code> with the transaction payload. Your server must respond with HTTP 200 within 10 seconds.
              </p>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-5 flex gap-3">
                <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-1">Verify webhook signatures</p>
                  <p className="text-sm text-muted-foreground">Each webhook includes a <code className="font-mono text-xs">X-DrimPay-Signature</code> header — an HMAC-SHA256 of the raw body signed with your webhook secret. Always verify this before processing.</p>
                </div>
              </div>
              <CodeBlock lang="json" code={`{
  "event": "payin.success",
  "reference": "TG-A1B2C3D4E5F677809900AABBCC",
  "order_id": "ORDER-20240501-001",
  "status": "success",
  "amount": 5000,
  "fee": 150,
  "net_amount": 4850,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "tmoney",
  "phone": "+22890000000",
  "gateway_reference": "TMONEY-REF-98765",
  "mno_reference": "MNO-REF-00112233",
  "created_at": "2026-05-06T08:30:00.000Z",
  "confirmed_at": "2026-05-06T08:31:12.000Z"
}`} />
              <h3 className="text-base font-semibold mb-3 mt-4">Signature verification (Node.js)</h3>
              <CodeBlock lang="node.js" code={`const crypto = require("crypto");

function verifyWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// Express middleware
app.post("/webhook/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-drimpay-signature"];
  if (!verifyWebhook(req.body, sig, process.env.DRIMPAY_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }
  const event = JSON.parse(req.body);
  if (event.status === "success") {
    // Fulfill the order
  }
  res.status(200).send("OK");
});`} />
            </section>

            <section id="resend" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Resend Webhook</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payin/{"{reference}"}/resend-webhook</code>
              </div>
              <p className="text-muted-foreground mb-4">
                If your server missed a webhook notification (downtime, misconfiguration, etc.), you can trigger a resend manually — via this endpoint or directly from your <Link href="/dashboard/payments" className="text-primary hover:underline">Payment History dashboard</Link>.
              </p>
              <CodeBlock lang="bash" code={`curl -X POST https://api.drimpay.africa/v2/payin/TG-A1B2C3D4E5F677809900AABBCC/resend-webhook \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
              <CodeBlock lang="json" code={`{ "message": "Webhook queued for resend", "reference": "TG-A1B2C3D4E5F677809900AABBCC" }`} />
            </section>

            <div className="border border-border rounded-2xl p-6 bg-card mt-6">
              <p className="text-sm text-muted-foreground mb-4">Ready to collect your first payment?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <button className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                    Create your account <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/docs/payout">
                  <button className="border border-border text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Pay-out documentation
                  </button>
                </Link>
              </div>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
}
