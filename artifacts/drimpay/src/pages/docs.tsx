import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Code } from "lucide-react";

type Section = { id: string; title: string; method?: string; path?: string; desc: string; request?: string; response?: string };

const sections: Section[] = [
  {
    id: "payin",
    title: "Payin API",
    method: "POST",
    path: "/v1/payin",
    desc: "Initiate a mobile money payment collection from a customer. Returns a transaction object with status 'pending'. Monitor status changes via webhooks.",
    request: `{
  "amount": 5000,
  "currency": "XOF",
  "country": "TG",
  "operator": "tmoney",
  "phone": "+22890123456",
  "reference": "ORDER-001",
  "webhook_url": "https://yourapp.com/webhooks",
  "metadata": {
    "customer_id": "cust_123",
    "order_id": "order_456"
  }
}`,
    response: `{
  "id": "pay_01abc123def456",
  "status": "pending",
  "amount": 5000,
  "currency": "XOF",
  "country": "TG",
  "operator": "tmoney",
  "phone": "+22890123456",
  "reference": "ORDER-001",
  "fee": 150,
  "net_amount": 4850,
  "created_at": "2024-05-01T10:00:00Z"
}`,
  },
  {
    id: "payout",
    title: "Payout API",
    method: "POST",
    path: "/v1/payout",
    desc: "Disburse funds from your wallet to a recipient's mobile money account. Requires sufficient wallet balance in the target country.",
    request: `{
  "amount": 10000,
  "currency": "XOF",
  "country": "BJ",
  "operator": "mtn",
  "phone": "+22997123456",
  "reference": "PAYOUT-001",
  "description": "Salary payment - May 2024"
}`,
    response: `{
  "id": "pay_out_01xyz789",
  "status": "processing",
  "amount": 10000,
  "currency": "XOF",
  "country": "BJ",
  "operator": "mtn",
  "phone": "+22997123456",
  "reference": "PAYOUT-001",
  "fee": 300,
  "created_at": "2024-05-01T11:00:00Z"
}`,
  },
  {
    id: "status",
    title: "Status API",
    method: "GET",
    path: "/v1/transactions/{id}",
    desc: "Retrieve the current status and full details of any transaction by its ID. Use this to poll status or verify webhook data.",
    request: `GET /v1/transactions/pay_01abc123def456
Authorization: Bearer dp_live_xxxxxxxxxxxx`,
    response: `{
  "id": "pay_01abc123def456",
  "type": "payin",
  "status": "success",
  "amount": 5000,
  "currency": "XOF",
  "country": "TG",
  "operator": "tmoney",
  "phone": "+22890123456",
  "reference": "ORDER-001",
  "fee": 150,
  "net_amount": 4850,
  "operator_reference": "TMONEY-REF-98765",
  "created_at": "2024-05-01T10:00:00Z",
  "updated_at": "2024-05-01T10:02:35Z"
}`,
  },
  {
    id: "webhook",
    title: "Webhook Events",
    desc: "DrimPay sends signed POST requests to your webhook URL on every transaction state change. Always verify the signature before processing.",
    request: `// Webhook payload example
{
  "event": "transaction.success",
  "data": {
    "id": "pay_01abc123def456",
    "type": "payin",
    "status": "success",
    "amount": 5000,
    "currency": "XOF",
    "reference": "ORDER-001"
  },
  "created_at": "2024-05-01T10:02:35Z"
}`,
    response: `// Verify signature
const crypto = require('crypto');

const expected = crypto
  .createHmac('sha256', DRIMPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(req.headers['x-drimpay-signature']),
  Buffer.from(expected)
);`,
  },
];

const nav = ["payin", "payout", "status", "webhook"];

const methodColor: Record<string, string> = {
  GET: "text-blue-400 bg-blue-400/10",
  POST: "text-green-400 bg-green-400/10",
};

export default function Docs() {
  const [active, setActive] = useState("payin");

  const section = sections.find((s) => s.id === active)!;

  return (
    <div className="pt-20 min-h-screen">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card h-screen sticky top-20 pt-8 pb-8 overflow-y-auto">
          <div className="px-6 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">API Documentation</p>
          </div>
          {nav.map((id) => {
            const s = sections.find((x) => x.id === id)!;
            return (
              <button key={id} onClick={() => setActive(id)} data-testid={`nav-${id}`}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors text-left w-full ${active === id ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <ChevronRight className="w-4 h-4 shrink-0" />
                {s.title}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 p-8 lg:p-12 max-w-4xl">
          <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">{section.title}</h1>
                {section.method && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${methodColor[section.method]}`}>{section.method}</span>
                    <code className="text-sm font-mono text-muted-foreground">{section.path}</code>
                  </div>
                )}
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">{section.desc}</p>
            </div>

            {section.request && (
              <div className="mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Code className="w-4 h-4 text-primary" /> {section.id === "webhook" ? "Webhook Payload" : section.method === "GET" ? "Request" : "Request Body"}</h3>
                <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117]">
                  <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                    <div className="flex gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" /><div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" /><div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" /></div>
                    <span className="text-xs text-[#8b949e] font-mono ml-2">{section.id === "webhook" ? "webhook.json" : "request.json"}</span>
                  </div>
                  <pre className="p-6 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto">{section.request}</pre>
                </div>
              </div>
            )}

            {section.response && (
              <div className="mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Code className="w-4 h-4 text-primary" /> {section.id === "webhook" ? "Signature Verification" : "Response"}</h3>
                <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117]">
                  <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                    <div className="flex gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" /><div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" /><div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" /></div>
                    <span className="text-xs text-[#8b949e] font-mono ml-2">{section.id === "webhook" ? "verify.js" : "response.json"}</span>
                  </div>
                  <pre className="p-6 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto">{section.response}</pre>
                </div>
              </div>
            )}

            <div className="lg:hidden grid grid-cols-2 gap-3 mt-8">
              {nav.filter((id) => id !== active).map((id) => {
                const s = sections.find((x) => x.id === id)!;
                return (
                  <button key={id} onClick={() => setActive(id)} className="p-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 transition-colors">
                    <p className="font-semibold text-sm">{s.title}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
