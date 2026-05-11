import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Pricing() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">{t.pricing.badge}</div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.pricing.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55">{t.pricing.desc}</p>
          </motion.div>

          {/* ── PLANS ─────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {t.pricing.plans.map((plan, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } } }}
                className={`rounded-2xl p-8 border flex flex-col ${
                  i === 1
                    ? "border-[#B5F03C] bg-white shadow-xl"
                    : "border-[#E5E3DC] bg-white"
                }`}
              >
                {i === 1 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B5F03C]/20 text-[#3a7a00] text-xs font-semibold mb-4 w-fit">
                    <Zap className="w-3 h-3" /> {t.pricing.mostPopular}
                  </div>
                )}
                <h2 className="text-2xl font-extrabold mb-2 text-[#0f0f0f]">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-5xl font-extrabold text-[#0f0f0f]">3%</span>
                </div>
                <p className="text-sm text-[#0f0f0f]/45 mb-4">{plan.per}</p>
                <p className="text-[#0f0f0f]/55 mb-8 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#3a7a00] shrink-0 mt-0.5" />
                      <span className="text-[#0f0f0f]/60">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={i === 2 ? "/contact" : "/signup"}>
                  <button className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                    i === 1
                      ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 shadow-md"
                      : "border border-[#E5E3DC] bg-white text-[#0f0f0f] hover:shadow-md"
                  }`}>
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* ── FEE SCHEDULE ─────────────────────────────────────────── */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl font-extrabold mb-8 text-[#0f0f0f]">{t.pricing.feeScheduleTitle}</h2>
          <div className="rounded-2xl border border-[#E5E3DC] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F0E8] border-b border-[#E5E3DC]">
                  <th className="text-left px-6 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol1}</th>
                  <th className="text-left px-6 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol2}</th>
                  <th className="text-left px-6 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol3}</th>
                  <th className="text-left px-6 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol4}</th>
                </tr>
              </thead>
              <tbody>
                {t.pricing.feeRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#E5E3DC] last:border-0 hover:bg-[#F8F6F1] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0f0f0f]">{row.type}</td>
                    <td className="px-6 py-4 text-[#3a7a00] font-bold">{row.fee}</td>
                    <td className="px-6 py-4 text-[#0f0f0f]/55">{row.min}</td>
                    <td className="px-6 py-4 text-[#0f0f0f]/55">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── EXTRAS ───────────────────────────────────────────────── */}
      <div className="bg-[#F5F0E8] py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {t.pricing.extras.map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#E5E3DC] bg-white">
                <h3 className="font-extrabold text-lg mb-3 text-[#0f0f0f]">{item.title}</h3>
                <p className="text-[#0f0f0f]/55 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CUSTOM CTA ───────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-white">{t.pricing.customTitle}</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">{t.pricing.customDesc}</p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              {t.pricing.customBtn} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
