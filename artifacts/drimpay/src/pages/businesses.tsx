import { motion } from "framer-motion";
import { Link } from "wouter";
import { Building2, CheckCircle2, FileText, Clock, ArrowRight, Star } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function Businesses() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">
              <Building2 className="w-3 h-3" /> {t.businesses.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.businesses.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.businesses.desc}</p>
          </motion.div>

          {/* ── PROCESS STEPS ───────────────────────────────────────── */}
          <div className="mb-24">
            <h2 className="text-2xl font-extrabold mb-12 text-[#0f0f0f]">{t.businesses.processTitle}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.businesses.steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} className="relative bg-white rounded-2xl p-6 border border-[#E5E3DC]">
                  <div className="text-6xl font-extrabold text-[#B5F03C] mb-4 leading-none">{step.step}</div>
                  <h3 className="font-extrabold text-lg mb-3 text-[#0f0f0f]">{step.title}</h3>
                  <p className="text-sm text-[#0f0f0f]/55 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── DOCS + BENEFITS ──────────────────────────────────────── */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-extrabold mb-8 text-[#0f0f0f]">{t.businesses.docsTitle}</h2>
              <div className="flex flex-col gap-4">
                {t.businesses.docs.map((doc, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-[#E5E3DC] bg-[#F8F6F1]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${doc.required ? "bg-[#B5F03C]/30" : "bg-[#F5F0E8]"}`}>
                      <FileText className={`w-3 h-3 ${doc.required ? "text-[#3a7a00]" : "text-[#0f0f0f]/40"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-[#0f0f0f]">{doc.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${doc.required ? "bg-[#B5F03C]/20 text-[#3a7a00]" : "bg-[#F5F0E8] text-[#0f0f0f]/45"}`}>
                          {doc.required ? t.businesses.required : t.businesses.optional}
                        </span>
                      </div>
                      <p className="text-xs text-[#0f0f0f]/50">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold mb-8 text-[#0f0f0f]">{t.businesses.benefitsTitle}</h2>
              <div className="p-8 rounded-2xl border border-[#B5F03C]/40 bg-[#B5F03C]/8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-[#3a7a00]" />
                  <h3 className="font-extrabold text-lg text-[#0f0f0f]">{t.businesses.verifiedAccount}</h3>
                </div>
                <ul className="space-y-4">
                  {t.businesses.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[#0f0f0f]">
                      <CheckCircle2 className="w-4 h-4 text-[#3a7a00] shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E3DC] bg-[#F8F6F1]">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-[#0f0f0f]/40" />
                  <h3 className="font-semibold text-[#0f0f0f]">{t.businesses.timelineTitle}</h3>
                </div>
                <p className="text-sm text-[#0f0f0f]/55 leading-relaxed">{t.businesses.timelineDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-white">{t.businesses.ctaTitle}</h2>
          <p className="text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">{t.businesses.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
                {t.businesses.ctaBtn1} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 transition-all">
                {t.businesses.ctaBtn2}
              </button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
