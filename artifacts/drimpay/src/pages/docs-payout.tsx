import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownLeft, ChevronRight, Copy, Check, BookOpen, Shield, Globe,
  Zap, Webhook, Code, Terminal, AlertTriangle, CheckCircle2, Clock, XCircle, Users, AlertCircle,
  Menu, X
} from "lucide-react";
import apiIconImg from "@assets/6213702_1778508885407.png";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "introduction", label: "Introduction", group: "GETTING STARTED" },
  { id: "authentication", label: "Authentication", group: "GETTING STARTED" },
  { id: "environments", label: "Environments", group: "GETTING STARTED" },
  { id: "sandbox", label: "Sandbox / Test Mode", group: "GETTING STARTED" },
  { id: "request", label: "Request Format", group: "API REFERENCE" },
  { id: "response", label: "Response Format", group: "API REFERENCE" },
  { id: "errors", label: "Error Codes", group: "API REFERENCE" },
  { id: "limits", label: "Limits & Security", group: "API REFERENCE" },
  { id: "kyb", label: "KYB Verification", group: "API REFERENCE" },
  { id: "wallet-protection", label: "Wallet Protection", group: "API REFERENCE" },
  { id: "send", label: "Send a Pay-out", group: "ENDPOINTS" },
  { id: "status", label: "Check Status", group: "ENDPOINTS" },
  { id: "list", label: "List Transactions", group: "ENDPOINTS" },
  { id: "mass", label: "Mass Pay-out", group: "ENDPOINTS" },
  { id: "webhooks", label: "Webhooks", group: "WEBHOOKS" },
  { id: "resend", label: "Resend Webhook", group: "WEBHOOKS" },
  { id: "retry", label: "Retry Logic", group: "WEBHOOKS" },
];

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <span className="text-xs font-mono text-white/40">{lang}</span>
        <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5 text-xs">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function Badge({ children, color = "orange" }: { children: string; color?: string }) {
  const cls = { orange: "bg-orange-500/10 text-orange-400 border-orange-500/20", green: "bg-green-500/10 text-green-400 border-green-500/20", red: "bg-red-500/10 text-red-400 border-red-500/20", yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", blue: "bg-blue-500/10 text-blue-400 border-blue-500/20", purple: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
  return <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded border font-mono", cls[color as keyof typeof cls] ?? cls.orange)}>{children}</span>;
}

function ParamRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-3 pr-4 align-top"><code className="text-xs font-mono text-primary">{name}</code>{required && <span className="ml-1 text-[10px] text-red-400">*</span>}</td>
      <td className="py-3 pr-4 align-top"><Badge color="blue">{type}</Badge></td>
      <td className="py-3 text-sm text-muted-foreground">{desc}</td>
    </tr>
  );
}

export default function DocsPayout() {
  const [active, setActive] = useState("introduction");
  const [langTab, setLangTab] = useState("curl");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const LANGS = ["curl", "node.js", "php", "python"];

  const scroll = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sendExamples: Record<string, string> = {
    "curl": `curl -X POST https://api.drimpay.africa/v2/payout/send \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "XOF",
    "country_code": "SN",
    "operator": "orange",
    "phone": "+221770000000",
    "order_id": "PAYOUT-20240501-042",
    "webhook_url": "https://yourapp.com/webhook/drimpay",
    "description": "Supplier payment May 2026"
  }'`,
    "node.js": `const response = await fetch(
  "https://api.drimpay.africa/v2/payout/send",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 10000,
      currency: "XOF",
      country_code: "SN",
      operator: "orange",
      phone: "+221770000000",
      order_id: "PAYOUT-20240501-042",
      webhook_url: "https://yourapp.com/webhook/drimpay",
      description: "Supplier payment May 2026",
    }),
  }
);
const data = await response.json();
console.log(data.reference); // SN-X9Y8Z7W6V5U4...`,
    "php": `<?php
$ch = curl_init("https://api.drimpay.africa/v2/payout/send");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount"      => 10000,
    "currency"    => "XOF",
    "country_code"=> "SN",
    "operator"    => "orange",
    "phone"       => "+221770000000",
    "order_id"    => "PAYOUT-20240501-042",
    "webhook_url" => "https://yourapp.com/webhook/drimpay",
    "description" => "Supplier payment May 2026",
  ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response["reference"];`,
    "python": `import requests

response = requests.post(
    "https://api.drimpay.africa/v2/payout/send",
    headers={
        "Authorization": "Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
        "Content-Type": "application/json",
    },
    json={
        "amount": 10000,
        "currency": "XOF",
        "country_code": "SN",
        "operator": "orange",
        "phone": "+221770000000",
        "order_id": "PAYOUT-20240501-042",
        "webhook_url": "https://yourapp.com/webhook/drimpay",
        "description": "Supplier payment May 2026",
    },
)
data = response.json()
print(data["reference"])`,
  };

  const groups = [...new Set(SECTIONS.map(s => s.group))];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <button
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-drimpay.png" alt="DrimPay" className="h-8 w-auto object-contain" />
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <img src={apiIconImg} alt="" className="w-5 h-5 object-contain" /> Pay-out API
          </span>
        </div>
        <div className="flex-1" />
        <Link href="/docs/payin">
          <span className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pay-in Docs →</span>
        </Link>
        <Link href="/signup">
          <button className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            Create Account
          </button>
        </Link>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/logo-drimpay.png" alt="DrimPay" className="h-6 w-auto object-contain" />
                <span className="font-bold tracking-tight">Pay-out API</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5">
              {groups.map(g => (
                <div key={g} className="mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">{g}</p>
                  {SECTIONS.filter(s => s.group === g).map(s => (
                    <button key={s.id} onClick={() => { scroll(s.id); setMobileNavOpen(false); }}
                      className={cn("w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active === s.id ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}>
                      {active === s.id && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-border">
              <Link href="/docs/payin" onClick={() => setMobileNavOpen(false)}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
                  <ArrowDownLeft className="w-4 h-4" /> Pay-in Docs
                </div>
              </Link>
            </div>
          </aside>
        </div>
      )}

      <div className="flex pt-14 flex-1">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/30 fixed top-14 bottom-0 overflow-y-auto">
          <nav className="px-4 py-6 space-y-0.5">
            {groups.map(g => (
              <div key={g} className="mb-4">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">{g}</p>
                {SECTIONS.filter(s => s.group === g).map(s => (
                  <button key={s.id} onClick={() => scroll(s.id)}
                    className={cn("w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active === s.id ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}>
                    {active === s.id && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
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
                <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3" /> Pay-out API
                </span>
                <Badge color="green">v2.0</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">Pay-out Documentation</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Disburse funds to any Mobile Money account across West & Central Africa. Pay suppliers, employees, agents, or customers instantly at scale.
              </p>
            </div>

            <section id="introduction" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-orange-400" /> Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The DrimPay Pay-out API enables you to push money directly to any Mobile Money wallet. This is ideal for supplier payments, agent commissions, salary disbursements, customer refunds, and mass payroll.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Funds are debited from your <strong className="text-foreground">country-specific wallet</strong>. You must have an active wallet with sufficient balance in the destination country before initiating a pay-out. DrimPay charges a flat <strong className="text-foreground">3% fee</strong> per transaction — the total deducted from your wallet is <strong className="text-foreground">amount + fee</strong>.
              </p>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">Geo-isolated wallets</p>
                  <p className="text-sm text-muted-foreground">You can only pay out to a country where you have an active wallet. Money received in Togo (XOF) can only be disbursed from your Togo wallet — cross-country transfers are not permitted.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Zap, title: "Near-instant delivery", desc: "Funds arrive on the recipient's phone within minutes" },
                  { icon: Users, title: "Mass disbursement", desc: "Send to up to 50,000 recipients in a single batch request" },
                  { icon: Shield, title: "Idempotent & safe", desc: "Unique order_id prevents duplicate payouts" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-border bg-card">
                    <Icon className="w-5 h-5 text-orange-400 mb-2" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="authentication" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> Authentication</h2>
              <p className="text-muted-foreground mb-4">All requests require your secret key in the <code className="text-primary font-mono text-sm bg-primary/10 px-1.5 py-0.5 rounded">Authorization</code> header.</p>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-red-400">Pay-out keys are high-privilege.</span> A compromised live key can drain your wallet. Rotate your keys immediately if you suspect exposure. Never use them client-side.</p>
              </div>
              <CodeBlock lang="bash" code={`Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
            </section>

            <section id="environments" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-orange-400" /> Environments</h2>
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
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-orange-400" /> Sandbox / Test Mode</h2>
              <p className="text-muted-foreground mb-4">Sandbox wallets are pre-funded with test credits. Use these phone numbers to simulate outcomes:</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Phone number</th>
                    <th className="text-left px-4 py-3 font-semibold">Simulates</th>
                    <th className="text-left px-4 py-3 font-semibold">Result</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["+22190000001", "Successful disbursement", "success"],
                      ["+22190000002", "Recipient account inactive", "failed"],
                      ["+22190000003", "Network timeout", "failed"],
                      ["+22190000004", "Invalid phone number", "failed"],
                      ["+22190000005", "Slow delivery (45s)", "success"],
                    ].map(([phone, sim, res]) => (
                      <tr key={phone} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-orange-400">{phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sim}</td>
                        <td className="px-4 py-3"><Badge color={res === "success" ? "green" : "red"}>{res}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="request" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-orange-400" /> Request Format</h2>
              <p className="text-muted-foreground mb-4">All requests must use <code className="text-primary font-mono text-sm">Content-Type: application/json</code>. Use a unique <code className="text-primary font-mono text-sm">order_id</code> per payout for idempotency — retrying with the same ID returns the original response without sending money twice.</p>
            </section>

            <section id="response" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4">Response Format</h2>
              <p className="text-muted-foreground mb-4">Successful responses return HTTP <Badge color="green">201</Badge>. The deducted amount includes the gross amount plus fee.</p>
              <CodeBlock lang="json" code={`{
  "reference": "SN-X9Y8Z7W6V5U4T3S2R1Q0P9O8",
  "order_id": "PAYOUT-20240501-042",
  "status": "pending",
  "amount": 10000,
  "fee": 300,
  "total_debited": 10300,
  "currency": "XOF",
  "country_code": "SN",
  "operator": "orange",
  "phone": "+221770000000",
  "wallet_balance_after": 89700,
  "mode": "live",
  "created_at": "2026-05-06T09:00:00.000Z"
}`} />
            </section>

            <section id="errors" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4">Error Codes</h2>
              <p className="text-muted-foreground mb-4">All error responses include both an <code className="font-mono text-primary text-sm">error</code> code and a human-readable <code className="font-mono text-primary text-sm">message</code> field.</p>
              <CodeBlock lang="json" code={`{
  "error": "INVALID_PHONE",
  "message": "Phone must be in E.164 format (e.g. +22890000000)"
}`} />
              <div className="overflow-x-auto rounded-xl border border-border mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">HTTP Code</th>
                    <th className="text-left px-4 py-3 font-semibold">Error</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["400", "INVALID_PHONE", "Phone must be in E.164 format"],
                      ["400", "INVALID_AMOUNT", "Amount must be a positive integer"],
                      ["400", "INVALID_CURRENCY", "Unsupported currency code"],
                      ["400", "INVALID_OPERATOR", "Operator not supported for this country"],
                      ["401", "UNAUTHORIZED", "Missing or invalid API key"],
                      ["402", "WALLET_INSUFFICIENT_FUNDS", "Your wallet balance is too low for this payout"],
                      ["403", "KYB_REQUIRED", "KYB not approved — complete verification first"],
                      ["403", "NO_WALLET_FOR_COUNTRY", "No active wallet for this country — fund one first"],
                      ["403", "LIMIT_EXCEEDED", "Amount exceeds max transaction or daily limit"],
                      ["409", "DUPLICATE_ORDER", "order_id already used — original payout returned"],
                      ["422", "OPERATOR_UNAVAILABLE", "Operator temporarily unavailable"],
                      ["429", "RATE_LIMITED", "Too many requests — 100 req/min max per API key"],
                      ["500", "INTERNAL_ERROR", "Server error — contact support"],
                    ].map(([code, err, desc]) => (
                      <tr key={err} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3"><Badge color={code.startsWith("4") ? "red" : "yellow"}>{code}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs text-orange-400">{err}</td>
                        <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="limits" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> Limits & Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Max per transaction", value: "1 000 000 FCFA" },
                  { label: "Max per day", value: "10 000 000 FCFA" },
                  { label: "Rate limit", value: "100 req / min / key" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
                    <p className="text-xl font-bold text-orange-400 mb-1">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">Requests exceeding these limits return <code className="font-mono text-primary">403 LIMIT_EXCEEDED</code>. Contact support to request higher limits.</p>
            </section>

            <section id="kyb" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-orange-400" /> KYB Verification</h2>
              <p className="text-muted-foreground mb-4">
                Pay-out is a privileged operation. Your business account must pass KYB (Know Your Business) verification before you can initiate any live payouts. Sandbox payouts are unrestricted.
              </p>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-1">KYB required for live payouts</p>
                  <p className="text-sm text-muted-foreground">If your account is not approved, the API returns <code className="font-mono text-xs">403 KYB_REQUIRED</code>. Submit your documents in the <Link href="/dashboard/kyb" className="text-primary hover:underline">KYB dashboard</Link>.</p>
                </div>
              </div>
              <CodeBlock lang="json" code={`// Response when KYB is not approved
{
  "error": "KYB_REQUIRED",
  "message": "Your account must complete KYB verification before sending live payouts"
}`} />
            </section>

            <section id="wallet-protection" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> Wallet Protection</h2>
              <p className="text-muted-foreground mb-4">
                DrimPay uses database-level row locking to prevent double-spending. Every payout debit is wrapped in a serialized transaction — concurrent requests for the same wallet are queued, never processed in parallel.
              </p>
              <CodeBlock lang="sql" code={`-- DrimPay internal wallet debit logic (simplified)
BEGIN;

SELECT balance FROM wallets
  WHERE id = :wallet_id
  FOR UPDATE; -- row-level lock, blocks concurrent debits

-- balance check happens here

UPDATE wallets
  SET balance = balance - :total_debit
  WHERE id = :wallet_id;

COMMIT;`} />
              <p className="text-sm text-muted-foreground mt-3">This guarantees your wallet can never go negative due to race conditions. Use idempotent <code className="font-mono text-primary">order_id</code> values to safely retry without risking duplicate payouts.</p>
            </section>

            <section id="send" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Send a Pay-out</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payout/send</code>
              </div>
              <p className="text-muted-foreground mb-5">Disburse funds from your wallet to a Mobile Money recipient. The wallet matching the destination country is debited automatically.</p>

              <h3 className="text-base font-semibold mb-3">Request Parameters</h3>
              <div className="rounded-xl border border-border overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Description</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    <ParamRow name="amount" type="number" required desc="Gross amount to send (fee will be added on top)" />
                    <ParamRow name="currency" type="string" required desc="ISO 4217 currency code: XOF, XAF" />
                    <ParamRow name="country_code" type="string" required desc="Destination country code: TG, BJ, CM, SN, CI, ML, BF — and NG, CD for Airtel/Vodacom" />
                    <ParamRow name="operator" type="string" required desc="Mobile Money operator slug: tmoney, moov, mtn, orange, wave, wizall, vodacom, airtel" />
                    <ParamRow name="phone" type="string" required desc="Recipient's Mobile Money phone number in E.164 format" />
                    <ParamRow name="order_id" type="string" required desc="Your unique payout ID for idempotency (max 128 chars)" />
                    <ParamRow name="webhook_url" type="string" required desc="HTTPS URL for payout status notifications" />
                    <ParamRow name="description" type="string" desc="Payout description for accounting (max 255 chars)" />
                    <ParamRow name="metadata" type="object" desc="Custom key-value data attached to this payout" />
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mb-2">
                {["curl", "node.js", "php", "python"].map(l => (
                  <button key={l} onClick={() => setLangTab(l)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all", langTab === l ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
              <CodeBlock lang={langTab} code={sendExamples[langTab] ?? ""} />
            </section>

            <section id="status" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Check Payout Status</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payout/{"{reference}"}</code>
              </div>
              <p className="text-muted-foreground mb-4">Poll the status of a payout by its reference. Use as a fallback if your webhook wasn't received.</p>
              <CodeBlock lang="bash" code={`curl https://api.drimpay.africa/v2/payout/SN-X9Y8Z7W6V5U4T3S2R1Q0P9O8 \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
            </section>

            <section id="list" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">List Pay-outs</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payout/transactions</code>
              </div>
              <p className="text-muted-foreground mb-4">Returns a paginated list of all your outgoing transactions with filters.</p>
              <CodeBlock lang="bash" code={`curl "https://api.drimpay.africa/v2/payout/transactions?page=1&limit=20&country_code=SN&status=success" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
            </section>

            <section id="mass" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-orange-400" /> Mass Pay-out</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payout/mass</code>
              </div>
              <p className="text-muted-foreground mb-5">Send to up to 50,000 recipients in a single request. The job processes asynchronously — you receive webhook updates per recipient and a final summary webhook.</p>
              <CodeBlock lang="bash" code={`curl -X POST https://api.drimpay.africa/v2/payout/mass \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "May 2026 Payroll",
    "webhook_url": "https://yourapp.com/webhook/drimpay",
    "recipients": [
      {
        "phone": "+22890000001",
        "country_code": "TG",
        "operator": "tmoney",
        "amount": 150000,
        "currency": "XOF",
        "order_id": "PAYROLL-MAY2026-EMP001"
      },
      {
        "phone": "+22190000002",
        "country_code": "SN",
        "operator": "orange",
        "amount": 200000,
        "currency": "XOF",
        "order_id": "PAYROLL-MAY2026-EMP002"
      }
    ]
  }'`} />
              <CodeBlock lang="json" code={`{
  "job_id": "MASS-JOB-A1B2C3D4E5F6",
  "status": "processing",
  "total_recipients": 2,
  "total_amount": 350000,
  "total_fees": 10500,
  "total_debited": 360500,
  "currency": "XOF",
  "created_at": "2026-05-06T10:00:00.000Z"
}`} />
            </section>

            <section id="webhooks" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Webhook className="w-5 h-5 text-orange-400" /> Webhooks</h2>
              <p className="text-muted-foreground mb-4">DrimPay POSTs to your <code className="font-mono text-primary text-sm">webhook_url</code> when a payout is confirmed or fails. Your server must return HTTP 200 within 10 seconds.</p>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-5 flex gap-3">
                <Shield className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-400 mb-1">Webhook signature — mandatory</p>
                  <p className="text-sm text-muted-foreground">Every webhook includes an <code className="font-mono text-xs">X-DrimPay-Signature</code> header in the format <code className="font-mono text-xs">sha256=HASH</code>. Always verify it before processing.</p>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2">Signature header</h3>
              <CodeBlock lang="bash" code={`X-DrimPay-Signature: sha256=a3f9e1c2b4d5...`} />
              <h3 className="text-base font-semibold mb-2 mt-4">Signature verification (Node.js)</h3>
              <CodeBlock lang="node.js" code={`const crypto = require("crypto");

app.post("/webhook/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-drimpay-signature"]; // "sha256=<hex>"

  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(req.body) // raw Buffer — do NOT parse as JSON first
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body);
  // handle event.status: queued | processing | success | failed | reversed | cancelled
  res.status(200).send("OK");
});`} />
              <h3 className="text-base font-semibold mb-2 mt-4">Webhook payload</h3>
              <CodeBlock lang="json" code={`{
  "event": "payout.success",
  "reference": "SN-X9Y8Z7W6V5U4T3S2R1Q0P9O8",
  "order_id": "PAYOUT-20240501-042",
  "status": "success",
  "amount": 10000,
  "fee": 300,
  "total_debited": 10300,
  "currency": "XOF",
  "country_code": "SN",
  "operator": "orange",
  "phone": "+221770000000",
  "gateway_reference": "ORANGE-REF-55443",
  "created_at": "2026-05-06T09:00:00.000Z",
  "completed_at": "2026-05-06T09:00:47.000Z"
}`} />
            </section>

            <section id="resend" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Resend Webhook</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono text-muted-foreground">/v2/payout/{"{reference}"}/resend-webhook</code>
              </div>
              <p className="text-muted-foreground mb-4">Re-trigger the webhook notification for any payout. Also available directly from your <Link href="/dashboard/payments" className="text-primary hover:underline">Payment History dashboard</Link>.</p>
              <CodeBlock lang="bash" code={`curl -X POST https://api.drimpay.africa/v2/payout/SN-X9Y8Z7W6V5U4T3S2R1Q0P9O8/resend-webhook \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
            </section>

            <section id="retry" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Webhook className="w-5 h-5 text-orange-400" /> Retry Logic</h2>
              <p className="text-muted-foreground mb-4">
                If your webhook endpoint fails, DrimPay retries up to <strong className="text-foreground">3 times</strong> with exponential backoff. For your own retries on network errors, always reuse the same <code className="font-mono text-primary">order_id</code> — the API is idempotent and will never double-pay.
              </p>
              <CodeBlock lang="node.js" code={`async function payoutWithRetry(payload, attempts = 0) {
  if (attempts >= 3) throw new Error("Max retries reached");

  try {
    const res = await fetch("https://api.drimpay.africa/v2/payout/send", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.DRIMPAY_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // same order_id on every attempt
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    const delay = 2000 * Math.pow(2, attempts); // 2s, 4s, 8s
    await new Promise(resolve => setTimeout(resolve, delay));
    return payoutWithRetry(payload, attempts + 1);
  }
}`} />
            </section>

            <div className="border border-border rounded-2xl p-6 bg-card mt-6">
              <p className="text-sm text-muted-foreground mb-4">Ready to send your first payout?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <button className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                    Create your account <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/docs/payin">
                  <button className="border border-border text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4" /> Pay-in documentation
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
