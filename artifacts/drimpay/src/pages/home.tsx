import { Link } from "wouter";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

/* ─── Ticker ─────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Développez vos Revenus.",
  "Fidélisez vos Clients.",
  "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.",
  "Connectez l'Afrique.",
  "Développez vos Revenus.",
  "Fidélisez vos Clients.",
  "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.",
  "Connectez l'Afrique.",
];

function Ticker() {
  return (
    <div className="ticker-wrapper overflow-hidden py-5 border-t border-b border-[#E5E3DC] bg-[#F5F0E8]">
      <div className="ticker-track flex gap-10 whitespace-nowrap animate-ticker">
        {TICKER_ITEMS.map((item, i) => (
          <span
            key={i}
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0f0f0f] shrink-0"
          >
            {item}
            <span className="inline-block mx-5 w-2.5 h-2.5 rounded-full bg-[#B5F03C] align-middle" />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

/* ─── Dashboard product mockup ────────────────────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="rounded-2xl overflow-hidden border border-white/30 shadow-2xl bg-white/90 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#f2f0ea] border-b border-[#e0ddd5]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-[#e0ddd5]">
            app.drimpay.io
          </div>
        </div>
        <div className="bg-[#f8f7f2] p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#0d0c18] rounded-xl p-4 text-white">
              <p className="text-[10px] text-gray-400 mb-1">Solde disponible</p>
              <p className="text-xl font-bold">2 450 000</p>
              <p className="text-[10px] text-[#B5F03C] mt-0.5">XOF · DrimPay</p>
              <div className="mt-3 flex gap-1.5">
                <div className="h-1.5 flex-1 rounded bg-[#B5F03C]" />
                <div className="h-1.5 flex-1 rounded bg-white/10" />
                <div className="h-1.5 w-5 rounded bg-white/10" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#e5e3dc]">
              <p className="text-[10px] text-gray-400 mb-1">Transactions</p>
              <p className="text-xl font-bold text-[#0f0f0f]">56 269</p>
              <p className="text-[10px] text-green-500 mt-0.5">+12.4% ce mois</p>
              <div className="mt-3 flex items-end gap-1 h-8">
                {[30,50,38,65,44,72,55,80,60,85,68,95].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-sm ${i === 11 ? "bg-[#B5F03C]" : "bg-[#B5F03C]/25"}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e3dc] p-3">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Flux récents</p>
            <div className="space-y-1.5">
              {[
                { name: "Orange Money → DrimPay", amount: "+45 000 XOF", ok: true },
                { name: "Wave → Client Dakar",    amount: "+12 500 XOF", ok: true },
                { name: "MTN → Lagos Business",   amount: "+88 200 XOF", ok: false },
                { name: "Airtel Money → Lomé",    amount: "+23 400 XOF", ok: true },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium truncate w-36">{tx.name}</span>
                  <span className="text-gray-800 font-bold">{tx.amount}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${tx.ok ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}>
                    {tx.ok ? "Succès" : "En cours"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-[#B5F03C] text-[#0f0f0f] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
        Live · 99.98% uptime
      </div>
    </div>
  );
}

/* ─── Virtual card ────────────────────────────────────────────────────────── */
function VCard({ bg, label, style }: { bg: string; label: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`w-48 h-28 rounded-2xl p-4 flex flex-col justify-between shadow-xl ${bg}`}
      style={style}
    >
      <div className="flex justify-between items-start">
        <div className="w-6 h-4 rounded bg-white/30" />
        <span className="text-white/70 text-[9px] font-bold tracking-widest">DRIMPAY</span>
      </div>
      <div>
        <p className="text-white text-[10px] font-mono tracking-widest opacity-60">•••• 4242</p>
        <p className="text-white text-[9px] mt-0.5 opacity-50">{label}</p>
      </div>
    </div>
  );
}

/* ─── Products section ────────────────────────────────────────────────────── */
const PRODUCTS = [
  {
    label: "Mobile Money →",
    title: "Collecte Mobile Money",
    desc: "Acceptez des paiements depuis Orange Money, Wave, MTN, Airtel Money et bien plus. Une seule intégration, tous les opérateurs.",
    bg: "bg-[#FF6B35]",
    dark: false,
  },
  {
    label: "Cartes Virtuelles →",
    title: "Cartes Virtuelles Instantanées",
    desc: "Émettez des cartes virtuelles Visa/Mastercard liées à vos wallets DrimPay pour les achats en ligne et business.",
    bg: "bg-[#5B5EF5]",
    dark: false,
  },
  {
    label: "Paiement par lien →",
    title: "Liens de Paiement",
    desc: "Créez des liens de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.",
    bg: "bg-[#B5F03C]",
    dark: true,
  },
  {
    label: "Mass Payout →",
    title: "Décaissements Massifs",
    desc: "Envoyez des paiements en masse à des centaines de destinataires simultanément. Parfait pour les paies, commissions et remboursements.",
    bg: "bg-[#0d0c18]",
    dark: false,
  },
  {
    label: "Voir Tout →",
    title: "Toute la Plateforme",
    desc: "Découvrez l'ensemble des produits DrimPay : wallets, KYB automatisé, webhooks temps réel, et tableau de bord no-code.",
    bg: "bg-[#1a6b4a]",
    dark: false,
  },
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
                  active === i
                    ? "bg-[#0f0f0f] text-white shadow-lg"
                    : "text-[#0f0f0f] hover:bg-white/60"
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
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${p.dark ? "text-[#0f0f0f]" : "text-white"}`}>
                {p.title}
              </h3>
              <p className={`text-base leading-relaxed ${p.dark ? "text-[#0f0f0f]/70" : "text-white/70"}`}>
                {p.desc}
              </p>
            </div>
            <div className="mt-8">
              <Link href="/signup">
                <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  p.dark
                    ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/80"
                    : "bg-white text-[#0f0f0f] hover:bg-white/90"
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

/* ─── Dark stack section ──────────────────────────────────────────────────── */
function StackSection() {
  return (
    <section className="py-28 bg-[#0d0c18] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(181,240,60,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(181,240,60,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="max-w-6xl mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Une stack moderne<br />pour les entreprises modernes
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            DrimPay fournit des APIs et des SDKs qui vous permettent de vous concentrer
            sur vos expériences clients et produits sans soucis d'infrastructure.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              badge: "GraphQL API",
              title: "GraphQL API",
              desc: "Nos APIs GraphQL, REST et SDKs vous permettent de construire des interfaces et d'automatiser avec des workflows partenaires pour accélérer votre time-to-market.",
              code: `query GetBalance {\n  wallet(id: "w_xyz") {\n    balance\n    currency\n    status\n  }\n}`,
            },
            {
              icon: "🔔",
              badge: "Webhooks",
              title: "Notifications & Webhooks",
              desc: "Synchronisez votre plateforme avec les événements DrimPay en temps réel grâce à nos webhooks et notifications automatiques pour chaque transaction.",
              code: `{\n  "event": "payment.success",\n  "amount": 45000,\n  "currency": "XOF",\n  "status": "completed"\n}`,
            },
            {
              icon: "📊",
              badge: "No-Code",
              title: "Dashboard No-Code",
              desc: "Le Dashboard DrimPay vous permet de gérer vos finances, transactions et clients sans écrire une seule ligne de code.",
              code: `Dashboard · Analytiques\nTransactions · Wallets\nPaiements · API Keys\nKYB · Équipe`,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#B5F03C]/40 transition-colors"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-[#B5F03C]/15 text-[#B5F03C] text-[10px] font-bold tracking-wider mb-4">
                {item.badge}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-5">{item.desc}</p>
              <div className="bg-black/40 rounded-xl p-3 font-mono text-[11px] text-[#B5F03C]/80 leading-relaxed whitespace-pre">
                {item.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Blog card ───────────────────────────────────────────────────────────── */
function BlogCard({ tag, title, date, bg }: { tag: string; title: string; date: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e3dc] overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
      <div className={`h-32 ${bg} flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/30" />
          <span className="text-white font-bold text-sm">DrimPay</span>
        </div>
      </div>
      <div className="p-4">
        <span className="text-[10px] font-semibold text-[#4a7a1a] uppercase tracking-wider bg-[#B5F03C]/20 px-2 py-0.5 rounded-full">
          {tag}
        </span>
        <h4 className="font-bold text-sm text-[#0f0f0f] mt-2 mb-2 leading-snug group-hover:opacity-70 transition-opacity">
          {title}
        </h4>
        <p className="text-[10px] text-gray-400">{date}</p>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {/* Announcement bar */}
      <div className="fixed top-0 left-0 w-full z-[60] bg-[#B5F03C] text-[#0f0f0f] text-xs md:text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-2">
        Découvrez comment DrimPay et les entreprises africaines redéfinissent les paiements digitaux
        <ArrowRight className="w-4 h-4 shrink-0" />
      </div>

      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #C5F135 0%, #8EF5BE 40%, #5AEADC 70%, #B5F03C 100%)",
          paddingTop: "calc(2.5rem + 72px)",
          paddingBottom: "80px",
        }}
      >
        {/* Organic blob shapes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(255,255,255,0.25) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(90,234,220,0.35) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 md:px-10 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0f0f0f] leading-[1.05] tracking-tight mb-6">
                La Plateforme de Paiement Moderne pour l'Afrique
              </h1>
              <p className="text-base md:text-lg text-[#0f0f0f]/65 leading-relaxed mb-8 max-w-lg">
                Lancez et faites évoluer vos produits financiers sur une seule plateforme :
                mobile money, cartes virtuelles, paiements instantanés et ledger en temps réel.
                Commencez là où vous voulez, grandissez sans limites.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-lg">
                    Explorer la Plateforme
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/80 text-[#0f0f0f] font-semibold text-sm hover:bg-white transition-all shadow-md backdrop-blur">
                    Parler à un Expert
                  </button>
                </Link>
              </div>

              {/* Logo strip */}
              <div className="mt-10 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#0f0f0f]/50 font-medium">Opérateurs connectés :</span>
                {["🟠 Orange", "🌊 Wave", "📱 MTN", "✈️ Airtel"].map((op, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold text-[#0f0f0f]/70 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur border border-white/40"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div>
              <ProductMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── BETTER WAY ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left */}
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
            {/* Right */}
            <div>
              <p className="text-base text-[#0f0f0f]/55 leading-relaxed mb-8">
                DrimPay regroupe les intégrations aux opérateurs mobiles, la conformité et
                votre expérience client en un seul endroit. De la mise en service à la
                croissance, DrimPay vous permet de vous concentrer sur la construction de
                produits remarquables.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "💳", title: "Cartes virtuelles",    desc: "Émettez des cartes Visa liées à vos wallets pour les paiements en ligne." },
                  { icon: "📡", title: "Webhooks temps réel",  desc: "Soyez notifié à chaque événement de paiement instantanément." },
                  { icon: "🏦", title: "Multi-devises",        desc: "Gérez des soldes en XOF, XAF, NGN, GHS et plus encore." },
                  { icon: "🔐", title: "KYB automatisé",       desc: "Vérification d'identité d'entreprise sans friction." },
                  { icon: "📊", title: "Analytiques",          desc: "Tableaux de bord en temps réel pour suivre vos performances." },
                  { icon: "🛡️", title: "Sécurité bancaire",   desc: "Chiffrement de bout en bout et conformité PCI-DSS." },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-[#e5e3dc] p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl mb-3">{f.icon}</div>
                    <h4 className="font-bold text-sm text-[#0f0f0f] mb-1">{f.title}</h4>
                    <p className="text-xs text-[#0f0f0f]/50 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAKE IT YOUR OWN ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-4">
            Faites-en le Vôtre
          </h2>
          <p className="text-base md:text-lg text-[#0f0f0f]/55 max-w-xl mx-auto mb-14 leading-relaxed">
            Mettez votre marque entre les mains de vos clients. DrimPay vous permet de
            gérer la conception de chaque expérience de paiement — votre marque, vos
            couleurs, votre identité. Construisez votre marque de façon cohérente.
          </p>

          {/* Card stack */}
          <div className="relative flex items-center justify-center h-52 mb-8">
            <VCard bg="bg-[#5B5EF5]" label="Business Premium" style={{ transform: "rotate(-8deg) translateX(-80px) translateY(8px)", position: "absolute" }} />
            <VCard bg="bg-[#1a6b4a]" label="Carte Enterprise"  style={{ transform: "rotate(7deg) translateX(80px) translateY(8px)", position: "absolute" }} />
            <VCard bg="bg-[#B5F03C]" label="Carte Standard"    style={{ transform: "translateY(-8px)", position: "relative", zIndex: 10 }} />
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

      {/* ── PRODUCTS ─────────────────────────────────────────────────────── */}
      <ProductsSection />

      {/* ── STACK (dark) ─────────────────────────────────────────────────── */}
      <StackSection />

      {/* ── TWO CTA CARDS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#e5e3dc] p-8 hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-[#B5F03C] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                🚀
              </div>
              <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Planifiez votre Lancement</h3>
              <p className="text-sm text-[#0f0f0f]/55 leading-relaxed mb-6">
                Notre équipe d'experts vous accompagne à chaque étape — de l'intégration
                à la mise en production. Planifiez un appel dès aujourd'hui.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all">
                  Planifier un appel <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="bg-[#0d0c18] rounded-3xl border border-white/10 p-8 hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                🔄
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3">Migrer vers DrimPay</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Vous utilisez déjà un autre prestataire ? Notre équipe migration prend en
                charge l'intégralité du transfert : données, configurations et documentation.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all">
                  Démarrer la migration <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── READ THE LATEST ──────────────────────────────────────────────── */}
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
            <BlogCard tag="Produit"      title="DrimPay lance les cartes virtuelles pour les entreprises en Afrique de l'Ouest"    date="7 mai 2026"     bg="bg-[#5B5EF5]" />
            <BlogCard tag="Intégration"  title="Comment intégrer Orange Money en moins de 30 minutes avec DrimPay"                  date="2 mai 2026"     bg="bg-[#FF6B35]" />
            <BlogCard tag="Croissance"   title="DrimPay traite désormais 10 milliards XOF par mois en transactions"                 date="28 avril 2026"  bg="bg-[#B5F03C]" />
            <BlogCard tag="Guide"        title="Comprendre le KYB automatisé et la conformité fintech en Afrique"                   date="21 avril 2026"  bg="bg-[#0d0c18]" />
          </div>
          <div className="mt-6 md:hidden">
            <Link href="/blog">
              <button className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#e0ddd5] bg-[#F5F0E8] text-[#0f0f0f] font-semibold text-sm">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <Ticker />
    </div>
  );
}
