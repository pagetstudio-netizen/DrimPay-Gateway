import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Zap, Building2, Code, Wallet } from "lucide-react";
import { useT } from "@/lib/i18n";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center font-bold text-sm shrink-0">{num}</div>
        <div className="w-px flex-1 bg-[#E5E3DC] mt-3" />
      </div>
      <div className="pb-10">
        <h3 className="font-extrabold text-lg mb-2 text-[#0f0f0f]">{title}</h3>
        <p className="text-[#0f0f0f]/55 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const t = useT();
  const systemIcons = [Wallet, Building2, Code];

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">{t.hiw.badge}</div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.hiw.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.hiw.desc}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-24">
            <div className="bg-white rounded-3xl p-10 border border-[#E5E3DC] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#B5F03C]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#3a7a00]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#0f0f0f]">{t.hiw.payinTitle}</h2>
              </div>
              <p className="text-[#0f0f0f]/55 mb-8 leading-relaxed">{t.hiw.payinDesc}</p>
              {t.hiw.payinSteps.map((s, i) => (
                <Step key={i} num={`0${i + 1}`} title={s.title} desc={s.desc} />
              ))}
            </div>

            <div className="bg-white rounded-3xl p-10 border border-[#E5E3DC] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#0f0f0f]/6 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#0f0f0f]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#0f0f0f]">{t.hiw.payoutTitle}</h2>
              </div>
              <p className="text-[#0f0f0f]/55 mb-8 leading-relaxed">{t.hiw.payoutDesc}</p>
              {t.hiw.payoutSteps.map((s, i) => (
                <Step key={i} num={`0${i + 1}`} title={s.title} desc={s.desc} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SYSTEMS ─────────────────────────────────────────────── */}
      <div className="bg-[#F5F0E8] py-24">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f0f0f] mb-12 tracking-tight">
            {t.hiw.systemsTitle ?? "Infrastructure de confiance"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.hiw.systems.map((item, i) => {
              const Icon = systemIcons[i];
              return (
                <div key={i} className="p-8 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#B5F03C]/20 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-[#3a7a00]" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-[#0f0f0f]">{item.title}</h3>
                  <p className="text-[#0f0f0f]/55 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">{t.hiw.ctaTitle}</h2>
          <p className="text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">{t.hiw.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
                {t.hiw.ctaBtn1} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/docs">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 transition-all">
                {t.hiw.ctaBtn2}
              </button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
