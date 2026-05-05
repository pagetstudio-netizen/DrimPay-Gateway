import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Lock, Eye, AlertTriangle, FileText, Server, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = (delay = 0) => ({ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } } });

const pillars = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "All data in transit is encrypted using TLS 1.3. Sensitive data at rest uses AES-256 encryption. API keys and secrets are stored as one-way hashes — we cannot retrieve them, only you can.",
  },
  {
    icon: Shield,
    title: "API Key Protection",
    desc: "API keys are scoped per environment and can be restricted by IP address and HTTP method. Keys can be rotated instantly from the developer portal without downtime.",
  },
  {
    icon: Eye,
    title: "Fraud Detection Engine",
    desc: "Every transaction passes through our real-time fraud scoring system. Suspicious patterns trigger automatic holds and alerts. Velocity limits, geo-blocking, and device fingerprinting are built in.",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    desc: "ML-based anomaly detection monitors transaction patterns 24/7. Deviations from normal behavior trigger automated risk controls and human review for high-value transactions.",
  },
  {
    icon: FileText,
    title: "Audit Logs",
    desc: "Every API call, authentication event, and administrative action is logged with a tamper-evident audit trail. Logs are retained for 7 years in compliance with regulatory requirements.",
  },
  {
    icon: Server,
    title: "Infrastructure Security",
    desc: "DrimPay infrastructure runs on SOC 2 Type II certified cloud providers with multi-region redundancy. Network segmentation, WAF, and DDoS protection are deployed at every layer.",
  },
];

const certifications = [
  { name: "PCI DSS Level 1", desc: "The highest level of payment card security certification" },
  { name: "ISO 27001", desc: "Information security management system standard" },
  { name: "SOC 2 Type II", desc: "Security, availability, and confidentiality controls" },
  { name: "BCEAO Compliant", desc: "Meets West African Central Bank regulatory requirements" },
];

export default function Security() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp()} className="max-w-2xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">
            <Shield className="w-3 h-3 text-primary" /> Security First
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for the paranoid.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">DrimPay treats security as infrastructure, not a feature. Every layer of our stack is designed to protect your funds and your customers' data.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {pillars.map((pillar, i) => (
            <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp(i * 0.08)} className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <pillar.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-4">Webhook Signature Verification</h2>
          <p className="text-muted-foreground mb-8 max-w-xl">Every webhook request is signed with HMAC-SHA256 using your webhook secret. Always verify the signature before processing.</p>
          <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117] shadow-2xl">
            <div className="flex items-center px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
              <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#ff5f56]" /><div className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><div className="w-3 h-3 rounded-full bg-[#27c93f]" /></div>
              <div className="mx-auto text-xs text-[#8b949e] font-mono">webhook-handler.js</div>
            </div>
            <pre className="p-6 text-sm font-mono text-[#c9d1d9] leading-relaxed overflow-x-auto">
{`const crypto = require('crypto');

app.post('/webhooks/drimpay', (req, res) => {
  const signature = req.headers['x-drimpay-signature'];
  const payload = JSON.stringify(req.body);
  
  const expected = crypto
    .createHmac('sha256', process.env.DRIMPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )) {
    return res.status(401).send('Invalid signature');
  }

  // Process the verified webhook event
  const { event, data } = req.body;
  handleDrimPayEvent(event, data);
  res.status(200).send('OK');
});`}
            </pre>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-8">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center rounded-2xl border border-border bg-card p-12">
          <h2 className="text-2xl font-bold mb-4">Security incident? Contact us immediately.</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Our security team operates 24/7. Report vulnerabilities through our responsible disclosure program. We respond within 4 hours.</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">Report an Issue <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
