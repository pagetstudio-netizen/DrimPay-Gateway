import { Link } from "wouter";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DASHED GRID HERO BACKGROUND                                               */
/* ══════════════════════════════════════════════════════════════════════════ */
const GRID_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='60' y1='0' x2='0' y2='0' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3Cline x1='0' y1='0' x2='0' y2='60' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DESKTOP APP MOCKUP  (real screenshot)                                     */
/* ══════════════════════════════════════════════════════════════════════════ */
function DesktopMockup() {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
      <img
        src="/dashboard-hero.jpg"
        alt="DrimPay Dashboard"
        className="w-full block"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TICKER                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */
const TICKER_ITEMS = [
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
];

function Ticker() {
  return (
    <div className="overflow-hidden py-5 border-t border-b border-[#E5E3DC] bg-[#F5F0E8]">
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 30s linear infinite", width: "max-content" }}>
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0f0f0f] shrink-0">
            {item}
            <span className="inline-block mx-5 w-2.5 h-2.5 rounded-full bg-[#B5F03C] align-middle" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCTS TAB                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */
const PRODUCTS = [
  { label: "Mobile Money →", title: "Collecte Mobile Money", desc: "Acceptez des paiements depuis Orange Money, Wave, MTN, Airtel Money et bien plus. Une seule intégration, tous les opérateurs.", bg: "bg-[#FF6B35]", dark: false },
  { label: "Cartes Virtuelles →", title: "Cartes Virtuelles Instantanées", desc: "Émettez des cartes virtuelles Visa/Mastercard liées à vos wallets DrimPay pour les achats en ligne et business.", bg: "bg-[#5B5EF5]", dark: false },
  { label: "Paiement par lien →", title: "Liens de Paiement", desc: "Créez des liens de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.", bg: "bg-[#B5F03C]", dark: true },
  { label: "Mass Payout →", title: "Décaissements Massifs", desc: "Envoyez des paiements en masse à des centaines de destinataires simultanément. Parfait pour les paies et remboursements.", bg: "bg-[#0d0c18]", dark: false },
  { label: "Voir Tout →", title: "Toute la Plateforme", desc: "Découvrez l'ensemble des produits DrimPay : wallets, KYB automatisé, webhooks temps réel, et tableau de bord no-code.", bg: "bg-[#1a6b4a]", dark: false },
];

function ProductsSection() {
  const [active, setActive] = useState(0);
  const p = PRODUCTS[active];
  return (
    <section className="py-24 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f0f0f] mb-14 leading-tight tracking-tight">
          Produits Prêts à l'Emploi
        </h2>
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-1">
            {PRODUCTS.map((prod, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-lg transition-all ${
                  active === i ? "bg-[#0f0f0f] text-white shadow-lg" : "text-[#0f0f0f] hover:bg-white/60"
                }`}
              >
                {prod.label}
              </button>
            ))}
          </div>
          <div className={`rounded-3xl ${p.bg} p-8 min-h-[280px] flex flex-col justify-between shadow-xl`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <div className="w-5 h-5 rounded bg-white/60" />
              </div>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${p.dark ? "text-[#0f0f0f]" : "text-white"}`}>{p.title}</h3>
              <p className={`text-base leading-relaxed ${p.dark ? "text-[#0f0f0f]/70" : "text-white/70"}`}>{p.desc}</p>
            </div>
            <div className="mt-8">
              <Link href="/signup">
                <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  p.dark ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/80" : "bg-white text-[#0f0f0f] hover:bg-white/90"
                }`}>
                  Commencer <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                 */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* Global CSS */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#F8F6F1]"
        style={{
          backgroundImage: GRID_SVG,
          backgroundSize: "60px 60px",
          paddingTop: "140px",
          paddingBottom: "80px",
        }}
      >
        {/* Radial glow center — light, not dark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(181,240,60,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto px-6 md:px-10 relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E3DC] shadow-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#B5F03C] animate-pulse" />
            <span className="text-xs font-semibold text-[#3a7a00]">API v2.0 maintenant disponible</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0f0f0f] leading-[1.02] tracking-tight mb-6 max-w-4xl mx-auto">
            La Plateforme de Paiement{" "}
            <span className="relative inline-block">
              Moderne
              <span
                className="absolute -bottom-1 left-0 w-full h-2 rounded-full opacity-60"
                style={{ background: "linear-gradient(90deg, #B5F03C, #5AEADC)" }}
              />
            </span>
            {" "}pour l'Afrique
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#0f0f0f]/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Lancez et faites évoluer vos produits financiers sur une seule plateforme : mobile money, cartes virtuelles, paiements instantanés et ledger en temps réel. Commencez là où vous voulez, grandissez sans limites.
          </p>

          {/* CTAs — centered */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-lg">
                Explorer la Plateforme
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white border border-[#E0DDD6] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all">
                Parler à un Expert
              </button>
            </Link>
          </div>

          {/* Learn more */}
          <Link href="/how-it-works">
            <button className="text-sm text-[#0f0f0f]/45 hover:text-[#0f0f0f]/70 transition-colors flex items-center gap-1 mx-auto mb-14">
              En savoir plus
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </Link>

          {/* Desktop app mockup */}
          <DesktopMockup />
        </div>
      </section>


      {/* ── BETTER WAY ───────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-6">
                Une meilleure façon<br />de lancer un<br />produit de paiement
              </h2>
              <Link href="/how-it-works">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div>
              <p className="text-base text-[#0f0f0f]/55 leading-relaxed mb-8">
                DrimPay regroupe les intégrations aux opérateurs mobiles, la conformité et votre expérience client en un seul endroit. De la mise en service à la croissance, DrimPay vous permet de vous concentrer sur la construction de produits remarquables.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "💳", title: "Cartes virtuelles",   desc: "Émettez des cartes Visa liées à vos wallets pour les paiements en ligne." },
                  { icon: "📡", title: "Webhooks temps réel", desc: "Soyez notifié à chaque événement de paiement instantanément." },
                  { icon: "🏦", title: "Multi-devises",       desc: "Gérez des soldes en XOF, XAF, NGN, GHS et plus encore." },
                  { icon: "🔐", title: "KYB automatisé",      desc: "Vérification d'identité d'entreprise sans friction." },
                  { icon: "📊", title: "Analytiques",         desc: "Tableaux de bord temps réel pour suivre vos performances." },
                  { icon: "🛡️", title: "Sécurité bancaire",  desc: "Chiffrement de bout en bout et conformité PCI-DSS." },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-[#e5e3dc] p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-xl mb-2">{f.icon}</div>
                    <h4 className="font-bold text-sm text-[#0f0f0f] mb-1">{f.title}</h4>
                    <p className="text-xs text-[#0f0f0f]/50 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAKE IT YOUR OWN ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-4">
            Faites-en le Vôtre
          </h2>
          <p className="text-base md:text-lg text-[#0f0f0f]/55 max-w-xl mx-auto mb-14 leading-relaxed">
            Mettez votre marque entre les mains de vos clients. DrimPay vous permet de gérer chaque expérience de paiement — votre marque, vos couleurs, votre identité.
          </p>
          {/* Card stack */}
          <div className="relative flex items-center justify-center h-48 mb-8">
            {[
              { bg: "bg-[#5B5EF5]", label: "Business Premium", style: { transform: "rotate(-8deg) translateX(-80px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#1a6b4a]", label: "Carte Enterprise",  style: { transform: "rotate(7deg) translateX(80px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#B5F03C]", label: "Carte Standard",    style: { transform: "translateY(-8px)", position: "relative" as const, zIndex: 10 } },
            ].map((c, i) => (
              <div
                key={i}
                className={`w-48 h-28 rounded-2xl ${c.bg} p-4 flex flex-col justify-between shadow-xl`}
                style={c.style}
              >
                <div className="flex justify-between items-start">
                  <div className="w-6 h-4 rounded bg-white/30" />
                  <span className="text-white/70 text-[9px] font-bold tracking-widest">DRIMPAY</span>
                </div>
                <div>
                  <p className="text-white text-[10px] font-mono tracking-widest opacity-60">•••• 4242</p>
                  <p className="text-white text-[9px] mt-0.5 opacity-50">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 bg-[#F5F0E8] border border-[#e5e3dc] rounded-full px-4 py-2 mb-8">
            <span className="text-lg">✋</span>
            <span className="text-xs font-semibold text-[#0f0f0f]/60">Marque blanche disponible</span>
          </div>
          <div>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                Personnaliser votre expérience <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
      <ProductsSection />

      {/* ── TWO CTA CARDS ────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col" style={{ background: "#F8F6F1" }}>
              {/* Operators hub image */}
              <div className="relative flex items-center justify-center overflow-hidden px-4 pt-6 pb-2" style={{ minHeight: "280px", background: "#F8F6F1" }}>
                <img
                  src="/operators-hub.png"
                  alt="DrimPay Opérateurs"
                  className="w-full object-contain"
                  style={{ maxWidth: "380px", maxHeight: "270px" }}
                />
              </div>
              {/* Text content */}
              <div className="p-8 flex flex-col flex-1" style={{ background: "#F8F6F1" }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B5F03C]/30 text-[#3a7a00] text-xs font-semibold mb-4 w-fit">
                  Réseau d'opérateurs
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Connecté à tous les opérateurs</h3>
                <p className="text-sm text-[#0f0f0f]/60 leading-relaxed mb-6 flex-1">
                  Wave, Orange Money, MTN MoMo, Moov Money, Wizall, TMoney, Vodacom et Airtel — une seule intégration pour les atteindre tous.
                </p>
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all">
                    Commencer maintenant <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col" style={{ background: "#F0EDE6" }}>
              {/* DrimPay network image */}
              <div className="relative flex items-center justify-center overflow-hidden px-6 pt-8" style={{ minHeight: "260px", background: "#F0EDE6" }}>
                <img
                  src="/drimpay-network.png"
                  alt="DrimPay Services"
                  className="w-full object-contain"
                  style={{ maxWidth: "340px", maxHeight: "240px" }}
                />
              </div>
              {/* Text content */}
              <div className="p-8 flex flex-col flex-1" style={{ background: "#F0EDE6" }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B5F03C]/30 text-[#3a7a00] text-xs font-semibold mb-4 w-fit">
                  Tous les produits
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Une plateforme, toutes vos solutions</h3>
                <p className="text-sm text-[#0f0f0f]/60 leading-relaxed mb-6 flex-1">
                  API de Paiement, Mass Payments, Payment Link et Cartes Virtuelles — tout connecté sur une seule infrastructure fiable.
                </p>
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all">
                    Démarrer gratuitement <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight">
              Lire les Dernières Nouvelles
            </h2>
            <Link href="/blog">
              <button className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e0ddd5] bg-[#F5F0E8] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { tag: "Produit",     title: "DrimPay lance les cartes virtuelles pour les entreprises en Afrique de l'Ouest", date: "7 mai 2026",    bg: "bg-[#5B5EF5]" },
              { tag: "Intégration", title: "Comment intégrer Orange Money en moins de 30 minutes avec DrimPay",               date: "2 mai 2026",    bg: "bg-[#FF6B35]" },
              { tag: "Croissance",  title: "DrimPay traite désormais 10 milliards XOF par mois en transactions",              date: "28 avril 2026", bg: "bg-[#B5F03C]" },
              { tag: "Guide",       title: "Comprendre le KYB automatisé et la conformité fintech en Afrique",                date: "21 avril 2026", bg: "bg-[#0d0c18]" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e5e3dc] overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                <div className={`h-32 ${card.bg} flex items-center justify-center`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/30" />
                    <span className="text-white font-bold text-sm">DrimPay</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-semibold text-[#3a7a00] uppercase tracking-wider bg-[#B5F03C]/20 px-2 py-0.5 rounded-full">{card.tag}</span>
                  <h4 className="font-bold text-sm text-[#0f0f0f] mt-2 mb-2 leading-snug group-hover:opacity-70 transition-opacity">{card.title}</h4>
                  <p className="text-[10px] text-gray-400">{card.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────── */}
      <Ticker />
    </div>
  );
}
