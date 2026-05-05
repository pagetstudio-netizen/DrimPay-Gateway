import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const plans = [
  {
    name: "Starter",
    price: "3%",
    per: "per successful transaction",
    desc: "Perfect for startups and small businesses getting started with digital payments.",
    features: [
      "Payin API access",
      "Payout API access",
      "2 countries included",
      "100 API requests/min",
      "Sandbox environment",
      "Email support",
      "Standard webhooks",
      "T+1 settlement",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Business",
    price: "3%",
    per: "per transaction + volume discount",
    desc: "For growing businesses that need multi-country coverage and priority support.",
    features: [
      "Everything in Starter",
      "All 7 countries",
      "500 API requests/min",
      "Priority support (24h)",
      "Bulk payout API",
      "Virtual card requests",
      "Airtime top-up API",
      "Advanced analytics dashboard",
      "Custom webhook retry policy",
      "T+0 settlement (verified)",
    ],
    cta: "Start Building",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "negotiated per volume",
    desc: "For large platforms processing high volumes with custom infrastructure needs.",
    features: [
      "Everything in Business",
      "Custom rate negotiation",
      "Unlimited API requests",
      "Dedicated account manager",
      "SLA guarantees (99.9%)",
      "Custom integration support",
      "White-label options",
      "On-premise deployment (POA)",
      "Regulatory compliance reports",
      "Instant settlement",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const feeTable = [
  { type: "Payin (Mobile Money)", fee: "3%", min: "XOF 50", max: "XOF 5,000,000" },
  { type: "Payout (Mobile Money)", fee: "3%", min: "XOF 50", max: "XOF 5,000,000" },
  { type: "Bulk Payout (>100 transfers)", fee: "2.5%", min: "—", max: "Unlimited" },
  { type: "API Calls (within plan limit)", fee: "Free", min: "—", max: "—" },
  { type: "Webhook Retries", fee: "Free", min: "—", max: "—" },
  { type: "Virtual Card Issuance", fee: "XOF 200/card", min: "—", max: "—" },
  { type: "Airtime Top-up", fee: "1.5%", min: "XOF 100", max: "XOF 100,000" },
];

export default function Pricing() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">Transparent Pricing</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Simple, predictable fees</h1>
          <p className="text-xl text-muted-foreground">No hidden charges. No monthly minimums. Pay only for what you process. Volume discounts apply automatically as you grow.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } } }}
              className={`rounded-2xl p-8 border flex flex-col ${plan.highlight ? "border-primary bg-primary/5 shadow-[0_0_60px_rgba(197,255,74,0.08)]" : "border-border bg-card"}`}
            >
              {plan.highlight && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 w-fit">
                  <Zap className="w-3 h-3" /> Most Popular
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-2">
                <span className="text-5xl font-bold">{plan.price}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{plan.per}</p>
              <p className="text-muted-foreground mb-8 leading-relaxed">{plan.desc}</p>
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                <Button size="lg" variant={plan.highlight ? "default" : "outline"} className={`w-full font-semibold ${plan.highlight ? "text-primary-foreground" : ""}`}>
                  {plan.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">Full fee schedule</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm" data-testid="fee-table">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left px-6 py-4 font-semibold">Transaction Type</th>
                  <th className="text-left px-6 py-4 font-semibold">Fee</th>
                  <th className="text-left px-6 py-4 font-semibold">Minimum</th>
                  <th className="text-left px-6 py-4 font-semibold">Maximum</th>
                </tr>
              </thead>
              <tbody>
                {feeTable.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{row.type}</td>
                    <td className="px-6 py-4 text-primary font-semibold">{row.fee}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.min}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { title: "Volume Discounts", desc: "Process more than $100K/month? Your effective rate drops automatically. Reach $1M/month and unlock enterprise pricing starting at 2%." },
            { title: "No Monthly Minimums", desc: "We don't charge you to exist on the platform. If you don't process a transaction, you pay nothing. Start building with zero upfront cost." },
            { title: "Instant Settlement", desc: "Verified business accounts enjoy same-day settlement. Standard accounts settle T+1. Enterprise agreements support real-time settlement for high-frequency corridors." },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-bold text-lg mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center rounded-2xl border border-border bg-card p-12">
          <h2 className="text-2xl font-bold mb-4">Need a custom deal?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Processing over $500K/month? Contact our sales team for a tailored pricing structure designed around your volume and corridors.</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">Talk to Sales <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
