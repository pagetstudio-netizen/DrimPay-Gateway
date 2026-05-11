import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, ChevronRight, Copy, Check, BookOpen, Shield, Globe,
  Zap, Webhook, Code, Terminal, AlertTriangle, CheckCircle2, Clock, XCircle,
  AlertCircle, Menu, X, Server, RefreshCw, Lock, Activity, Timer, Ban
} from "lucide-react";
import apiIconImg from "@assets/6213702_1778508885407.png";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "introduction", label: "Introduction", group: "GETTING STARTED" },
  { id: "architecture", label: "Architecture", group: "GETTING STARTED" },
  { id: "authentication", label: "Authentication", group: "GETTING STARTED" },
  { id: "environments", label: "Environments", group: "GETTING STARTED" },
  { id: "sandbox", label: "Sandbox / Test Mode", group: "GETTING STARTED" },
  { id: "request", label: "Request Format", group: "API REFERENCE" },
  { id: "statuses", label: "Transaction Statuses", group: "API REFERENCE" },
  { id: "errors", label: "Error Codes", group: "API REFERENCE" },
  { id: "limits", label: "Rate Limiting", group: "API REFERENCE" },
  { id: "initiate", label: "POST — Initiate Pay-in", group: "ENDPOINTS" },
  { id: "status-check", label: "GET — Check Status", group: "ENDPOINTS" },
  { id: "list", label: "GET — List Transactions", group: "ENDPOINTS" },
  { id: "resend", label: "POST — Resend Webhook", group: "ENDPOINTS" },
  { id: "webhooks", label: "Webhook Events", group: "WEBHOOKS" },
  { id: "webhook-signature", label: "Verify Signature", group: "WEBHOOKS" },
  { id: "retry", label: "Retry Logic", group: "WEBHOOKS" },
  { id: "idempotency", label: "Idempotency", group: "ADVANCED" },
  { id: "expires", label: "Expiration", group: "ADVANCED" },
  { id: "geo", label: "Geo-Isolation", group: "ADVANCED" },
  { id: "polling", label: "Polling Pattern", group: "ADVANCED" },
];

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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

function Badge({ children, color = "blue" }: { children: string; color?: string }) {
  const cls: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded border font-mono", cls[color] ?? cls.blue)}>
      {children}
    </span>
  );
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

function Alert({ type, title, children }: { type: "warning" | "info" | "success" | "error"; title: string; children: React.ReactNode }) {
  const cfg = {
    warning: { cls: "bg-yellow-500/5 border-yellow-500/20", icon: AlertTriangle, iconCls: "text-yellow-400", titleCls: "text-yellow-400" },
    info: { cls: "bg-blue-500/5 border-blue-500/20", icon: AlertCircle, iconCls: "text-blue-400", titleCls: "text-blue-400" },
    success: { cls: "bg-green-500/5 border-green-500/20", icon: CheckCircle2, iconCls: "text-green-400", titleCls: "text-green-400" },
    error: { cls: "bg-red-500/5 border-red-500/20", icon: XCircle, iconCls: "text-red-400", titleCls: "text-red-400" },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className={cn("rounded-xl border p-4 mb-4 flex gap-3", cfg.cls)}>
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", cfg.iconCls)} />
      <div>
        <p className={cn("text-sm font-semibold mb-1", cfg.titleCls)}>{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function DocsPayin() {
  const [active, setActive] = useState("introduction");
  const [langTab, setLangTab] = useState("curl");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scroll = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const LANGS = ["curl", "node.js", "php", "python"];
  const groups = [...new Set(SECTIONS.map(s => s.group))];

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
    "webhook_url": "https://yourapp.com/webhooks/drimpay",
    "description": "Payment for order #001",
    "expires_in_minutes": 5
  }'`,
    "node.js": `// ⚠️ Always call DrimPay from your backend server, never from the browser!
const response = await fetch(
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
      webhook_url: "https://yourapp.com/webhooks/drimpay",
      description: "Payment for order #001",
      expires_in_minutes: 5,
    }),
  }
);
const data = await response.json();
// Returns immediately with status "pending"
console.log(data.reference);   // "TG-A1B2C3D4E5F67890"
console.log(data.expires_at);  // "2026-05-06T08:35:00.000Z"`,
    "php": `<?php
// ⚠️ Always call DrimPay from your backend server, never from the browser!
$ch = curl_init("https://api.drimpay.africa/v2/payin/initiate");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount"             => 5000,
    "currency"           => "XOF",
    "country_code"       => "TG",
    "operator"           => "tmoney",
    "phone"              => "+22890000000",
    "order_id"           => "ORDER-20240501-001",
    "webhook_url"        => "https://yourapp.com/webhooks/drimpay",
    "description"        => "Payment for order #001",
    "expires_in_minutes" => 5,
  ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response["reference"];   // "TG-A1B2C3D4E5F67890"
echo $response["expires_at"];  // "2026-05-06T08:35:00.000Z"`,
    "python": `# ⚠️ Always call DrimPay from your backend server, never from the browser!
import requests

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
        "webhook_url": "https://yourapp.com/webhooks/drimpay",
        "description": "Payment for order #001",
        "expires_in_minutes": 5,
    },
)
data = response.json()
print(data["reference"])   # "TG-A1B2C3D4E5F67890"
print(data["expires_at"])  # "2026-05-06T08:35:00.000Z"`,
  };

  const pollingExamples: Record<string, string> = {
    "curl": `# Poll every 5 seconds until terminal status
curl https://api.drimpay.africa/v2/payin/TG-A1B2C3D4E5F67890 \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`,
    "node.js": `// Backend polling — never expose your secret key to the browser!
async function pollPaymentStatus(reference) {
  const TERMINAL = ["success", "failed", "expired", "cancelled", "reversed"];
  const MAX_ATTEMPTS = 40; // 40 × 5s = 3min 20s max

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const res = await fetch(
      \`https://api.drimpay.africa/v2/payin/\${reference}\`,
      { headers: { "Authorization": "Bearer dp_live_sk_xxxxxxxx" } }
    );
    const tx = await res.json();

    if (TERMINAL.includes(tx.status)) {
      return tx; // Done — update your order
    }

    // Wait 5 seconds before next poll
    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error("Payment polling timeout");
}`,
    "php": `<?php
function pollPaymentStatus(string $reference): array {
  $terminal = ["success", "failed", "expired", "cancelled", "reversed"];

  for ($i = 0; $i < 40; $i++) {
    $ch = curl_init(
      "https://api.drimpay.africa/v2/payin/{$reference}"
    );
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => [
        "Authorization: Bearer dp_live_sk_xxxxxxxx"
      ],
    ]);
    $tx = json_decode(curl_exec($ch), true);

    if (in_array($tx["status"], $terminal)) {
      return $tx;
    }
    sleep(5);
  }
  throw new Exception("Payment polling timeout");
}`,
    "python": `import time, requests

def poll_payment_status(reference: str) -> dict:
    terminal = {"success", "failed", "expired", "cancelled", "reversed"}

    for _ in range(40):  # 40 × 5s = ~3min
        r = requests.get(
            f"https://api.drimpay.africa/v2/payin/{reference}",
            headers={"Authorization": "Bearer dp_live_sk_xxxxxxxx"},
        )
        tx = r.json()
        if tx["status"] in terminal:
            return tx
        time.sleep(5)

    raise TimeoutError("Payment polling timeout")`,
  };

  const webhookVerifyExamples: Record<string, string> = {
    "curl": `# DrimPay sends to your webhook URL:
# POST https://yourapp.com/webhooks/drimpay
# Headers:
#   X-DrimPay-Signature: t=1715000000,v1=abc123...
#   X-DrimPay-Timestamp: 1715000000
#   X-DrimPay-Event: payin.success`,
    "node.js": `const crypto = require("crypto");

app.post("/webhooks/drimpay", express.raw({ type: "application/json" }), (req, res) => {
  const sigHeader = req.headers["x-drimpay-signature"];
  const timestampHeader = req.headers["x-drimpay-timestamp"];

  // Extract t= and v1= from the signature header
  const params = Object.fromEntries(
    sigHeader.split(",").map(p => p.split("="))
  );
  const { t: timestamp, v1: signature } = params;

  // Replay attack guard: reject events older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) {
    return res.status(400).json({ error: "Timestamp too old" });
  }

  // Recompute expected signature
  const payload = req.body.toString("utf-8"); // raw bytes
  const expected = crypto
    .createHmac("sha256", process.env.DRIMPAY_WEBHOOK_SECRET)
    .update(\`\${timestamp}.\${payload}\`)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const match = crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );

  if (!match) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(payload);
  if (event.event === "payin.success") {
    // Safe to fulfill the order
    fulfillOrder(event.order_id, event.net_amount);
  }

  res.json({ received: true });
});`,
    "php": `<?php
function verifyDrimPayWebhook(string $payload, string $sigHeader): bool {
  $params = [];
  foreach (explode(",", $sigHeader) as $part) {
    [$k, $v] = explode("=", $part, 2);
    $params[$k] = $v;
  }
  $timestamp = $params["t"];
  $signature = $params["v1"];

  // Replay attack guard (5 min)
  if (abs(time() - (int)$timestamp) > 300) return false;

  $expected = hash_hmac("sha256",
    "{$timestamp}.{$payload}",
    $_ENV["DRIMPAY_WEBHOOK_SECRET"]
  );
  return hash_equals($expected, $signature);
}

$payload   = file_get_contents("php://input");
$sigHeader = $_SERVER["HTTP_X_DRIMPAY_SIGNATURE"];

if (!verifyDrimPayWebhook($payload, $sigHeader)) {
  http_response_code(401);
  exit(json_encode(["error" => "Invalid signature"]));
}

$event = json_decode($payload, true);
if ($event["event"] === "payin.success") {
  fulfillOrder($event["order_id"], $event["net_amount"]);
}
echo json_encode(["received" => true]);`,
    "python": `import hmac, hashlib, time, json
from flask import Flask, request, abort

app = Flask(__name__)

def verify_drimpay_signature(payload_bytes: bytes, sig_header: str) -> bool:
    params = dict(p.split("=", 1) for p in sig_header.split(","))
    timestamp = params["t"]
    signature = params["v1"]

    # Replay attack guard (5 min)
    if abs(time.time() - int(timestamp)) > 300:
        return False

    expected = hmac.new(
        os.environ["DRIMPAY_WEBHOOK_SECRET"].encode(),
        f"{timestamp}.{payload_bytes.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.route("/webhooks/drimpay", methods=["POST"])
def drimpay_webhook():
    payload = request.get_data()
    sig_header = request.headers.get("X-DrimPay-Signature", "")

    if not verify_drimpay_signature(payload, sig_header):
        abort(401)

    event = json.loads(payload)
    if event["event"] == "payin.success":
        fulfill_order(event["order_id"], event["net_amount"])

    return {"received": True}`,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-3">
        <button
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
          onClick={() => setMobileNavOpen(true)}
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
            <img src={apiIconImg} alt="" className="w-5 h-5 object-contain" /> Pay-in API
          </span>
        </div>
        <div className="flex-1" />
        <Badge color="green">v2.0</Badge>
        <Link href="/signup">
          <button className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            Get API Key
          </button>
        </Link>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-bold">Pay-in API</span>
              <button onClick={() => setMobileNavOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-5">
              {groups.map(g => (
                <div key={g} className="mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">{g}</p>
                  {SECTIONS.filter(s => s.group === g).map(s => (
                    <button key={s.id} onClick={() => { scroll(s.id); setMobileNavOpen(false); }}
                      className={cn("w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                      {active === s.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex pt-14 flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/30 fixed top-14 bottom-0 overflow-y-auto">
          <nav className="px-4 py-6">
            {groups.map(g => (
              <div key={g} className="mb-5">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">{g}</p>
                {SECTIONS.filter(s => s.group === g).map(s => (
                  <button key={s.id} onClick={() => scroll(s.id)}
                    className={cn("w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                    {active === s.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-w-0 px-6 md:px-12 lg:px-16 py-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Brand card */}
            <div className="inline-flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-white/10 bg-white/5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <img src={apiIconImg} alt="DrimPay" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <p className="font-bold text-sm text-white leading-none mb-1">DrimPay</p>
                <p className="text-xs text-white/40">Digital Reliable Infrastructure for Money</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">API v2.0</span>
            </div>

            {/* Hero */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3 h-3" /> Pay-in API
                </span>
                <Badge color="green">v2.0</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">Pay-in Documentation</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Collect Mobile Money payments directly on your site or app — no redirects, no external pages. One unified API for all operators across Francophone Africa.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
                {[
                  { icon: Zap, title: "No redirects", desc: "100% on your interface" },
                  { icon: Globe, title: "7+ countries", desc: "XOF, XAF operators" },
                  { icon: Shield, title: "HMAC webhooks", desc: "Signed & verified" },
                  { icon: RefreshCw, title: "Auto-retry", desc: "3x exponential backoff" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-border bg-card">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Introduction */}
            <section id="introduction" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The DrimPay Pay-in API lets you initiate Mobile Money collection requests directly from your backend. The customer never leaves your interface — you send us the phone number and amount, we send the payment prompt to their phone, they confirm, and you receive a signed webhook with the result.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DrimPay charges a flat <strong className="text-foreground">3% fee</strong> on every successful transaction. The net amount is credited to your country-specific wallet immediately upon confirmation.
              </p>
              <Alert type="info" title="Full payment flow">
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>Customer enters phone + operator on <strong className="text-foreground">your site</strong></li>
                  <li><strong className="text-foreground">Your backend</strong> calls <code className="font-mono text-xs">POST /v2/payin/initiate</code></li>
                  <li>DrimPay sends a Mobile Money prompt to the customer's phone</li>
                  <li>Customer confirms the payment on their phone</li>
                  <li>DrimPay sends a signed webhook to your <code className="font-mono text-xs">webhook_url</code></li>
                  <li><strong className="text-foreground">Your backend</strong> verifies the signature and fulfills the order</li>
                </ol>
              </Alert>
            </section>

            {/* Architecture */}
            <section id="architecture" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-primary" /> Architecture</h2>
              <Alert type="error" title="Never call DrimPay directly from the browser">
                Your secret key (<code className="font-mono text-xs">dp_live_sk_*</code>) must only exist on your server. A key exposed in frontend code can be stolen and used to drain your account.
              </Alert>
              <div className="rounded-xl border border-border bg-card p-6 font-mono text-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-center py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">Customer Browser</div>
                    <div className="text-muted-foreground text-xs flex-1">— enters phone + operator →</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="w-32 text-center py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">Your Backend</div>
                    <div className="text-muted-foreground text-xs flex-1">— Authorization: Bearer dp_live_sk_xxx →</div>
                    <div className="w-24 text-center py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">DrimPay API</div>
                  </div>
                  <div className="flex items-center gap-3 ml-8">
                    <div className="w-32 text-center py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">Mobile Money</div>
                    <div className="text-muted-foreground text-xs flex-1">← prompt sent to customer ←</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="w-32 text-center py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">Your Backend</div>
                    <div className="text-muted-foreground text-xs flex-1">← X-DrimPay-Signature webhook ←</div>
                    <div className="w-24 text-center py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">DrimPay API</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Your frontend polls your own backend endpoint (e.g. <code className="font-mono text-xs text-primary">/api/check-payment?ref=xxx</code>) which in turn queries DrimPay. This way your secret key never reaches the browser.
              </p>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Authentication</h2>
              <p className="text-muted-foreground mb-4">
                All API requests require your secret key in the <code className="text-primary font-mono text-sm bg-primary/10 px-1.5 py-0.5 rounded">Authorization</code> header as a Bearer token.
              </p>
              <CodeBlock lang="http" code={`Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Key type</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Prefix</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Use for</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3"><Badge color="green">Live</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">dp_live_sk_</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">Real transactions, real money</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><Badge color="yellow">Sandbox</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">dp_sandbox_sk_</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">Testing, fake wallets, fake payments</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Manage your API keys in the <Link href="/dashboard/api-keys" className="text-primary hover:underline">API Keys dashboard</Link>.</p>
            </section>

            {/* Environments */}
            <section id="environments" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Environments</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Environment</th>
                    <th className="text-left px-4 py-3 font-semibold">Base URL</th>
                    <th className="text-left px-4 py-3 font-semibold">Key prefix</th>
                    <th className="text-left px-4 py-3 font-semibold">Real money</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3"><Badge color="yellow">sandbox</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">https://sandbox.drimpay.africa/v2</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">dp_sandbox_sk_</td>
                      <td className="px-4 py-3"><XCircle className="w-4 h-4 text-red-400" /></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3"><Badge color="green">live</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">https://api.drimpay.africa/v2</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">dp_live_sk_</td>
                      <td className="px-4 py-3"><CheckCircle2 className="w-4 h-4 text-green-400" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sandbox */}
            <section id="sandbox" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-primary" /> Sandbox / Test Mode</h2>
              <p className="text-muted-foreground mb-4">
                The sandbox is fully isolated — no real money moves. Use a <code className="font-mono text-xs text-primary">dp_sandbox_sk_</code> key and these phone numbers to simulate different outcomes:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Phone number</th>
                    <th className="text-left px-4 py-3 font-semibold">Simulates</th>
                    <th className="text-left px-4 py-3 font-semibold">Result</th>
                    <th className="text-left px-4 py-3 font-semibold">Delay</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["+22890000001", "Successful payment", "success", "~3s"],
                      ["+22890000002", "Payment declined by user", "failed", "~3s"],
                      ["+22890000003", "Timeout / no response", "expired", "at expires_at"],
                      ["+22890000004", "Insufficient funds", "failed", "~3s"],
                      ["+22890000005", "Slow confirmation (30s)", "success", "~30s"],
                    ].map(([phone, sim, res, delay]) => (
                      <tr key={phone} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sim}</td>
                        <td className="px-4 py-3"><Badge color={res === "success" ? "green" : "red"}>{res}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{delay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Alert type="info" title="Sandbox webhooks">
                In sandbox mode, DrimPay will send real HTTP requests to your <code className="font-mono text-xs">webhook_url</code> with the same HMAC signature as in production. Make sure your webhook endpoint is publicly reachable.
              </Alert>
            </section>

            {/* Request Format */}
            <section id="request" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-primary" /> Request Format</h2>
              <p className="text-muted-foreground mb-4">All requests use <code className="font-mono text-sm text-primary">Content-Type: application/json</code> with UTF-8 encoded bodies.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Max transaction", value: "1 000 000 FCFA" },
                  { label: "Max per day", value: "10 000 000 FCFA" },
                  { label: "Rate limit", value: "100 req / min / key" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
                    <p className="text-xl font-bold text-primary mb-1">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Transaction Statuses */}
            <section id="statuses" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Transaction Statuses</h2>
              <p className="text-muted-foreground mb-4">Transactions progress through the following statuses. Terminal statuses are marked with <Badge color="red">terminal</Badge> — once reached, status will not change.</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                    <th className="text-left px-4 py-3 font-semibold">Display to customer</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { status: "queued", color: "gray", desc: "Request received, waiting to be processed", msg: "Paiement en attente de traitement", terminal: false },
                      { status: "pending", color: "yellow", desc: "Prompt sent to customer's phone, awaiting confirmation", msg: "Confirmez le paiement sur votre téléphone", terminal: false },
                      { status: "processing", color: "blue", desc: "Customer confirmed, DrimPay processing the transfer", msg: "Paiement en cours de traitement", terminal: false },
                      { status: "success", color: "green", desc: "Payment confirmed, funds credited to wallet", msg: "Paiement confirmé ✓", terminal: true },
                      { status: "failed", color: "red", desc: "Payment declined, cancelled by user, or operator error", msg: "Paiement échoué", terminal: true },
                      { status: "expired", color: "orange", desc: "Customer did not confirm before expires_at", msg: "Paiement expiré — délai dépassé", terminal: true },
                      { status: "cancelled", color: "gray", desc: "Explicitly cancelled before processing", msg: "Paiement annulé", terminal: true },
                      { status: "reversed", color: "purple", desc: "Successful payment later reversed/refunded", msg: "Paiement remboursé", terminal: true },
                    ].map(({ status, color, desc, msg, terminal }) => (
                      <tr key={status} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3"><Badge color={color}>{status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">{desc}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{msg}</td>
                        <td className="px-4 py-3">{terminal ? <Badge color="red">terminal</Badge> : <Badge color="blue">transient</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Error Codes */}
            <section id="errors" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4">Error Codes</h2>
              <p className="text-muted-foreground mb-4">All error responses include an <code className="font-mono text-primary text-sm">error</code> code and a <code className="font-mono text-primary text-sm">message</code> field.</p>
              <CodeBlock lang="json" code={`{
  "error": "INVALID_PHONE",
  "message": "Phone must be in E.164 format (e.g. +22890000000)"
}`} />
              <div className="overflow-x-auto rounded-xl border border-border mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">HTTP</th>
                    <th className="text-left px-4 py-3 font-semibold">Error code</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["400", "INVALID_REQUEST", "Missing or malformed parameters"],
                      ["400", "INVALID_PHONE", "Phone must be in E.164 format"],
                      ["400", "INVALID_AMOUNT", "Amount must be a positive number"],
                      ["400", "INVALID_CURRENCY", "Currency does not match country"],
                      ["400", "INVALID_COUNTRY", "Country code not supported"],
                      ["400", "INVALID_OPERATOR", "Operator not supported for this country"],
                      ["400", "NO_WEBHOOK_URL", "No webhook URL configured for this transaction"],
                      ["401", "UNAUTHORIZED", "Missing or invalid API key"],
                      ["403", "GEO_ISOLATION_VIOLATION", "Cross-country wallet access blocked"],
                      ["403", "LIMIT_EXCEEDED", "Amount exceeds max transaction or daily limit"],
                      ["404", "NOT_FOUND", "Transaction reference not found"],
                      ["409", "DUPLICATE_ORDER", "order_id exists — original transaction returned (idempotent)"],
                      ["422", "OPERATOR_UNAVAILABLE", "Operator temporarily unavailable"],
                      ["429", "RATE_LIMITED", "100 req/min exceeded — retry after 60s"],
                      ["500", "INTERNAL_ERROR", "Server error — contact support"],
                    ].map(([code, err, desc]) => (
                      <tr key={err} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3"><Badge color={code.startsWith("2") ? "green" : code.startsWith("4") ? "red" : "yellow"}>{code}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs text-orange-400">{err}</td>
                        <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate Limiting */}
            <section id="limits" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Ban className="w-5 h-5 text-primary" /> Rate Limiting</h2>
              <p className="text-muted-foreground mb-4">Each API key is limited to <strong className="text-foreground">100 requests per minute</strong>. Exceeding this returns a <Badge color="red">429</Badge> response.</p>
              <CodeBlock lang="json" code={`HTTP/1.1 429 Too Many Requests
{
  "error": "RATE_LIMITED",
  "message": "100 requests per minute exceeded. Retry after 60 seconds.",
  "retry_after": 60
}`} />
              <Alert type="info" title="Best practice">
                Implement exponential backoff on 429 responses. For polling, use a 5-second interval — do not poll faster than once per second.
              </Alert>
            </section>

            {/* POST /v2/payin/initiate */}
            <section id="initiate" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Initiate a Pay-in</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono bg-muted/40 px-3 py-1 rounded-lg text-muted-foreground">/v2/payin/initiate</code>
              </div>
              <p className="text-muted-foreground mb-5">Creates a new payment collection request and sends a Mobile Money prompt to the customer's phone. Returns immediately with status <Badge color="yellow">pending</Badge>.</p>

              <h3 className="text-base font-semibold mb-3">Request Body</h3>
              <div className="rounded-xl border border-border overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Description</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    <ParamRow name="amount" type="number" required desc="Amount in the smallest currency unit (e.g. 5000 = 5 000 XOF)" />
                    <ParamRow name="currency" type="string" required desc="ISO 4217 code: XOF (TG, BJ, BF, ML, SN, CI) or XAF (CM)" />
                    <ParamRow name="country_code" type="string" required desc="ISO 3166-1 alpha-2 country code: TG, BJ, CM, SN, CI, ML, BF — and NG, CD for Airtel/Vodacom" />
                    <ParamRow name="operator" type="string" required desc="Operator slug: tmoney, moov, mtn, orange, wave, wizall, vodacom, airtel" />
                    <ParamRow name="phone" type="string" required desc="Customer's Mobile Money phone in E.164 format (+22890000000)" />
                    <ParamRow name="order_id" type="string" required desc="Your unique order ID for idempotency — max 128 chars" />
                    <ParamRow name="webhook_url" type="string" desc="HTTPS URL to receive payment status notifications (recommended)" />
                    <ParamRow name="description" type="string" desc="Payment description visible on customer receipt — max 255 chars" />
                    <ParamRow name="expires_in_minutes" type="number" desc="Expiration window: 2, 5, or 10 minutes (default: 5)" />
                    <ParamRow name="metadata" type="object" desc="Custom key-value data attached to the transaction" />
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

              <h3 className="text-base font-semibold mb-3 mt-6">Response <Badge color="green">201 Created</Badge></h3>
              <CodeBlock lang="json" code={`{
  "reference": "TG-A1B2C3D4E5F67890ABCD",
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
  "expires_at": "2026-05-06T08:35:00.000Z",
  "webhook_url": "https://yourapp.com/webhooks/drimpay",
  "message": "Payment prompt sent to customer's phone",
  "created_at": "2026-05-06T08:30:00.000Z"
}`} />
              <Alert type="info" title="Idempotency">
                If you call this endpoint again with the same <code className="font-mono text-xs">order_id</code>, you will receive the original transaction with <code className="font-mono text-xs">"idempotent": true</code> — no duplicate charge created.
              </Alert>
            </section>

            {/* GET /v2/payin/:reference */}
            <section id="status-check" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Check Payment Status</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono bg-muted/40 px-3 py-1 rounded-lg text-muted-foreground">/v2/payin/{"{reference}"}</code>
              </div>
              <p className="text-muted-foreground mb-4">Returns the current status of a transaction. Use this for polling from your backend while the customer waits on your frontend. The endpoint auto-expires <Badge color="yellow">pending</Badge> transactions past their <code className="font-mono text-xs text-primary">expires_at</code>.</p>
              <CodeBlock lang="bash" code={`curl https://api.drimpay.africa/v2/payin/TG-A1B2C3D4E5F67890ABCD \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
              <h3 className="text-base font-semibold mb-3 mt-4">Response <Badge color="green">200 OK</Badge></h3>
              <CodeBlock lang="json" code={`{
  "reference": "TG-A1B2C3D4E5F67890ABCD",
  "order_id": "ORDER-20240501-001",
  "status": "success",
  "amount": 5000,
  "fee": 150,
  "net_amount": 4850,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "tmoney",
  "phone": "+22890000000",
  "mode": "live",
  "failure_reason": null,
  "expires_at": "2026-05-06T08:35:00.000Z",
  "webhook_url": "https://yourapp.com/webhooks/drimpay",
  "webhook_status_code": 200,
  "webhook_retry_count": 0,
  "created_at": "2026-05-06T08:30:00.000Z",
  "updated_at": "2026-05-06T08:31:45.000Z"
}`} />
            </section>

            {/* GET /v2/payin/transactions */}
            <section id="list" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">List Transactions</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">GET</Badge>
                <code className="text-sm font-mono bg-muted/40 px-3 py-1 rounded-lg text-muted-foreground">/v2/payin/transactions</code>
              </div>
              <p className="text-muted-foreground mb-4">Returns a paginated list of all pay-in transactions for your account.</p>
              <h3 className="text-base font-semibold mb-3">Query Parameters</h3>
              <div className="rounded-xl border border-border overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Parameter</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Description</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    <ParamRow name="status" type="string" desc="Filter by status: pending, processing, success, failed, expired, etc." />
                    <ParamRow name="country_code" type="string" desc="Filter by country: TG, BJ, CM, etc." />
                    <ParamRow name="page" type="number" desc="Page number, default 1" />
                    <ParamRow name="limit" type="number" desc="Results per page, max 100, default 20" />
                  </tbody>
                </table>
              </div>
              <CodeBlock lang="bash" code={`curl "https://api.drimpay.africa/v2/payin/transactions?status=success&country_code=TG&page=1&limit=20" \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
              <CodeBlock lang="json" code={`{
  "data": [
    {
      "reference": "TG-A1B2C3D4E5F67890ABCD",
      "order_id": "ORDER-20240501-001",
      "status": "success",
      "amount": 5000,
      "fee": 150,
      "net_amount": 4850,
      "currency": "XOF",
      "country_code": "TG",
      "operator": "tmoney",
      "phone": "+22890000000",
      "mode": "live",
      "expires_at": "2026-05-06T08:35:00.000Z",
      "webhook_status_code": 200,
      "webhook_retry_count": 0,
      "created_at": "2026-05-06T08:30:00.000Z",
      "updated_at": "2026-05-06T08:31:45.000Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}`} />
            </section>

            {/* POST resend-webhook */}
            <section id="resend" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-2">Resend Webhook</h2>
              <div className="flex items-center gap-3 mb-4">
                <Badge color="green">POST</Badge>
                <code className="text-sm font-mono bg-muted/40 px-3 py-1 rounded-lg text-muted-foreground">/v2/payin/{"{reference}"}/resend-webhook</code>
              </div>
              <p className="text-muted-foreground mb-4">Manually resends the webhook for a transaction. Useful if your server was down when the original event was sent. The resent webhook is freshly signed with a new timestamp.</p>
              <CodeBlock lang="bash" code={`curl -X POST https://api.drimpay.africa/v2/payin/TG-A1B2C3D4E5F67890ABCD/resend-webhook \\
  -H "Authorization: Bearer dp_live_sk_xxxxxxxxxxxxxxxx"`} />
              <CodeBlock lang="json" code={`{
  "message": "Webhook resent",
  "reference": "TG-A1B2C3D4E5F67890ABCD",
  "status_code": 200,
  "success": true,
  "sent_at": "2026-05-06T09:00:00.000Z",
  "signature_header": "t=1715000400,v1=abc123..."
}`} />
            </section>

            {/* Webhooks */}
            <section id="webhooks" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Webhook className="w-5 h-5 text-primary" /> Webhook Events</h2>
              <p className="text-muted-foreground mb-4">DrimPay sends a <code className="font-mono text-xs text-primary">POST</code> request to your <code className="font-mono text-xs text-primary">webhook_url</code> whenever a transaction status changes. Each request includes an HMAC-SHA256 signature.</p>
              <h3 className="text-base font-semibold mb-3">Event Types</h3>
              <div className="overflow-x-auto rounded-xl border border-border mb-6">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Event</th>
                    <th className="text-left px-4 py-3 font-semibold">Triggered when</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["payin.success", "Payment confirmed, funds credited to wallet"],
                      ["payin.failed", "Payment declined or error occurred"],
                      ["payin.expired", "Customer did not confirm before expires_at"],
                      ["payin.processing", "Customer confirmed, transfer in progress"],
                      ["payin.reversed", "A successful payment was reversed/refunded"],
                    ].map(([event, desc]) => (
                      <tr key={event} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{event}</td>
                        <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="text-base font-semibold mb-3">Webhook Payload</h3>
              <CodeBlock lang="json" code={`{
  "event": "payin.success",
  "reference": "TG-A1B2C3D4E5F67890ABCD",
  "order_id": "ORDER-20240501-001",
  "status": "success",
  "amount": 5000,
  "fee": 150,
  "net_amount": 4850,
  "currency": "XOF",
  "country_code": "TG",
  "operator": "tmoney",
  "phone": "+22890000000",
  "mode": "live",
  "failure_reason": null,
  "metadata": {},
  "created_at": "2026-05-06T08:30:00.000Z",
  "updated_at": "2026-05-06T08:31:45.000Z"
}`} />
              <h3 className="text-base font-semibold mb-3 mt-4">Request Headers</h3>
              <CodeBlock lang="http" code={`POST https://yourapp.com/webhooks/drimpay
Content-Type: application/json
X-DrimPay-Signature: t=1715000000,v1=a3f4b...sha256hex...
X-DrimPay-Timestamp: 1715000000
X-DrimPay-Event: payin.success`} />
            </section>

            {/* Verify Signature */}
            <section id="webhook-signature" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Verify Webhook Signature</h2>
              <Alert type="warning" title="Always verify signatures">
                Never process a webhook without verifying its HMAC signature. An unverified webhook could be spoofed by an attacker to fake successful payments.
              </Alert>
              <p className="text-muted-foreground mb-4">
                DrimPay signs each webhook using <strong className="text-foreground">HMAC-SHA256</strong>. The signature is computed as:
              </p>
              <CodeBlock lang="bash" code={`HMAC_SHA256(key=DRIMPAY_WEBHOOK_SECRET, data="{timestamp}.{raw_body}")`} />
              <p className="text-sm text-muted-foreground mb-4">
                The result is sent in <code className="font-mono text-xs text-primary">X-DrimPay-Signature</code> as <code className="font-mono text-xs">t=&#123;timestamp&#125;,v1=&#123;hex_signature&#125;</code>. Your webhook secret is shown once in the dashboard when you configure your endpoint.
              </p>
              <div className="flex gap-2 mb-2">
                {LANGS.map(l => (
                  <button key={l} onClick={() => setLangTab(l)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all", langTab === l ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
              <CodeBlock lang={langTab} code={webhookVerifyExamples[langTab] ?? ""} />
              <Alert type="info" title="Replay attack protection">
                Always check that the webhook timestamp is within <strong>5 minutes</strong> of the current time. Reject any request where <code className="font-mono text-xs">|now - timestamp| &gt; 300</code>.
              </Alert>
            </section>

            {/* Retry Logic */}
            <section id="retry" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-primary" /> Retry Logic</h2>
              <p className="text-muted-foreground mb-4">
                If your webhook endpoint fails (non-2xx response or timeout), DrimPay automatically retries using exponential backoff:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Attempt</th>
                    <th className="text-left px-4 py-3 font-semibold">Delay after failure</th>
                    <th className="text-left px-4 py-3 font-semibold">Total time after event</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["1 (initial)", "—", "0s"],
                      ["2 (retry 1)", "2 seconds", "~2s"],
                      ["3 (retry 2)", "4 seconds", "~6s"],
                      ["4 (retry 3)", "8 seconds", "~14s"],
                    ].map(([attempt, delay, total]) => (
                      <tr key={attempt} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-sm">{attempt}</td>
                        <td className="px-4 py-3 text-muted-foreground">{delay}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Alert type="info" title="Idempotent webhook handling">
                Always make your webhook handler idempotent — DrimPay may deliver the same event multiple times. Use the <code className="font-mono text-xs">reference</code> or <code className="font-mono text-xs">order_id</code> to check if you've already processed this event before acting on it.
              </Alert>
            </section>

            {/* Idempotency */}
            <section id="idempotency" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Idempotency</h2>
              <p className="text-muted-foreground mb-4">
                Every <code className="font-mono text-xs text-primary">POST /v2/payin/initiate</code> request requires a unique <code className="font-mono text-xs text-primary">order_id</code>. If you retry the same <code className="font-mono text-xs">order_id</code> (e.g. due to a network timeout), DrimPay returns the original transaction without creating a duplicate charge.
              </p>
              <CodeBlock lang="json" code={`// Second call with same order_id → returns original transaction
{
  "idempotent": true,
  "reference": "TG-A1B2C3D4E5F67890ABCD",
  "order_id": "ORDER-20240501-001",
  "status": "pending",
  ...
}`} />
              <Alert type="success" title="How to generate a good order_id">
                Use a UUID v4 or a database primary key with a prefix: <code className="font-mono text-xs">order_&#123;uuid&#125;</code>. Never reuse an order_id for a different amount or customer.
              </Alert>
            </section>

            {/* Expiration */}
            <section id="expires" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Timer className="w-5 h-5 text-primary" /> Expiration</h2>
              <p className="text-muted-foreground mb-4">
                Every transaction has an <code className="font-mono text-xs text-primary">expires_at</code> timestamp. If the customer does not confirm the Mobile Money prompt before this time, the transaction transitions to <Badge color="orange">expired</Badge>.
              </p>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                {[{ val: 2, label: "Quick checkout" }, { val: 5, label: "Standard (default)" }, { val: 10, label: "Complex orders" }].map(({ val, label }) => (
                  <div key={val} className="p-4 rounded-xl border border-border bg-card text-center">
                    <p className="text-2xl font-bold text-primary mb-1">{val} min</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <CodeBlock lang="json" code={`// Initiate with custom expiry
{
  "expires_in_minutes": 2,  // 2, 5, or 10
  ...
}

// Response always includes expires_at in ISO 8601 UTC
{
  "expires_at": "2026-05-06T08:32:00.000Z",
  ...
}`} />
            </section>

            {/* Geo-Isolation */}
            <section id="geo" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Geo-Isolation</h2>
              <p className="text-muted-foreground mb-4">
                DrimPay enforces strict <strong className="text-foreground">country-level wallet isolation</strong>. Funds collected in one country cannot be withdrawn from a wallet in another country.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border mb-4">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Collection country</th>
                    <th className="text-left px-4 py-3 font-semibold">Credited to wallet</th>
                    <th className="text-left px-4 py-3 font-semibold">Can withdraw via</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["🇹🇬 Togo (TG)", "TG wallet (XOF)", "TMoney, Moov Money"],
                      ["🇧🇯 Bénin (BJ)", "BJ wallet (XOF)", "MTN MoMo, Moov Money"],
                      ["🇨🇲 Cameroun (CM)", "CM wallet (XAF)", "MTN MoMo, Orange Money"],
                      ["🇧🇫 Burkina Faso (BF)", "BF wallet (XOF)", "Orange Money, Moov Money"],
                      ["🇲🇱 Mali (ML)", "ML wallet (XOF)", "Orange Money, Moov Money"],
                      ["🇸🇳 Sénégal (SN)", "SN wallet (XOF)", "Wave, Orange Money, Wizall"],
                      ["🇨🇮 Côte d'Ivoire (CI)", "CI wallet (XOF)", "MTN MoMo, Orange Money, Wave"],
                    ].map(([country, wallet, withdraw]) => (
                      <tr key={country} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium">{country}</td>
                        <td className="px-4 py-3 text-muted-foreground">{wallet}</td>
                        <td className="px-4 py-3 text-muted-foreground">{withdraw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBlock lang="json" code={`// Trying to collect TG money into a BJ wallet → blocked
HTTP/1.1 403 Forbidden
{
  "error": "GEO_ISOLATION_VIOLATION",
  "message": "Funds collected in TG can only be managed from a TG wallet."
}`} />
            </section>

            {/* Polling Pattern */}
            <section id="polling" className="mb-14 scroll-mt-20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Polling Pattern</h2>
              <Alert type="warning" title="Poll from your backend, not the browser">
                Your frontend should poll <strong>your own backend endpoint</strong> (e.g. <code className="font-mono text-xs">/api/check-payment</code>), which in turn queries DrimPay. Never expose your DrimPay secret key to the browser.
              </Alert>
              <p className="text-muted-foreground mb-4">
                After initiating a payment, your frontend shows a waiting UI. Your backend polls <code className="font-mono text-xs text-primary">GET /v2/payin/{"{reference}"}</code> every 5 seconds until a terminal status is reached.
              </p>
              <div className="flex gap-2 mb-2">
                {LANGS.map(l => (
                  <button key={l} onClick={() => setLangTab(l)}
                    className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-all", langTab === l ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
              <CodeBlock lang={langTab} code={pollingExamples[langTab] ?? ""} />
              <h3 className="text-base font-semibold mb-3 mt-6">Customer UI States</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Show customer</th>
                    <th className="text-left px-4 py-3 font-semibold">Action</th>
                  </tr></thead>
                  <tbody>
                    {[
                      ["queued", "Paiement en file d'attente...", "Show spinner"],
                      ["pending", "Confirmez le paiement sur votre téléphone", "Show phone prompt UI"],
                      ["processing", "Paiement en cours de traitement...", "Show progress bar"],
                      ["success", "✓ Paiement confirmé", "Fulfill order, redirect"],
                      ["failed", "✗ Paiement échoué", "Show error, offer retry"],
                      ["expired", "⏱ Paiement expiré", "Offer to create new payment"],
                      ["cancelled", "Paiement annulé", "Offer to create new payment"],
                    ].map(([status, msg, action]) => (
                      <tr key={status} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3"><Badge color={status === "success" ? "green" : status === "pending" || status === "processing" ? "blue" : status === "expired" ? "orange" : "red"}>{status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{msg}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-border pt-8 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">DrimPay Pay-in API v2</p>
                <p className="text-xs text-muted-foreground mt-0.5">Questions? <a href="mailto:api@drimpay.africa" className="text-primary hover:underline">api@drimpay.africa</a></p>
              </div>
              <div className="flex gap-3">
                <Link href="/signup">
                  <button className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    Get API Key →
                  </button>
                </Link>
                <Link href="/docs/payout">
                  <button className="border border-border text-sm font-semibold px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-1.5">
                    Pay-out Docs <ArrowUpRight className="w-3.5 h-3.5" />
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
