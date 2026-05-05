import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Key, Copy, RefreshCw, ArrowRight, CheckCircle2, Code, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function generateFakeKey(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix + "_";
  for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export default function DeveloperPortal() {
  const [sandboxKey, setSandboxKey] = useState(generateFakeKey("dp_test"));
  const [copied, setCopied] = useState(false);
  const [activeEnv, setActiveEnv] = useState<"sandbox" | "live">("sandbox");

  const handleCopy = () => {
    navigator.clipboard.writeText(sandboxKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setSandboxKey(generateFakeKey(activeEnv === "sandbox" ? "dp_test" : "dp_live"));
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">
            <Code className="w-3 h-3 text-primary" /> Developer Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Build with DrimPay.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">Generate API keys, test in sandbox mode, and explore endpoints — all before you process a single real transaction.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">API Key Generator</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 ml-auto">Demo Mode</span>
              </div>

              <div className="flex gap-3 mb-6">
                {(["sandbox", "live"] as const).map((env) => (
                  <button key={env} onClick={() => { setActiveEnv(env); setSandboxKey(generateFakeKey(env === "sandbox" ? "dp_test" : "dp_live")); }}
                    data-testid={`env-${env}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeEnv === env ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {env === "sandbox" ? "Sandbox" : "Live"} Environment
                  </button>
                ))}
              </div>

              {activeEnv === "live" && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 mb-6 text-sm text-yellow-400">
                  Live API keys require a completed KYB verification. <Link href="/businesses" className="underline">Complete verification</Link> to activate live mode.
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border font-mono text-sm overflow-hidden">
                  <span className="text-primary text-xs shrink-0">SECRET KEY</span>
                  <span className="text-muted-foreground flex-1 truncate" data-testid="api-key-display">{sandboxKey}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleCopy} data-testid="copy-key" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={handleRegenerate} data-testid="regen-key" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">This is a demo key. Create a real account to get your actual API credentials.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="text-xl font-bold mb-6">Test Endpoints</h2>
              <div className="flex flex-col gap-3">
                {[
                  { method: "POST", path: "/v1/payin", desc: "Test payment collection" },
                  { method: "POST", path: "/v1/payout", desc: "Test fund disbursement" },
                  { method: "GET", path: "/v1/transactions", desc: "List test transactions" },
                  { method: "GET", path: "/v1/wallets", desc: "Check sandbox wallet balances" },
                  { method: "GET", path: "/v1/status", desc: "API health check" },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/30 transition-colors">
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${ep.method === "GET" ? "text-blue-400 bg-blue-400/10" : "text-green-400 bg-green-400/10"}`}>{ep.method}</span>
                    <code className="text-sm font-mono flex-1">{ep.path}</code>
                    <span className="text-xs text-muted-foreground hidden md:block">{ep.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/docs"><Button variant="outline" className="w-full">View Full API Reference <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="font-bold mb-4">Sandbox Features</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Full API feature parity",
                  "Test phone numbers for all outcomes",
                  "No real money movement",
                  "Instant webhook simulation",
                  "Mock wallet balances",
                  "Error scenario testing",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold mb-3">Quick Start</h3>
              <p className="text-sm text-muted-foreground mb-4">Get your first payment working in under 5 minutes with our step-by-step guide.</p>
              <Link href="/blog/introduction-drimpay-api"><Button variant="outline" size="sm" className="w-full">Getting Started Guide</Button></Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold mb-4">Test Phone Numbers</h3>
              <div className="flex flex-col gap-3 text-xs font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">+22890000001</span><span className="text-green-400">Always succeeds</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">+22890000002</span><span className="text-red-400">Fails (insufficient)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">+22890000003</span><span className="text-yellow-400">Always times out</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">+22890000004</span><span className="text-blue-400">Pending → Success</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
