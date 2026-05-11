import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Lock, Eye, AlertTriangle, FileText, Server, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

const fadeUp = (delay = 0) => ({ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } } });
const pillarIcons = [Lock, Shield, Eye, AlertTriangle, FileText, Server];

export default function Security() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp()} className="max-w-2xl mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">
              <Shield className="w-3 h-3" /> {t.security.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.security.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.security.desc}</p>
          </motion.div>

          {/* ── PILLARS ─────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {t.security.pillars.map((pillar, i) => {
              const Icon = pillarIcons[i];
              return (
                <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp(i * 0.08)}
                  className="p-8 rounded-2xl border border-[#E5E3DC] bg-white shadow-sm hover:border-[#B5F03C]/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#B5F03C]/20 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-[#3a7a00]" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-[#0f0f0f]">{pillar.title}</h3>
                  <p className="text-[#0f0f0f]/55 leading-relaxed text-sm">{pillar.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── WEBHOOK CODE ─────────────────────────────────────────── */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl font-extrabold mb-4 text-[#0f0f0f]">{t.security.webhookTitle}</h2>
          <p className="text-[#0f0f0f]/55 mb-8 max-w-xl">{t.security.webhookDesc}</p>
          <div className="rounded-xl overflow-hidden border border-[#E5E3DC] bg-[#0d1117] shadow-2xl">
            <div className="flex items-center px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
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
      </div>

      {/* ── CERTIFICATIONS ───────────────────────────────────────── */}
      <div className="bg-[#F5F0E8] py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl font-extrabold mb-8 text-[#0f0f0f]">{t.security.certsTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.security.certs.map((cert, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-xl border border-[#E5E3DC] bg-white">
                <div className="w-10 h-10 rounded-lg bg-[#B5F03C]/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#3a7a00]" />
                </div>
                <div>
                  <h3 className="font-extrabold mb-1 text-[#0f0f0f]">{cert.name}</h3>
                  <p className="text-sm text-[#0f0f0f]/55">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INCIDENT CTA ─────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl font-extrabold mb-4 text-white">{t.security.incidentTitle}</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">{t.security.incidentDesc}</p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              {t.security.reportBtn} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
