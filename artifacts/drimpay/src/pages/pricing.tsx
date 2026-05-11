import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CheckCircle2, ArrowRight, Zap, User, Rocket, TrendingUp,
  Building2, Globe, Shield, PhoneCall, Star,
} from "lucide-react";
import { useT } from "@/lib/i18n";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const planIcons = [Rocket, TrendingUp, Building2];
const planColors = [
  { icon: "text-blue-500", iconBg: "bg-blue-500/10", border: "border-[#E5E3DC]", shadow: "" },
  { icon: "text-[#3a7a00]", iconBg: "bg-[#B5F03C]/15", border: "border-[#B5F03C]", shadow: "shadow-xl" },
  { icon: "text-purple-500", iconBg: "bg-purple-500/10", border: "border-[#E5E3DC]", shadow: "" },
];

export default function Pricing() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">
              <Zap className="w-3 h-3" /> {t.pricing.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.pricing.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.pricing.desc}</p>
          </motion.div>
        </div>
      </div>

      {/* ── PERSONAL SECTION ─────────────────────────────────────── */}
      <div className="pb-6">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: 0.1 } } }} className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-lg font-extrabold text-[#0f0f0f]">{t.pricing.personalLabel}</span>
            </div>
            <div className="flex-1 h-px bg-[#E5E3DC]" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } } }}
            className="max-w-lg mx-auto"
          >
            <div className="rounded-2xl border border-[#E5E3DC] bg-white p-8 flex flex-col relative overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xl text-[#0f0f0f]">{t.pricing.personal.name}</p>
                    <p className="text-xs text-[#0f0f0f]/45 mt-0.5">{t.pricing.personal.per}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-500/20">
                  <Star className="w-3 h-3" /> {t.pricing.personal.badge}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-5xl font-extrabold text-[#0f0f0f]">3%</span>
                <span className="text-[#0f0f0f]/40 text-sm ml-2">{t.pricing.personal.per}</span>
              </div>

              <p className="text-[#0f0f0f]/55 text-sm leading-relaxed mb-6">{t.pricing.personal.desc}</p>

              <ul className="grid grid-cols-2 gap-2.5 mb-8">
                {t.pricing.personal.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[#0f0f0f]/60">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                  <User className="w-4 h-4" />
                  {t.pricing.personal.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── BUSINESS SECTION ─────────────────────────────────────── */}
      <div className="pt-12 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.5, delay: 0.2 } } }} className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B5F03C]/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#3a7a00]" />
              </div>
              <span className="text-lg font-extrabold text-[#0f0f0f]">{t.pricing.businessLabel}</span>
            </div>
            <div className="flex-1 h-px bg-[#E5E3DC]" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {t.pricing.plans.map((plan, i) => {
              const Icon = planIcons[i];
              const colors = planColors[i];
              const isPopular = i === 1;
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 + i * 0.08 } } }}
                  className={`rounded-2xl p-8 border flex flex-col relative overflow-hidden ${colors.border} ${colors.shadow} bg-white`}
                >
                  {/* Decorative blob */}
                  <div className={`absolute top-0 right-0 w-36 h-36 rounded-full ${colors.iconBg} -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none`} />

                  {isPopular && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B5F03C]/20 text-[#3a7a00] text-xs font-semibold mb-4 w-fit border border-[#B5F03C]/30">
                      <Zap className="w-3 h-3" /> {t.pricing.mostPopular}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-11 h-11 rounded-2xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <h2 className="text-xl font-extrabold text-[#0f0f0f]">{plan.name}</h2>
                  </div>

                  <div className="mb-1">
                    <span className="text-4xl font-extrabold text-[#0f0f0f]">{i === 2 ? "—" : "3%"}</span>
                  </div>
                  <p className="text-xs text-[#0f0f0f]/40 mb-4">{plan.per}</p>
                  <p className="text-[#0f0f0f]/55 text-sm leading-relaxed mb-7">{plan.desc}</p>

                  <ul className="space-y-2.5 mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 ${colors.icon} shrink-0 mt-0.5`} />
                        <span className="text-[#0f0f0f]/60">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={i === 2 ? "/contact" : "/signup"}>
                    <button className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                      isPopular
                        ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 shadow-md"
                        : i === 2
                        ? "bg-purple-500/10 text-purple-700 border border-purple-500/20 hover:bg-purple-500/20"
                        : "border border-[#E5E3DC] bg-white text-[#0f0f0f] hover:shadow-md"
                    }`}>
                      {i === 2 ? <PhoneCall className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FEE SCHEDULE ─────────────────────────────────────────── */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#0f0f0f]/5 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#0f0f0f]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0f0f0f]">{t.pricing.feeScheduleTitle}</h2>
          </div>
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
                    <td className="px-6 py-4 font-bold">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B5F03C]/15 text-[#3a7a00] text-xs font-bold border border-[#B5F03C]/20">
                        {row.fee}
                      </span>
                    </td>
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
            {t.pricing.extras.map((item, i) => {
              const ExtraIcon = [TrendingUp, Shield, Zap][i];
              return (
                <div key={i} className="p-6 rounded-2xl border border-[#E5E3DC] bg-white">
                  <div className="w-10 h-10 rounded-xl bg-[#B5F03C]/15 flex items-center justify-center mb-4">
                    <ExtraIcon className="w-5 h-5 text-[#3a7a00]" />
                  </div>
                  <h3 className="font-extrabold text-lg mb-3 text-[#0f0f0f]">{item.title}</h3>
                  <p className="text-[#0f0f0f]/55 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CUSTOM CTA ───────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <PhoneCall className="w-6 h-6 text-[#B5F03C]" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4 text-white">{t.pricing.customTitle}</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">{t.pricing.customDesc}</p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              <PhoneCall className="w-4 h-4" />
              {t.pricing.customBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
