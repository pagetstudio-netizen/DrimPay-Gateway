import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, BookOpen, Shield, Zap, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";
import apiIcon from "@assets/6213702_1778508885407.png";

const commonIcons = [Shield, Globe, Zap, BookOpen];

export default function Docs() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1] min-h-screen">
      <div className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── HEADER ──────────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm flex items-center justify-center">
                <img src={apiIcon} alt="API" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0f0f0f]/35">{t.docs.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tighter text-[#0f0f0f]">{t.docs.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 mb-14 max-w-2xl leading-relaxed">{t.docs.desc}</p>

            {/* ── PAYIN / PAYOUT CARDS ────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              <Link href="/docs/payin">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-2xl border border-[#E5E3DC] bg-white p-8 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5">
                      <ArrowDownLeft className="w-6 h-6 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-2 text-[#0f0f0f]">{t.docs.payinTitle}</h2>
                    <p className="text-[#0f0f0f]/55 mb-6 leading-relaxed">{t.docs.payinDesc}</p>
                    <ul className="space-y-2 mb-6">
                      {t.docs.payinFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#0f0f0f]/55">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-500 group-hover:gap-3 transition-all">
                      {t.docs.payinLink} <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/docs/payout">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-2xl border border-[#E5E3DC] bg-white p-8 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-100 transition-colors" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-5">
                      <ArrowUpRight className="w-6 h-6 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-2 text-[#0f0f0f]">{t.docs.payoutTitle}</h2>
                    <p className="text-[#0f0f0f]/55 mb-6 leading-relaxed">{t.docs.payoutDesc}</p>
                    <ul className="space-y-2 mb-6">
                      {t.docs.payoutFeatures.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#0f0f0f]/55">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-500 group-hover:gap-3 transition-all">
                      {t.docs.payoutLink} <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>

            {/* ── COMMON CONCEPTS ─────────────────────────────────── */}
            <div className="border-t border-[#E5E3DC] pt-12">
              <h3 className="text-lg font-extrabold mb-6 text-[#0f0f0f]">{t.docs.commonTitle}</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {t.docs.common.map(({ title, desc }, i) => {
                  const Icon = commonIcons[i];
                  return (
                    <div key={title} className="p-5 rounded-xl border border-[#E5E3DC] bg-white hover:border-[#B5F03C]/40 transition-colors">
                      <Icon className="w-5 h-5 text-[#3a7a00] mb-3" />
                      <p className="font-extrabold text-sm mb-1 text-[#0f0f0f]">{title}</p>
                      <p className="text-xs text-[#0f0f0f]/50">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
