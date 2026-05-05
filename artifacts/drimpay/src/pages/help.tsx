import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronDown, Search, Book, Code, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const faqs = [
  { q: "How long does KYB verification take?", a: "Standard KYB verification takes 48-72 business hours. Enterprise accounts with complete documentation are often reviewed within 24 hours. You will receive an email notification upon approval or if additional documents are required." },
  { q: "What currencies does DrimPay support?", a: "DrimPay supports XOF (West African CFA franc) for BCEAO zone countries (Togo, Benin, Burkina Faso, Mali, Senegal, Côte d'Ivoire) and XAF (Central African CFA franc) for Cameroon. All amounts should be submitted in the minor currency unit." },
  { q: "How do I test my integration without real money?", a: "DrimPay provides a full Sandbox environment accessible via sandbox.drimpay.io. Use test API keys (prefixed dp_test_) and reserved test phone numbers to simulate various payment outcomes including success, failure, and timeout scenarios." },
  { q: "What is the settlement timeline?", a: "Standard accounts settle T+1 (next business day). KYB-verified business accounts with good standing are eligible for T+0 (same-day) settlement. Enterprise accounts can negotiate real-time settlement for high-volume corridors." },
  { q: "Can I use DrimPay for recurring payments?", a: "DrimPay supports recurring charge patterns through our webhook system. You can initiate a new Payin request on your schedule and link them using customer identifiers. Native subscription billing is on our product roadmap for Q2 2025." },
  { q: "What happens if a payment fails?", a: "Failed payments are reported via webhook with an error code and message. DrimPay's fallback routing system automatically retries through alternative operators when available. You can also implement your own retry logic based on the error type." },
  { q: "How do I get notified of platform incidents?", a: "Subscribe to our status page at status.drimpay.io for real-time incident notifications via email, SMS, or webhook. Critical incidents are also announced on our official Twitter/X account." },
  { q: "What rate limits apply to the API?", a: "Starter accounts: 100 requests/min, 1,000/hour. Business accounts: 500 requests/min, 10,000/hour. Enterprise accounts have custom limits. Rate limit headers are included in every API response." },
];

const guides = [
  { title: "Getting Started with DrimPay", desc: "Complete walkthrough from account creation to your first successful transaction", href: "/blog/introduction-drimpay-api" },
  { title: "KYB Verification Guide", desc: "Step-by-step process for business verification and going live", href: "/businesses" },
  { title: "Webhook Integration Guide", desc: "Implement and secure webhooks for real-time payment notifications", href: "/blog/webhook-security" },
  { title: "Sandbox Testing Guide", desc: "Use our test environment to validate your integration before going live", href: "/blog/sandbox-testing-guide" },
];

const errors = [
  { code: "E001", name: "INVALID_PHONE", desc: "Phone number format is invalid. Use E.164 format with country code." },
  { code: "E002", name: "INSUFFICIENT_BALANCE", desc: "Wallet balance is insufficient for the requested payout amount." },
  { code: "E003", name: "OPERATOR_UNAVAILABLE", desc: "The selected operator is temporarily unavailable. Try again or use a different operator." },
  { code: "E004", name: "DUPLICATE_REFERENCE", desc: "A transaction with this reference already exists. Use a unique reference per request." },
  { code: "E005", name: "AMOUNT_BELOW_MIN", desc: "Transaction amount is below the minimum allowed for this operator." },
  { code: "E006", name: "KYB_REQUIRED", desc: "This feature requires a verified business account. Complete KYB to access it." },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How can we help?</h1>
          <p className="text-xl text-muted-foreground mb-8">Browse our guides, documentation, and FAQ to find answers quickly.</p>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search help articles..." className="pl-12 h-14 text-base" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-help" />
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Book, title: "User Guides", desc: "Step-by-step guides for merchants and businesses", href: "/businesses" },
            { icon: Code, title: "API Documentation", desc: "Complete API reference with code examples", href: "/docs" },
            { icon: AlertCircle, title: "Platform Status", desc: "Real-time status of all DrimPay services", href: "/status" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden" data-testid={`faq-${i}`}>
                <button className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">Getting Started Guides</h2>
            <div className="flex flex-col gap-4">
              {guides.map((guide, i) => (
                <Link key={i} href={guide.href}>
                  <div className="flex items-start justify-between p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
                    <div>
                      <h3 className="font-semibold mb-1">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground">{guide.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Common Error Codes</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {errors.map((error, i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-border last:border-0">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded h-fit shrink-0">{error.code}</code>
                  <div>
                    <p className="text-sm font-semibold font-mono mb-1">{error.name}</p>
                    <p className="text-xs text-muted-foreground">{error.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center rounded-2xl border border-border bg-card p-10">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-muted-foreground mb-8">Our support team is available Monday-Friday 8AM-8PM WAT. Enterprise customers have 24/7 support.</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">Contact Support <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
