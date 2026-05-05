import { motion } from "framer-motion";
import { Link } from "wouter";
import { Code, Key, Zap, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const tabs = ["curl", "node", "python"];

const codeExamples: Record<string, string> = {
  curl: `curl -X POST https://api.drimpay.io/v1/payin \\
  -H "Authorization: Bearer dp_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "XOF",
    "country": "TG",
    "operator": "tmoney",
    "phone": "+22890123456",
    "reference": "ORDER-001",
    "webhook_url": "https://yourapp.com/hooks"
  }'`,
  node: `const drimpay = require('drimpay-node');
const client = new drimpay.Client(process.env.DRIMPAY_SECRET_KEY);

const payment = await client.payin.create({
  amount: 5000,
  currency: 'XOF',
  country: 'TG',
  operator: 'tmoney',
  phone: '+22890123456',
  reference: 'ORDER-001',
  webhookUrl: 'https://yourapp.com/hooks'
});

console.log(payment.id);     // pay_01abc123...
console.log(payment.status); // 'pending'`,
  python: `import drimpay

client = drimpay.Client(api_key=os.environ['DRIMPAY_SECRET_KEY'])

payment = client.payin.create(
    amount=5000,
    currency='XOF',
    country='TG',
    operator='tmoney',
    phone='+22890123456',
    reference='ORDER-001',
    webhook_url='https://yourapp.com/hooks'
)

print(payment.id)       # pay_01abc123...
print(payment.status)   # pending`,
};

const endpoints = [
  { method: "POST", path: "/v1/payin", desc: "Initiate a payment collection" },
  { method: "POST", path: "/v1/payout", desc: "Disburse funds to a mobile wallet" },
  { method: "GET", path: "/v1/transactions/{id}", desc: "Retrieve a transaction by ID" },
  { method: "GET", path: "/v1/transactions", desc: "List all transactions with filters" },
  { method: "GET", path: "/v1/wallets", desc: "Get wallet balances by country" },
  { method: "POST", path: "/v1/api-keys", desc: "Generate a new API key" },
  { method: "DELETE", path: "/v1/api-keys/{id}", desc: "Revoke an existing API key" },
  { method: "GET", path: "/v1/status", desc: "Check API health and uptime" },
];

const methodColor: Record<string, string> = {
  GET: "text-blue-400 bg-blue-400/10",
  POST: "text-green-400 bg-green-400/10",
  DELETE: "text-red-400 bg-red-400/10",
};

export default function ApiOverview() {
  const [activeTab, setActiveTab] = useState("curl");

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">
            <Code className="w-3 h-3 text-primary" /> API Reference
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Powerful. Predictable. RESTful.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">The DrimPay API is designed to be intuitive for developers. RESTful conventions, consistent error codes, and comprehensive SDKs for all major languages.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Key, title: "API Key Auth", desc: "Authenticate every request with a Bearer token. Keys are environment-scoped (live/sandbox) and can be rotated any time from the developer portal." },
            { icon: Zap, title: "Idempotency", desc: "Pass an Idempotency-Key header to safely retry requests. DrimPay guarantees exactly-once processing — no duplicate charges." },
            { icon: Lock, title: "Webhook Security", desc: "Every webhook is signed with HMAC-SHA256. Verify the X-DrimPay-Signature header before processing any event notification." },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-20 items-start">
          <div>
            <h2 className="text-2xl font-bold mb-6">Core Endpoints</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {endpoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${methodColor[ep.method]}`}>{ep.method}</span>
                  <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                  <span className="text-xs text-muted-foreground hidden md:block">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Example Request</h2>
            <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117] shadow-2xl">
              <div className="flex items-center gap-4 px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#ff5f56]" /><div className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><div className="w-3 h-3 rounded-full bg-[#27c93f]" /></div>
                <div className="flex gap-3 ml-4">
                  {tabs.map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} data-testid={`tab-${t}`}
                      className={`text-xs font-mono px-3 py-1 rounded transition-colors ${activeTab === t ? "bg-primary/20 text-primary" : "text-[#8b949e] hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="p-6 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {codeExamples[activeTab]}
              </pre>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to dive deeper?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">The full API documentation covers every endpoint, parameter, error code, and webhook event. Start with the sandbox — no real money required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs"><Button size="lg" className="text-primary-foreground font-semibold">Full Documentation <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
            <Link href="/developer-portal"><Button size="lg" variant="outline">Get API Key</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
