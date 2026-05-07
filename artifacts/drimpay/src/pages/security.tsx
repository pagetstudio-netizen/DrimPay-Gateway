import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Lock, Eye, AlertTriangle, FileText, Server, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const fadeUp = (delay = 0) => ({ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } } });

const pillarIcons = [Lock, Shield, Eye, AlertTriangle, FileText, Server];

export default function Security() {
  const t = useT();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp()} className="max-w-2xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">
            <Shield className="w-3 h-3 text-primary" /> {t.security.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.security.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{t.security.desc}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {t.security.pillars.map((pillar, i) => {
            const Icon = pillarIcons[i];
            return (
              <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp(i * 0.08)} className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{pillar.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-4">{t.security.webhookTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl">{t.security.webhookDesc}</p>
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
          <h2 className="text-2xl font-bold mb-8">{t.security.certsTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.security.certs.map((cert, i) => (
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
          <h2 className="text-2xl font-bold mb-4">{t.security.incidentTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t.security.incidentDesc}</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">{t.security.reportBtn} <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
