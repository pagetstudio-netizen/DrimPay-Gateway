import { motion } from "framer-motion";
import { Link } from "wouter";
import { Building2, CheckCircle2, FileText, Clock, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { step: "01", title: "Create Business Account", desc: "Register with your business email and create a secure password. Initial access is granted immediately for sandbox testing." },
  { step: "02", title: "Submit KYB Documents", desc: "Upload your business registration certificate, tax ID, authorized representative ID, and proof of address through the secure portal." },
  { step: "03", title: "Compliance Review", desc: "Our compliance team reviews your submission within 48-72 business hours. We may request additional documents if needed." },
  { step: "04", title: "Approval & Activation", desc: "Once approved, your account is upgraded to production. Transaction limits are activated and live API keys are generated." },
];

const docs = [
  { name: "Business Registration Certificate", desc: "Official government-issued registration document (RCCM, RC, etc.)", required: true },
  { name: "Tax Identification Number", desc: "NIF, TIN, or equivalent tax registration proof", required: true },
  { name: "Authorized Representative ID", desc: "National ID, passport, or driver's license of signatory", required: true },
  { name: "Proof of Business Address", desc: "Utility bill or bank statement dated within 3 months", required: true },
  { name: "Company Bank Account Details", desc: "Bank statement or RIB showing company account", required: true },
  { name: "License (if regulated activity)", desc: "Financial institution license, if applicable to your business model", required: false },
];

const benefits = [
  "Production API access with live keys",
  "Transaction limits up to XOF 5,000,000 per transfer",
  "Multi-country wallet access",
  "Bulk payout API for payroll",
  "Priority customer support",
  "Custom webhook configurations",
  "Detailed transaction reporting",
  "API usage analytics dashboard",
];

export default function Businesses() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">
            <Building2 className="w-3 h-3 text-primary" /> KYB Verification
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for serious businesses.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">DrimPay is a regulated payment infrastructure. Business verification ensures compliance, increases transaction limits, and unlocks the full API feature set.</p>
        </motion.div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-12">Registration process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{step.step}</div>
                <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-24">
          <div>
            <h2 className="text-2xl font-bold mb-8">Required documents</h2>
            <div className="flex flex-col gap-4">
              {docs.map((doc, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${doc.required ? "bg-primary/20" : "bg-secondary"}`}>
                    <FileText className={`w-3 h-3 ${doc.required ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{doc.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${doc.required ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {doc.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-8">Verified business benefits</h2>
            <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-lg">Verified Business Account</h3>
              </div>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Verification Timeline</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Standard review: 48-72 business hours. Expedited review (Enterprise): 24 hours. All submissions reviewed by our certified compliance officers.</p>
            </div>
          </div>
        </div>

        <div className="text-center rounded-2xl bg-primary/10 border border-primary/20 p-12">
          <h2 className="text-3xl font-bold mb-4">Start your KYB application</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Create your business account and begin the verification process. Sandbox access is immediate — start building while we review your documents.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="text-primary-foreground font-semibold">Register Business <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
            <Link href="/contact"><Button size="lg" variant="outline">Talk to Compliance Team</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
