import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Search, ChevronDown, ArrowRight, ChevronRight,
  Code2, ArrowDownLeft, ArrowUpRight, Wallet,
  ShieldCheck, CreditCard, Zap, Receipt,
  BookOpen, MessageCircle, Phone, Clock,
  CheckCircle2, AlertCircle, FileText, Globe,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DATA                                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  {
    icon: Code2,
    color: "#5B5EF5",
    bg: "#EEF0FE",
    title: "Intégration API",
    desc: "Authentification, clés API, SDKs, requêtes et réponses.",
    count: 18,
    href: "/docs",
  },
  {
    icon: ArrowDownLeft,
    color: "#16a34a",
    bg: "#DCFCE7",
    title: "Pay-in & Encaissements",
    desc: "Initiez des collectes, suivez les statuts et gérez les retours.",
    count: 14,
    href: "/docs/payin",
  },
  {
    icon: ArrowUpRight,
    color: "#ea580c",
    bg: "#FFEDD5",
    title: "Pay-out & Décaissements",
    desc: "Envoyez des fonds, mass payout et gestion des bénéficiaires.",
    count: 12,
    href: "/docs/payout",
  },
  {
    icon: Wallet,
    color: "#0891b2",
    bg: "#CFFAFE",
    title: "Wallets & Soldes",
    desc: "Wallets par pays, consultez vos soldes et historique de transactions.",
    count: 9,
    href: "/dashboard",
  },
  {
    icon: ShieldCheck,
    color: "#7c3aed",
    bg: "#EDE9FE",
    title: "KYB & Vérification",
    desc: "Vérification d'entreprise, documents requis et mise en production.",
    count: 8,
    href: "/businesses",
  },
  {
    icon: CreditCard,
    color: "#be185d",
    bg: "#FCE7F3",
    title: "Cartes Virtuelles",
    desc: "Émission de cartes Visa/Mastercard, limites et gestion.",
    count: 7,
    href: "/dashboard",
  },
  {
    icon: Zap,
    color: "#d97706",
    bg: "#FEF3C7",
    title: "Webhooks & Événements",
    desc: "Configurez, sécurisez et déboguez vos webhooks en temps réel.",
    count: 11,
    href: "/docs",
  },
  {
    icon: Receipt,
    color: "#059669",
    bg: "#D1FAE5",
    title: "Facturation & Tarifs",
    desc: "Frais de transaction, règlement, remises volume et factures.",
    count: 6,
    href: "/pricing",
  },
];

const POPULAR_ARTICLES = [
  { icon: BookOpen,      label: "Guide",  title: "Faire votre premier appel API en 5 minutes",         href: "/docs" },
  { icon: ShieldCheck,   label: "KYB",    title: "Documents requis pour la vérification KYB",           href: "/businesses" },
  { icon: Zap,           label: "Webhook", title: "Sécuriser vos webhooks avec la signature HMAC",      href: "/docs" },
  { icon: Globe,         label: "Pays",   title: "Opérateurs mobile money supportés par pays",          href: "/countries" },
  { icon: Code2,         label: "API",    title: "Gestion des erreurs et stratégies de retry",          href: "/docs/payin" },
  { icon: ArrowUpRight,  label: "Payout", title: "Initier un Mass Payout vers plusieurs bénéficiaires", href: "/docs/payout" },
];

const FAQS = [
  {
    q: "Combien de temps prend la vérification KYB ?",
    a: "La vérification KYB standard prend 48-72 heures ouvrées. Les comptes Enterprise avec une documentation complète sont souvent examinés sous 24 heures. Vous recevrez une notification par email lors de l'approbation ou si des documents supplémentaires sont requis.",
  },
  {
    q: "Quelles devises DrimPay supporte-t-il ?",
    a: "DrimPay supporte le XOF (franc CFA ouest-africain) pour les pays de la zone BCEAO (Togo, Bénin, Burkina Faso, Mali, Sénégal, Côte d'Ivoire) et le XAF (franc CFA d'Afrique centrale) pour le Cameroun. Tous les montants doivent être soumis en unité monétaire mineure.",
  },
  {
    q: "Comment tester mon intégration sans argent réel ?",
    a: "DrimPay fournit un environnement Sandbox complet. Utilisez des clés API de test (préfixe dp_test_) et des numéros de téléphone de test réservés pour simuler divers résultats de paiement incluant succès, échec et timeout.",
  },
  {
    q: "Quel est le délai de règlement ?",
    a: "Les comptes standard règlent en T+1 (jour ouvré suivant). Les comptes professionnels vérifiés KYB en bonne standing sont éligibles au règlement T+0 (même jour). Les comptes Enterprise peuvent négocier un règlement en temps réel pour les corridors à fort volume.",
  },
  {
    q: "Que se passe-t-il si un paiement échoue ?",
    a: "Les paiements échoués sont signalés via webhook avec un code et message d'erreur. Le système de routage de secours de DrimPay réessaie automatiquement via des opérateurs alternatifs lorsque disponible. Vous pouvez également implémenter votre propre logique de retry selon le type d'erreur.",
  },
  {
    q: "Quelles limites de débit s'appliquent à l'API ?",
    a: "Comptes Starter : 100 requêtes/min, 1 000/heure. Comptes Business : 500 requêtes/min, 10 000/heure. Les comptes Enterprise ont des limites personnalisées. Les en-têtes de limite de débit sont inclus dans chaque réponse API.",
  },
];

const STATUS_ITEMS = [
  { name: "API Pay-in",        ok: true },
  { name: "API Pay-out",       ok: true },
  { name: "Webhooks",          ok: true },
  { name: "Tableau de bord",   ok: true },
  { name: "Authentification",  ok: true },
];

/* ══════════════════════════════════════════════════════════════════════════ */
/*  ANIMATION HELPERS                                                          */
/* ══════════════════════════════════════════════════════════════════════════ */
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const viewport = { once: true, margin: "-60px" };

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PAGE                                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function Help() {
  const [search, setSearch]   = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredArticles = POPULAR_ARTICLES.filter(
    (a) =>
      !search || a.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-[#F8F6F1] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[#B5F03C]/15 text-[#B5F03C] text-xs font-semibold tracking-wider uppercase mb-5">
              Centre d'aide
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              Comment pouvons-nous<br />vous aider ?
            </h1>
            <p className="text-white/50 mb-8 text-base">
              Guides, documentation API et réponses à vos questions.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un article, une erreur, un endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-[#B5F03C]/50 focus:bg-white/10 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs font-medium"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {["Authentification API", "Webhooks", "KYB", "Pay-in", "Sandbox"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-white/50 text-xs hover:bg-white/12 hover:text-white/70 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────────────── */}
      <div className="bg-[#F5F0E8] border-b border-[#E5E3DC]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto">
          <span className="text-xs font-semibold text-[#0f0f0f]/40 shrink-0 uppercase tracking-wider">Statut</span>
          {STATUS_ITEMS.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              <span className="text-xs text-[#0f0f0f]/60">{s.name}</span>
            </div>
          ))}
          <Link href="/status" className="ml-auto shrink-0">
            <span className="text-xs text-[#B5F03C] font-semibold hover:underline">Voir tous les services →</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* ── CATEGORIES ──────────────────────────────────────────────── */}
        {!search && (
          <section className="mb-20">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl font-extrabold text-[#0f0f0f] mb-6 tracking-tight"
            >
              Parcourir par thème
            </motion.h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.title}
                    variants={fadeUp}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={cat.href}>
                      <div className="group p-5 rounded-2xl bg-white border border-[#E5E3DC] hover:border-[#0f0f0f]/20 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                        {/* Icon */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 shrink-0"
                          style={{ backgroundColor: cat.bg }}
                        >
                          <Icon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        {/* Text */}
                        <h3 className="font-extrabold text-[#0f0f0f] text-sm mb-1 group-hover:text-[#0f0f0f]">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-[#0f0f0f]/50 leading-relaxed flex-1 mb-4">
                          {cat.desc}
                        </p>
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[10px] font-semibold text-[#0f0f0f]/35 uppercase tracking-wider">
                            {cat.count} articles
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#0f0f0f]/30 group-hover:text-[#0f0f0f]/60 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}

        {/* ── POPULAR ARTICLES + STATUS ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">

          {/* Articles */}
          <div className="lg:col-span-2">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5 }}
              className="text-xl font-extrabold text-[#0f0f0f] mb-6 tracking-tight"
            >
              {search ? `Résultats pour "${search}"` : "Articles populaires"}
            </motion.h2>

            {filteredArticles.length === 0 && search ? (
              <div className="rounded-2xl bg-white border border-[#E5E3DC] p-10 text-center">
                <AlertCircle className="w-8 h-8 text-[#0f0f0f]/20 mx-auto mb-3" />
                <p className="text-sm text-[#0f0f0f]/50">Aucun article trouvé pour "{search}"</p>
                <button onClick={() => setSearch("")} className="mt-3 text-xs text-[#B5F03C] font-semibold hover:underline">
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="flex flex-col gap-2"
              >
                {(search ? filteredArticles : POPULAR_ARTICLES).map((art, i) => {
                  const Icon = art.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link href={art.href}>
                        <div className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-white border border-[#E5E3DC] hover:border-[#0f0f0f]/20 hover:shadow-sm transition-all cursor-pointer">
                          <div className="w-9 h-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#0f0f0f]/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f0f0f] truncate group-hover:text-[#0f0f0f]">
                              {art.title}
                            </p>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0f0f0f]/35">
                              {art.label}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#0f0f0f]/20 group-hover:text-[#0f0f0f]/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Docs CTA */}
            {!search && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4"
              >
                <Link href="/docs">
                  <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-dashed border-[#0f0f0f]/15 hover:border-[#0f0f0f]/30 hover:bg-white transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#0f0f0f]/40" />
                      <span className="text-sm text-[#0f0f0f]/50 font-medium group-hover:text-[#0f0f0f]/70">
                        Voir toute la documentation API
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#0f0f0f]/30 group-hover:text-[#0f0f0f]/50 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Sidebar: contact + status */}
          <div className="flex flex-col gap-4">
            {/* Contact card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-[#0f0f0f] p-6 text-white"
            >
              <h3 className="font-extrabold text-base mb-1">Contacter le support</h3>
              <p className="text-white/50 text-xs leading-relaxed mb-5">
                Notre équipe répond du lundi au vendredi, 8h–20h (WAT).
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/contact">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 transition-all text-left group">
                    <MessageCircle className="w-4 h-4 text-[#B5F03C] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">Chat en direct</p>
                      <p className="text-[10px] text-white/40">Réponse en moins de 2 minutes</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 ml-auto group-hover:translate-x-0.5 transition-all" />
                  </button>
                </Link>
                <Link href="mailto:support@drimpay.io">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 transition-all text-left group">
                    <Phone className="w-4 h-4 text-[#B5F03C] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">Email support</p>
                      <p className="text-[10px] text-white/40">support@drimpay.io</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 ml-auto group-hover:translate-x-0.5 transition-all" />
                  </button>
                </Link>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] text-white/30">Support Enterprise : 24h/24, 7j/7</span>
              </div>
            </motion.div>

            {/* Quick status */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-white border border-[#E5E3DC] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-[#0f0f0f]">Statut des services</h3>
                <span className="text-[10px] font-semibold text-[#16a34a] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                  Tous opérationnels
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {STATUS_ITEMS.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-xs text-[#0f0f0f]/60">{s.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
                  </div>
                ))}
              </div>
              <Link href="/status">
                <button className="mt-4 text-xs text-[#0f0f0f]/40 hover:text-[#0f0f0f]/70 transition-colors font-medium">
                  Voir la page de statut →
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="mb-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-6"
          >
            <h2 className="text-xl font-extrabold text-[#0f0f0f] tracking-tight">
              Questions fréquentes
            </h2>
            <span className="text-xs text-[#0f0f0f]/40 font-medium">
              {filteredFaqs.length} résultat{filteredFaqs.length !== 1 ? "s" : ""}
            </span>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="flex flex-col gap-2"
          >
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E5E3DC] p-8 text-center">
                <p className="text-sm text-[#0f0f0f]/50">Aucune question trouvée pour "{search}"</p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white border border-[#E5E3DC] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#F8F6F1] transition-colors group"
                  >
                    <span className="font-semibold text-sm text-[#0f0f0f] pr-6 leading-snug">
                      {faq.q}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      openFaq === i ? "bg-[#0f0f0f]" : "bg-[#F5F0E8] group-hover:bg-[#E5E3DC]"
                    }`}>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180 text-white" : "text-[#0f0f0f]/50"
                      }`} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-sm text-[#0f0f0f]/60 leading-relaxed border-t border-[#E5E3DC] pt-4">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </motion.div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-[#F5F0E8] border border-[#E5E3DC] p-10 grid md:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h2 className="text-2xl font-extrabold text-[#0f0f0f] mb-2 tracking-tight">
              Encore besoin d'aide ?
            </h2>
            <p className="text-sm text-[#0f0f0f]/55 leading-relaxed">
              Notre équipe de support est disponible du lundi au vendredi de 8h à 20h WAT.
              Les clients Enterprise bénéficient d'un support dédié 24h/24, 7j/7.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm"
              >
                Contacter le support <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/docs">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#0f0f0f]/15 text-[#0f0f0f] font-semibold text-sm hover:bg-white transition-all"
              >
                Voir la documentation
              </motion.button>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
