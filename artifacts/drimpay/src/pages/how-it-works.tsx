import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowDown, CheckCircle2, Zap, Shield, Building2, Code, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{num}</div>
        <div className="w-px flex-1 bg-border mt-3" />
      </div>
      <div className="pb-10">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">Platform Architecture</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">How DrimPay works</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">One API surface. Multiple payment corridors. Intelligent routing to maximize success rates across every operator.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-20 mb-24">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div>
              <h2 className="text-2xl font-bold">Payin Flow</h2>
            </div>
            <p className="text-muted-foreground mb-8">Collect payments from customers via mobile money across 7 countries. DrimPay handles operator routing, confirmation, and settlement automatically.</p>
            <Step num="01" title="Initiate Payin Request" desc="Your backend calls POST /v1/payin with amount, currency, country, operator, and customer phone number." />
            <Step num="02" title="DrimPay Routes the Request" desc="Our system selects the optimal operator API based on success rate, latency, and fallback priority." />
            <Step num="03" title="Customer Confirms" desc="The customer receives a mobile prompt from their operator (TMoney, MTN, Orange, etc.) and enters their PIN." />
            <Step num="04" title="Webhook Notification" desc="DrimPay sends a signed webhook to your endpoint with the final transaction status in real time." />
            <Step num="05" title="Funds in Your Wallet" desc="Successful funds land in your DrimPay country wallet, available for payout or settlement." />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-primary" /></div>
              <h2 className="text-2xl font-bold">Payout Flow</h2>
            </div>
            <p className="text-muted-foreground mb-8">Disburse funds to any mobile money wallet instantly. Ideal for payroll, agent commissions, refunds, and peer-to-peer transfers.</p>
            <Step num="01" title="Initiate Payout Request" desc="Call POST /v1/payout with recipient phone, amount, and country. Include a unique reference for idempotency." />
            <Step num="02" title="Balance Verification" desc="DrimPay verifies your wallet has sufficient balance in the target country currency before routing." />
            <Step num="03" title="Operator Dispatch" desc="Funds are dispatched to the recipient's mobile wallet via the selected operator's API." />
            <Step num="04" title="Delivery Confirmation" desc="The recipient receives a notification from their mobile operator confirming the credit." />
            <Step num="05" title="Webhook & Ledger Update" desc="Your system is notified via webhook and your wallet balance is updated in the ledger." />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: Wallet, title: "Wallet System", desc: "Each business has isolated wallets per country (wallet_TG, wallet_BJ, wallet_CI, etc.). Funds are segregated by currency and jurisdiction, ensuring regulatory compliance and clear accounting." },
            { icon: Building2, title: "KYB System", desc: "Businesses submit registration documents through the portal. Our compliance team verifies within 48 hours. Verified businesses unlock higher limits, faster settlement, and premium API features." },
            { icon: Code, title: "API System", desc: "Every DrimPay feature is accessible via REST API. API keys are scoped per environment (live/sandbox), rotatable at any time, and protected by rate limiting and IP allowlisting." }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to integrate?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Start with our sandbox environment — no real money, full feature parity. Your first API call in under 5 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="text-primary-foreground font-semibold">Get API Key <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
            <Link href="/docs"><Button size="lg" variant="outline">Read Documentation</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
