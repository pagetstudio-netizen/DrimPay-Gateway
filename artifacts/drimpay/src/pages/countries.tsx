import { useState } from "react";
import { motion } from "framer-motion";
import { useListSupportedCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2, XCircle, Globe, Zap, Shield,
  ChevronRight, MapPin, TrendingUp, Wifi, Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, organizationSchema, SITE_URL } from "@/lib/seo";

/* ── animation helpers ──────────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const scaleUp = { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1 } };
const viewport = { once: true, margin: "-60px" };

/* ── operator type → color pill ─────────────────────────────────────────── */
function getOperatorPill(type: string, active: boolean) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border";
  if (!active) return `${base} bg-[#f5f0e8] text-[#0f0f0f]/30 border-[#e5e3dc]`;
  const lower = type.toLowerCase();
  if (lower.includes("wave") || lower.includes("wallet")) return `${base} bg-blue-50 text-blue-600 border-blue-200`;
  if (lower.includes("orange")) return `${base} bg-orange-50 text-orange-600 border-orange-200`;
  if (lower.includes("mtn")) return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
  if (lower.includes("moov") || lower.includes("airtel")) return `${base} bg-sky-50 text-sky-600 border-sky-200`;
  if (lower.includes("tmoney") || lower.includes("t-money")) return `${base} bg-red-50 text-red-600 border-red-200`;
  if (lower.includes("mobile money")) return `${base} bg-[#B5F03C]/20 text-[#3a7a00] border-[#B5F03C]/40`;
  return `${base} bg-[#f0ede6] text-[#0f0f0f]/60 border-[#e5e3dc]`;
}

/* ── operator logo dot ──────────────────────────────────────────────────── */
function OperatorDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-emerald-400" : "bg-[#0f0f0f]/15"}`} />
  );
}

/* ── filter tab ─────────────────────────────────────────────────────────── */
function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-[#0f0f0f] text-white shadow-sm"
          : "bg-white border border-[#e5e3dc] text-[#0f0f0f]/60 hover:border-[#0f0f0f]/30 hover:text-[#0f0f0f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ── zone icons ─────────────────────────────────────────────────────────── */
const ZONE_ICONS = [
  <Globe key="g" className="w-5 h-5 text-[#3a7a00]" />,
  <Shield key="s" className="w-5 h-5 text-[#3a7a00]" />,
  <TrendingUp key="t" className="w-5 h-5 text-[#3a7a00]" />,
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function Countries() {
  const { data: countries, isLoading } = useListSupportedCountries();
  const t = useT();
  const lang = useLang();
  const [filter, setFilter] = useState<"all" | "payin" | "payout">("all");

  useSEO({
    title: lang === "fr"
      ? "Pays & Opérateurs Couverts — Togo, Bénin, Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso"
      : "Covered Countries & Operators — Togo, Benin, Senegal, Ivory Coast, Cameroon, Mali, Burkina Faso",
    description: lang === "fr"
      ? "DrimPay couvre 7 pays d'Afrique de l'Ouest et Centrale avec 20+ opérateurs Mobile Money (Orange Money, Wave, MTN MoMo, Moov, TMoney). Zones BCEAO et BEAC intégrées."
      : "DrimPay covers 7 West & Central African countries with 20+ Mobile Money operators (Orange Money, Wave, MTN MoMo, Moov, TMoney). BCEAO and BEAC zones integrated.",
    keywords: lang === "fr"
      ? "pays paiement Afrique, Orange Money Togo, Wave Sénégal, MTN Cameroun, Moov Bénin, TMoney, couverture BCEAO BEAC"
      : "Africa payment countries, Orange Money, Wave Senegal, MTN Cameroon, BCEAO BEAC coverage",
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/countries`,
        lang === "fr" ? "Pays & Opérateurs couverts par DrimPay" : "Countries & Operators covered by DrimPay",
        lang === "fr" ? "Liste des pays et opérateurs Mobile Money intégrés." : "List of integrated countries and Mobile Money operators.",
        [{ name: lang === "fr" ? "Pays" : "Countries", url: `${SITE_URL}/${lang}/countries` }],
      ),
      {
        "@type": "Service",
        name: "DrimPay Mobile Money API",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: ["Togo", "Bénin", "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso"].map(n => ({ "@type": "Country", name: n })),
        serviceType: "Mobile Money Payment Gateway",
      },
    ],
  });

  const filtered = (countries ?? []).filter((c) => {
    if (filter === "payin") return c.payinEnabled;
    if (filter === "payout") return c.payoutEnabled;
    return true;
  });

  const totalOperators = (countries ?? []).reduce((acc, c) => acc + (c.operators?.length ?? 0), 0);

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="pt-24 md:pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mb-14"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6"
            >
              <MapPin className="w-3.5 h-3.5 text-[#3a7a00]" />
              <span className="text-xs font-semibold text-[#3a7a00]">{t.countries.badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mb-5 text-[#0f0f0f] leading-[1.02] max-w-3xl"
            >
              {t.countries.title}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55 }}
              className="text-lg text-[#0f0f0f]/55 leading-relaxed max-w-2xl"
            >
              {t.countries.desc}
            </motion.p>
          </motion.div>

          {/* ── STATS ROW ─────────────────────────────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12"
          >
            {[
              { value: countries?.length ?? "7", label: "Pays actifs", icon: <MapPin className="w-4 h-4" /> },
              { value: totalOperators > 0 ? `${totalOperators}+` : "20+", label: "Opérateurs intégrés", icon: <Wifi className="w-4 h-4" /> },
              { value: "2", label: "Zones monétaires", icon: <Globe className="w-4 h-4" />, hideMobile: true },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={scaleUp}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`p-5 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm ${stat.hideMobile ? "hidden sm:flex" : "flex"} flex-col gap-1`}
              >
                <div className="flex items-center gap-2 text-[#B5F03C] mb-1">{stat.icon}</div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0f0f0f]">{stat.value}</p>
                <p className="text-xs text-[#0f0f0f]/50 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── FILTER TABS ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex items-center gap-2 flex-wrap mb-8"
          >
            <Filter className="w-4 h-4 text-[#0f0f0f]/40 mr-1 flex-shrink-0" />
            <FilterTab label="Tous les pays" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterTab label="Encaissement actif" active={filter === "payin"} onClick={() => setFilter("payin")} />
            <FilterTab label="Décaissement actif" active={filter === "payout"} onClick={() => setFilter("payout")} />
          </motion.div>

          {/* ── COUNTRY GRID ─────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl bg-[#E5E3DC]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 mb-20">
              <Globe className="w-12 h-12 text-[#0f0f0f]/15 mb-4" />
              <p className="text-[#0f0f0f]/40 font-semibold">Aucun pays pour ce filtre</p>
            </div>
          ) : (
            <motion.div
              key={filter}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20"
            >
              {filtered.map((country, i) => (
                <motion.div
                  key={country.code}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group bg-white rounded-2xl border border-[#E5E3DC] hover:border-[#B5F03C]/50 hover:shadow-md transition-all overflow-hidden"
                  data-testid={`country-card-${country.code}`}
                >
                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <span className="text-4xl leading-none flex-shrink-0">{country.flag}</span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-lg text-[#0f0f0f] leading-tight">{country.name}</h3>
                      <p className="text-sm text-[#0f0f0f]/40 font-medium mt-0.5">
                        {country.currency} <span className="mx-1 opacity-40">·</span> {country.code}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-6 h-px bg-[#F0EDE6]" />

                  {/* Capability badges */}
                  <div className="px-6 py-4 flex gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      country.payinEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[#f5f5f5] text-[#0f0f0f]/30 border-[#e5e3dc]"
                    }`}>
                      {country.payinEnabled
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />}
                      {t.countries.payin}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      country.payoutEnabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[#f5f5f5] text-[#0f0f0f]/30 border-[#e5e3dc]"
                    }`}>
                      {country.payoutEnabled
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />}
                      {t.countries.payout}
                    </span>
                  </div>

                  {/* Operators */}
                  {(country.operators ?? []).length > 0 && (
                    <div className="px-6 pb-6">
                      <p className="text-[10px] font-bold text-[#0f0f0f]/30 uppercase tracking-widest mb-3">
                        {t.countries.operators}
                      </p>
                      <div className="flex flex-col gap-2">
                        {(country.operators ?? []).map((op, j) => (
                          <div key={j} className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <OperatorDot active={op.active} />
                              <span className={`text-sm font-semibold truncate ${op.active ? "text-[#0f0f0f]" : "text-[#0f0f0f]/35"}`}>
                                {op.name}
                              </span>
                            </div>
                            <span className={getOperatorPill(op.type, op.active)}>
                              {op.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── ZONES ─────────────────────────────────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16"
          >
            {t.countries.zones.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-[#E5E3DC] bg-white group hover:border-[#B5F03C]/50 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[#B5F03C]/15 flex items-center justify-center mb-4 group-hover:bg-[#B5F03C]/25 transition-colors">
                  {ZONE_ICONS[i]}
                </div>
                <h3 className="font-extrabold text-base mb-2 text-[#0f0f0f]">{item.title}</h3>
                <p className="text-[#0f0f0f]/55 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ── DARK CTA ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-[#B5F03C] text-xs font-bold uppercase tracking-widest mb-3">
                Expansion continue
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white leading-tight">
                {t.countries.noCountryTitle}
              </h2>
              <p className="text-white/50 leading-relaxed text-sm sm:text-base">
                {t.countries.noCountryDesc}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-bold text-sm shadow-lg hover:bg-[#c8ff55] transition-colors"
                >
                  {t.countries.contactUs} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Créer un compte <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
