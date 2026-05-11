import { motion } from "framer-motion";
import { useListSupportedCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

export default function Countries() {
  const { data: countries, isLoading } = useListSupportedCountries();
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">{t.countries.badge}</div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.countries.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.countries.desc}</p>
          </motion.div>

          {/* ── COUNTRY GRID ──────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-[#E5E3DC]" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {(countries ?? []).map((country, i) => (
                <motion.div
                  key={country.code}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="p-8 rounded-2xl border border-[#E5E3DC] bg-white hover:border-[#B5F03C]/50 hover:shadow-md transition-all"
                  data-testid={`country-card-${country.code}`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <h3 className="font-extrabold text-lg text-[#0f0f0f]">{country.name}</h3>
                      <p className="text-sm text-[#0f0f0f]/45">{country.currency} · {country.code}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6 flex-wrap">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${country.payinEnabled ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                      {country.payinEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {t.countries.payin}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${country.payoutEnabled ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                      {country.payoutEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {t.countries.payout}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#0f0f0f]/35 uppercase tracking-widest mb-3">{t.countries.operators}</p>
                    <div className="flex flex-col gap-2">
                      {(country.operators ?? []).map((op, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#0f0f0f]">{op.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#0f0f0f]/40">{op.type}</span>
                            <div className={`w-2 h-2 rounded-full ${op.active ? "bg-green-400" : "bg-red-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── ZONES ─────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {t.countries.zones.map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-[#E5E3DC] bg-white">
                <h3 className="font-extrabold text-lg mb-3 text-[#0f0f0f]">{item.title}</h3>
                <p className="text-[#0f0f0f]/55 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl font-extrabold mb-4 text-white">{t.countries.noCountryTitle}</h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">{t.countries.noCountryDesc}</p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              {t.countries.contactUs} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
