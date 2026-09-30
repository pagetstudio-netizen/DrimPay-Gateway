import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CheckCircle2, XCircle, ArrowRight, Zap, User,
  Building2, Globe, Shield, PhoneCall, TrendingUp, Star,
} from "lucide-react";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, faqSchema, SITE_URL } from "@/lib/seo";

type CountryRate = { countryCode: string; operator: string; payin: number; payout: number };
type PlatformFees = {
  countryRates: CountryRate[];
  defaultPayin: number | null;
  defaultPayout: number | null;
  loading: boolean;
  error: boolean;
};

function usePlatformFees() {
  const [fees, setFees] = useState<PlatformFees>({
    countryRates: [],
    defaultPayin: null,
    defaultPayout: null,
    loading: true,
    error: false,
  });
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const loadFees = async () => {
      controller?.abort();
      controller = new AbortController();
      const requestController = controller;
      setFees(current => ({ ...current, loading: current.defaultPayin === null, error: false }));

      try {
        const response = await fetch("/api/fees", {
          signal: requestController.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Fee schedule unavailable");
        const data = await response.json();
        if (
          !Array.isArray(data?.countryRates) ||
          !Number.isFinite(data?.payin) ||
          !Number.isFinite(data?.payout)
        ) {
          throw new Error("Invalid fee schedule");
        }
        const countryRates = data.countryRates.filter((rate: any) =>
          typeof rate?.countryCode === "string" &&
          typeof rate?.operator === "string" &&
          Number.isFinite(rate?.payin) &&
          Number.isFinite(rate?.payout)
        );
        if (active) {
          setFees({
            countryRates,
            defaultPayin: data.payin,
            defaultPayout: data.payout,
            loading: false,
            error: false,
          });
        }
      } catch (error: any) {
        if (active && error?.name !== "AbortError") {
          setFees(current => ({ ...current, loading: false, error: true }));
        }
      }
    };
    const refreshOnFocus = () => { void loadFees(); };
    const refreshWhenVisible = () => {
      if (!document.hidden) void loadFees();
    };

    void loadFees();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
  return fees;
}

function fmtRate(n: number, lang: string) {
  const s = Number.isInteger(n) ? `${n}` : n.toString();
  return lang === "fr" ? `${s.replace(".", ",")}%` : `${s}%`;
}

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const COUNTRY_NAMES: Record<string, { fr: string; en: string }> = {
  TG: { fr: "Togo", en: "Togo" },
  SN: { fr: "Sénégal", en: "Senegal" },
  ML: { fr: "Mali", en: "Mali" },
  CI: { fr: "Côte d’Ivoire", en: "Côte d’Ivoire" },
  BJ: { fr: "Bénin", en: "Benin" },
  BF: { fr: "Burkina Faso", en: "Burkina Faso" },
  CM: { fr: "Cameroun", en: "Cameroon" },
};

export default function Pricing() {
  const t = useT();
  const lang = useLang();
  const fees = usePlatformFees();
  const countrySummaries = ["TG", "SN", "ML"].map(code => {
    const rows = fees.countryRates.filter(rate => rate.countryCode.toUpperCase() === code);
    if (!rows.length) return null;
    const countryName = COUNTRY_NAMES[code]?.[lang === "fr" ? "fr" : "en"] ?? code;
    const pairs = [...new Set(rows.map(rate => `${fmtRate(rate.payin, lang)} Pay-in / ${fmtRate(rate.payout, lang)} Pay-out`))];
    return pairs.length === 1
      ? `${countryName}: ${pairs[0]}`
      : `${countryName}: ${lang === "fr" ? "taux variables selon l’opérateur" : "rates vary by operator"}`;
  }).filter((value): value is string => Boolean(value));
  const specialRateRows = fees.countryRates.filter(rate =>
    ["TG", "SN", "ML"].includes(rate.countryCode.toUpperCase())
  );
  const specialRatePairs = [...new Set(specialRateRows.map(rate =>
    `${fmtRate(rate.payin, lang)} Pay-in / ${fmtRate(rate.payout, lang)} Pay-out`
  ))];
  const allSpecialCountriesHaveRates = ["TG", "SN", "ML"].every(code =>
    specialRateRows.some(rate => rate.countryCode.toUpperCase() === code)
  );
  const specialRatesSummary = specialRatePairs.length === 1 && allSpecialCountriesHaveRates
    ? `${lang === "fr" ? "Togo, Sénégal et Mali" : "Togo, Senegal and Mali"}: ${specialRatePairs[0]}`
    : countrySummaries.join("; ");
  const ratesSummary = fees.defaultPayin !== null && fees.defaultPayout !== null
    ? [
        specialRatesSummary,
        lang === "fr"
          ? `Autres pays : ${fmtRate(fees.defaultPayin, lang)} au Pay-in et ${fmtRate(fees.defaultPayout, lang)} au Pay-out par défaut, avant toute règle spécifique de pays ou d’opérateur`
          : `Other countries: ${fmtRate(fees.defaultPayin, lang)} default for Pay-in and ${fmtRate(fees.defaultPayout, lang)} for Pay-out, before any country- or operator-specific rule`,
      ].join("; ")
    : fees.loading
      ? lang === "fr" ? "Chargement des tarifs actuellement configurés." : "Loading currently configured rates."
      : fees.error
        ? lang === "fr" ? "Les tarifs n’ont pas pu être chargés. Réessayez dans quelques instants." : "Rates could not be loaded. Please try again shortly."
        : lang === "fr" ? "Les tarifs actuels sont indiqués dans le tableau ci-dessous." : "Current rates are listed in the table below.";
  const pricingDescription = `${t.pricing.desc} ${ratesSummary}`;
  const feeDescription = lang === "fr"
    ? `${pricingDescription} Plafond journalier jusqu'à 2 000 000 XOF, selon les conditions applicables chez chaque opérateur.`
    : `${pricingDescription} Daily cap up to XOF 2,000,000, subject to each operator's applicable limits and terms.`;
  useSEO({
    title: lang === "fr"
      ? "Tarification DrimPay — frais Pay-in et Pay-out par pays et opérateur"
      : "DrimPay Pricing — Pay-in and Pay-out fees by country and operator",
    description: feeDescription,
    keywords: lang === "fr"
      ? "tarifs paiement Afrique, frais Mobile Money par pays et opérateur, Togo, Sénégal, Mali, Pay-in, Pay-out"
      : "Africa payment pricing, Mobile Money fees by country and operator, Togo, Senegal, Mali, Pay-in, Pay-out",
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/pricing`,
        lang === "fr" ? "Tarification DrimPay" : "DrimPay Pricing",
        feeDescription,
        [{ name: lang === "fr" ? "Tarification" : "Pricing", url: `${SITE_URL}/${lang}/pricing` }],
      ),
      faqSchema(lang === "fr" ? [
        { question: "Comment sont calculés les frais DrimPay ?", answer: `Les frais Pay-in et Pay-out dépendent du pays et de l'opérateur. ${ratesSummary}. Les tarifs marchands personnalisés restent prioritaires.` },
        { question: "Les frais sont-ils les mêmes pour chaque opérateur ?", answer: "Non. Le taux effectif est publié par pays et opérateur; le tarif marchand personnalisé, s’il existe, peut le remplacer." },
        { question: "Pourquoi le Payout n'est-il pas disponible pour les particuliers ?", answer: "Le Payout (décaissement) est réservé aux comptes entreprise vérifiés (KYB). Les particuliers peuvent uniquement encaisser des paiements via le Payin." },
        { question: "Y a-t-il un abonnement mensuel ?", answer: "Non. DrimPay fonctionne sur un modèle pay-as-you-go. Vous payez uniquement sur les transactions réussies." },
        { question: "DrimPay est-il disponible en mode sandbox ?", answer: "Oui. Chaque compte DrimPay inclut un environnement sandbox complet pour tester vos intégrations sans argent réel." },
      ] : [
        { question: "How are DrimPay fees calculated?", answer: `Pay-in and Pay-out fees depend on the selected country and operator. ${ratesSummary}. Account-specific merchant rates take priority.` },
        { question: "Are fees the same for every operator?", answer: "No. The effective rate is published by country and operator; an account-specific merchant rate may replace it." },
        { question: "Why is Payout not available for personal accounts?", answer: "Payout (disbursement) is reserved for KYB-verified business accounts. Personal accounts can only collect payments via Payin." },
        { question: "Is there a monthly subscription?", answer: "No. DrimPay operates on a pay-as-you-go model. You only pay on successful transactions." },
        { question: "Is sandbox mode available?", answer: "Yes. Every DrimPay account includes a full sandbox environment for testing integrations without real money." },
      ]),
    ],
  });

  const p = t.pricing.personal;
  const b = t.pricing.businessCard;

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
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{pricingDescription}</p>
          </motion.div>
        </div>
      </div>

      {/* ── TWO CARDS ─────────────────────────────────────────────── */}
      <div className="pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">

            {/* Personal Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } } }}
              className="rounded-2xl border border-[#E5E3DC] bg-white p-8 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xl text-[#0f0f0f]">{p.name}</p>
                    <p className="text-xs text-[#0f0f0f]/45 mt-0.5">{p.per}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-500/20">
                  <Star className="w-3 h-3" /> {p.badge}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-5xl font-extrabold text-[#0f0f0f]">{p.rate}</span>
                <span className="text-[#0f0f0f]/40 text-sm ml-2">{p.per}</span>
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Zap className="w-3 h-3" /> {p.negotiable}
                </span>
              </div>

              <p className="text-[#0f0f0f]/55 text-sm leading-relaxed mb-6">{p.desc}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f, i) => {
                  const isRestriction = f.toLowerCase().includes("payout non disponible") || f.toLowerCase().includes("payout not available");
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {isRestriction
                        ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        : <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      }
                      <span className={isRestriction ? "text-[#0f0f0f]/40" : "text-[#0f0f0f]/60"}>{f}</span>
                    </li>
                  );
                })}
              </ul>

              <Link href="/signup">
                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border border-[#E5E3DC] bg-white text-[#0f0f0f] hover:shadow-md transition-all">
                  <User className="w-4 h-4" />
                  {p.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Business Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } } }}
              className="rounded-2xl border border-[#B5F03C] bg-white p-8 flex flex-col relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#B5F03C]/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B5F03C]/20 text-[#3a7a00] text-xs font-semibold mb-4 w-fit border border-[#B5F03C]/30">
                <Zap className="w-3 h-3" /> {b.badge}
              </div>

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#B5F03C]/15 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-[#3a7a00]" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xl text-[#0f0f0f]">{b.name}</p>
                    <p className="text-xs text-[#0f0f0f]/45 mt-0.5">{b.per}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#0f0f0f]">{b.rate}</span>
                <span className="text-[#0f0f0f]/40 text-sm ml-2">{b.per}</span>
              </div>

              <p className="text-[#0f0f0f]/55 text-sm leading-relaxed mb-6">{b.desc}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {b.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#3a7a00] shrink-0" />
                    <span className="text-[#0f0f0f]/60">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                  <Building2 className="w-4 h-4" />
                  {b.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

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
                  <th className="text-left px-5 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol1}</th>
                  <th className="text-left px-5 py-4 font-extrabold text-[#0f0f0f]">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      {t.pricing.feeCol2}
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 font-extrabold text-[#0f0f0f]">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#3a7a00]" />
                      {t.pricing.feeCol2b}
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol3}</th>
                  <th className="text-left px-5 py-4 font-extrabold text-[#0f0f0f]">{t.pricing.feeCol4}</th>
                </tr>
              </thead>
              <tbody>
                {t.pricing.feeRows.map((row, i) => {
                  const routeBasedFee = lang === "fr" ? "Voir le tableau par pays" : "See country table";
                  const feePersonal = i < 2 ? routeBasedFee : row.feePersonal;
                  const feeBusiness = i < 2 ? routeBasedFee : row.feeBusiness;
                  return (
                  <tr key={i} className="border-b border-[#E5E3DC] last:border-0 hover:bg-[#F8F6F1] transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#0f0f0f]">{row.type}</td>
                    <td className="px-5 py-4">
                      {feePersonal === "—" ? (
                        <span className="text-[#0f0f0f]/30">—</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold border border-blue-500/20">
                          {feePersonal}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {feeBusiness === "—" ? (
                        <span className="text-[#0f0f0f]/30">—</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#B5F03C]/15 text-[#3a7a00] text-xs font-bold border border-[#B5F03C]/20">
                          {feeBusiness}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#0f0f0f]/55">{row.min}</td>
                    <td className="px-5 py-4 text-[#0f0f0f]/55">{row.max}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#0f0f0f]/45 italic px-1">{t.pricing.feeNote}</p>
          <div className="mt-12">
            <h3 className="text-xl font-extrabold text-[#0f0f0f] mb-2">{lang === "fr" ? "Tarifs par pays et opérateur" : "Fees by country and operator"}</h3>
            <p className="text-sm text-[#0f0f0f]/55 mb-5">{lang === "fr" ? "Les taux ci-dessous sont les tarifs plateforme publiés. Un éventuel tarif marchand personnalisé reste prioritaire." : "These are the published platform rates. Any account-specific merchant rate takes priority."}</p>
            {fees.countryRates.length ? (
              <div className="rounded-2xl border border-[#E5E3DC] overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead><tr className="bg-[#F5F0E8] border-b border-[#E5E3DC]">
                    <th className="text-left px-5 py-3">{lang === "fr" ? "Pays" : "Country"}</th><th className="text-left px-5 py-3">{lang === "fr" ? "Opérateur" : "Operator"}</th><th className="text-left px-5 py-3">Pay-in</th><th className="text-left px-5 py-3">Pay-out</th>
                  </tr></thead>
                  <tbody>{fees.countryRates.map((r, i) => <tr key={`${r.countryCode}-${r.operator}-${i}`} className="border-b border-[#E5E3DC] last:border-0">
                    <td className="px-5 py-3 font-semibold">{r.countryCode}</td><td className="px-5 py-3">{r.operator}</td><td className="px-5 py-3 font-bold">{fmtRate(r.payin, lang)}</td><td className="px-5 py-3 font-bold">{fmtRate(r.payout, lang)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            ) : fees.loading ? (
              <p className="text-sm text-[#0f0f0f]/45 italic">{lang === "fr" ? "Chargement des tarifs…" : "Loading rates…"}</p>
            ) : fees.error ? (
              <p role="alert" className="text-sm text-red-600">{lang === "fr" ? "Impossible de charger le barème. Réessayez plus tard." : "Unable to load the fee schedule. Please try again later."}</p>
            ) : (
              <p className="text-sm text-[#0f0f0f]/45 italic">{lang === "fr" ? "Aucun opérateur actif n’est publié pour le moment." : "No active operators are published yet."}</p>
            )}
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
