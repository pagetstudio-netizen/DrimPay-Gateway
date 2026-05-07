import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

/* ─── Ticker ─────────────────────────────────────────────────────────────── */
function Ticker() {
  const items = [
    "Grow Your Revenue.",
    "Grow Your Loyalty.",
    "Grow Your Business.",
    "Grow Your Reach.",
    "Grow Your Impact.",
    "Grow Your Revenue.",
    "Grow Your Loyalty.",
    "Grow Your Business.",
    "Grow Your Reach.",
    "Grow Your Impact.",
  ];
  return (
    <div className="ticker-wrapper overflow-hidden py-5 border-t border-b border-[#E5E3DC]">
      <div className="ticker-track flex gap-12 whitespace-nowrap animate-ticker">
        {items.map((item, i) => (
          <span key={i} className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1a1a1a] shrink-0">
            {item}
            <span className="inline-block mx-4 w-2 h-2 rounded-full bg-[#A8E63D] align-middle" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Nav Mockup inside hero ─────────────────────────────────────────────── */
function ProductMockup() {
  return (
    <div className="relative w-full">
      {/* Browser shell */}
      <div className="rounded-2xl overflow-hidden border border-[#E0DDD5] shadow-2xl bg-white">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#F2F0EA] border-b border-[#E0DDD5]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-[#E0DDD5]">
            app.drimpay.io
          </div>
        </div>
        {/* App content */}
        <div className="bg-[#F8F7F2] p-4 min-h-[300px]">
          {/* Top row: two small cards */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#0D0C18] rounded-xl p-4 text-white">
              <p className="text-[10px] text-gray-400 mb-1">Solde disponible</p>
              <p className="text-2xl font-bold">2 450 000</p>
              <p className="text-[10px] text-[#A8E63D] mt-0.5">XOF · DrimPay Wallet</p>
              <div className="mt-3 flex gap-2">
                <div className="h-1.5 flex-1 rounded bg-[#A8E63D]" />
                <div className="h-1.5 flex-1 rounded bg-white/10" />
                <div className="h-1.5 w-6 rounded bg-white/10" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E5E3DC]">
              <p className="text-[10px] text-gray-400 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">56 269</p>
              <p className="text-[10px] text-green-500 mt-0.5">+12.4% ce mois</p>
              <div className="mt-3 flex items-end gap-1 h-8">
                {[30, 50, 38, 65, 44, 72, 55, 80, 60, 85, 68, 95].map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-sm ${i === 11 ? "bg-[#A8E63D]" : "bg-[#A8E63D]/25"}`} />
                ))}
              </div>
            </div>
          </div>
          {/* Payment flow visualization */}
          <div className="bg-white rounded-xl border border-[#E5E3DC] p-3">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">Flux de paiement récents</p>
            <div className="space-y-1.5">
              {[
                { name: "Orange Money → DrimPay", amount: "+45 000 XOF", status: "Succès", color: "text-green-600 bg-green-50" },
                { name: "Wave → Client Dakar", amount: "+12 500 XOF", status: "Succès", color: "text-green-600 bg-green-50" },
                { name: "MTN → Lagos Business", amount: "+88 200 XOF", status: "En cours", color: "text-orange-600 bg-orange-50" },
                { name: "Airtel Money → Lomé", amount: "+23 400 XOF", status: "Succès", color: "text-green-600 bg-green-50" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium truncate w-40">{tx.name}</span>
                  <span className="text-gray-800 font-bold">{tx.amount}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${tx.color}`}>{tx.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-[#A8E63D] text-[#0D0C18] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
        Live · 99.98% uptime
      </div>
    </div>
  );
}

/* ─── Virtual Card Mockup ─────────────────────────────────────────────────── */
function CardMockup({ color, label, rotate }: { color: string; label: string; rotate?: string }) {
  return (
    <div
      className={`w-52 h-32 rounded-2xl p-4 flex flex-col justify-between shadow-xl ${color} ${rotate || ""}`}
      style={{ transform: rotate }}
    >
      <div className="flex justify-between items-start">
        <div className="w-7 h-5 rounded bg-white/30" />
        <span className="text-white/80 text-[10px] font-bold tracking-wider">DRIMPAY</span>
      </div>
      <div>
        <p className="text-white text-xs font-mono tracking-widest opacity-70">•••• •••• •••• 4242</p>
        <p className="text-white text-[10px] mt-0.5 opacity-60">{label}</p>
      </div>
    </div>
  );
}

/* ─── Feature Card for "better way" section ──────────────────────────────── */
function FeatureSmallCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DC] p-5 hover:shadow-md transition-shadow">
      <div className="text-2xl mb-3">{icon}</div>
      <h4 className="font-bold text-sm text-[#1a1a1a] mb-1">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Blog Card ───────────────────────────────────────────────────────────── */
function BlogCard({ tag, title, date, color }: { tag: string; title: string; date: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E3DC] overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
      <div className={`h-32 ${color} flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/30" />
          <span className="text-white font-bold text-sm">DrimPay</span>
        </div>
      </div>
      <div className="p-4">
        <span className="text-[10px] font-semibold text-[#A8E63D] uppercase tracking-wider bg-[#A8E63D]/10 px-2 py-0.5 rounded">{tag}</span>
        <h4 className="font-bold text-sm text-[#1a1a1a] mt-2 mb-2 leading-snug group-hover:text-[#1a1a1a]/70 transition-colors">{title}</h4>
        <p className="text-[10px] text-gray-400">{date}</p>
      </div>
    </div>
  );
}

/* ─── Products Tab ────────────────────────────────────────────────────────── */
const PRODUCTS = [
  { label: "Mobile Money →", title: "Collecte Mobile Money", desc: "Acceptez des paiements depuis Orange Money, Wave, MTN, Airtel Money et bien plus. Une seule intégration, tous les opérateurs.", color: "bg-[#FF6B35]" },
  { label: "Cartes Virtuelles →", title: "Cartes Virtuelles Instantanées", desc: "Émettez des cartes virtuelles Visa/Mastercard liées à vos wallets DrimPay pour les achats en ligne et business.", color: "bg-[#5B5EF5]" },
  { label: "Paiement par lien →", title: "Liens de Paiement", desc: "Créez des liens de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.", color: "bg-[#A8E63D]" },
  { label: "Mass Payout →", title: "Décaissements Massifs", desc: "Envoyez des paiements en masse à des centaines de destinataires simultanément. Parfait pour les paies, commissions et remboursements.", color: "bg-[#0D0C18]" },
  { label: "Voir Tout →", title: "Toute la Plateforme", desc: "Découvrez l'ensemble des produits DrimPay : wallets, KYB automatisé, webhooks temps réel, et tableau de bord no-code.", color: "bg-[#1a6b4a]" },
];

function ProductsSection() {
  const [active, setActive] = useState(0);
  const p = PRODUCTS[active];

  return (
    <section className="py-24 bg-[#F5F4EE]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] mb-14 leading-tight tracking-tight">
          Produits Prêts à l'Emploi
        </h2>
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: nav list */}
          <div className="space-y-1">
            {PRODUCTS.map((prod, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left px-5 py-4 rounded-xl font-bold text-lg transition-all ${
                  active === i
                    ? "bg-[#1a1a1a] text-white shadow-lg"
                    : "text-[#1a1a1a] hover:bg-white/60"
                }`}
              >
                {prod.label}
              </button>
            ))}
          </div>
          {/* Right: product card */}
          <div className="lg:sticky lg:top-24">
            <div className={`rounded-3xl ${p.color} p-8 min-h-[280px] flex flex-col justify-between shadow-xl`}>
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                  <div className="w-5 h-5 rounded bg-white/60" />
                </div>
                <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${p.color === "bg-[#A8E63D]" ? "text-[#1a1a1a]" : "text-white"}`}>
                  {p.title}
                </h3>
                <p className={`text-base leading-relaxed ${p.color === "bg-[#A8E63D]" ? "text-[#1a1a1a]/70" : "text-white/70"}`}>
                  {p.desc}
                </p>
              </div>
              <div className="mt-8">
                <Link href="/signup">
                  <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    p.color === "bg-[#A8E63D]"
                      ? "bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/80"
                      : "bg-white text-[#1a1a1a] hover:bg-white/90"
                  }`}>
                    Commencer <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
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
    <section className="py-28 bg-[#0D0C18] relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(168,230,61,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,230,61,0.3) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />
      <div className="max-w-6xl mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Une stack moderne<br />pour les entreprises modernes
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            DrimPay fournit des APIs comme GraphQL et des SDKs qui vous permettent de vous concentrer sur vos expériences clients et produits sans soucis de plomberie.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "GraphQL API",
              desc: "Nos APIs GraphQL, REST et SDKs vous permettent de construire des interfaces, d'automatiser avec des workflows et de tirer parti de bibliothèques partenaires pour accélérer votre time-to-market.",
              badge: "GraphQL",
              code: `query GetBalance {\n  wallet(id: "w_xyz") {\n    balance\n    currency\n    status\n  }\n}`,
            },
            {
              icon: "🔔",
              title: "Notifications & Webhooks",
              desc: "Synchronisez votre plateforme avec les événements DrimPay en temps réel grâce à nos webhooks et notifications automatiques.",
              badge: "Webhooks",
              code: `{\n  "event": "payment.success",\n  "amount": 45000,\n  "currency": "XOF",\n  "status": "completed"\n}`,
            },
            {
              icon: "📊",
              title: "Dashboard No-Code",
              desc: "Le Dashboard DrimPay vous permet de gérer vos finances, transactions et clients sans écrire une seule ligne de code.",
              badge: "No-Code",
              code: `Dashboard · Analytiques\nTransactions · Wallets\nPaiements · API Keys\nKYB · Équipe`,
            },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#A8E63D]/30 transition-colors group">
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="inline-block px-2 py-0.5 rounded bg-[#A8E63D]/15 text-[#A8E63D] text-[10px] font-bold tracking-wider mb-4">
                {item.badge}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-5">{item.desc}</p>
              <div className="bg-black/40 rounded-xl p-3 font-mono text-[11px] text-[#A8E63D]/80 leading-relaxed whitespace-pre">
                {item.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Home Component ─────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F4EE] font-sans">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-0 overflow-hidden bg-[#F5F4EE]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A8E63D]/15 border border-[#A8E63D]/30 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#A8E63D] animate-pulse" />
                <span className="text-xs font-semibold text-[#4a7a1a] tracking-wide">API v2.0 maintenant disponible</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-[1.05] tracking-tight mb-6">
                La Plateforme de Paiement la Plus Moderne pour l'Afrique
              </h1>
              <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                Tout ce dont vous avez besoin pour lancer votre produit fintech : mobile money, cartes virtuelles, mass payout et wallets. En production en jours, pas en mois.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#1a1a1a]/85 transition-all shadow-md">
                    Voir en Action <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/docs">
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#E0DDD5] text-[#1a1a1a] font-semibold text-sm hover:shadow-md transition-all">
                    API Playground <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              {/* Partner logos strip */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs text-gray-400 font-medium">Confiance des opérateurs :</span>
                {["🟠 Orange", "🌊 Wave", "📱 MTN", "✈️ Airtel"].map((op, i) => (
                  <span key={i} className="text-sm font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-[#E0DDD5] shadow-sm">
                    {op}
                  </span>
                ))}
              </div>
            </div>
            {/* Right: product mockup */}
            <div className="relative">
              <ProductMockup />
            </div>
          </div>
        </div>
        {/* Bottom wave divider */}
        <div className="h-12 bg-gradient-to-b from-[#F5F4EE] to-[#ECEAE2] mt-16" />
      </section>

      {/* ── BETTER WAY ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#ECEAE2]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left text */}
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#1a1a1a] leading-tight tracking-tight mb-6">
                Une meilleure façon<br />de lancer un<br />produit de paiement
              </h2>
              <Link href="/how-it-works">
                <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#1a1a1a]/85 transition-all shadow-md mt-2">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            {/* Right: feature mini-cards grid */}
            <div>
              <p className="text-base text-gray-500 leading-relaxed mb-8">
                DrimPay regroupe les intégrations aux opérateurs mobiles, la conformité et votre expérience client en un seul endroit. De la mise en service à la croissance, DrimPay vous permet de vous concentrer sur la construction de produits remarquables.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FeatureSmallCard icon="💳" title="Cartes virtuelles" desc="Émettez des cartes virtuelles Visa liées à vos wallets pour les paiements en ligne." />
                <FeatureSmallCard icon="📡" title="Webhooks temps réel" desc="Soyez notifié à chaque événement de paiement instantanément." />
                <FeatureSmallCard icon="🏦" title="Multi-devises" desc="Gérez des soldes en XOF, XAF, NGN, GHS et plus encore." />
                <FeatureSmallCard icon="🔐" title="KYB automatisé" desc="Vérification d'identité d'entreprise sans friction grâce à notre pipeline automatisé." />
                <FeatureSmallCard icon="📊" title="Analytiques avancées" desc="Tableaux de bord en temps réel pour suivre vos transactions et performances." />
                <FeatureSmallCard icon="🛡️" title="Sécurité bancaire" desc="Chiffrement de bout en bout et conformité aux standards PCI-DSS." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAKE IT YOUR OWN ──────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F4EE]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#1a1a1a] leading-tight tracking-tight mb-4">
            Faites-en le Vôtre
          </h2>
          <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-14 leading-relaxed">
            Mettez votre marque entre les mains de vos clients. DrimPay vous permet de gérer la conception de chaque expérience de paiement — votre marque, vos couleurs, votre identité. Construisez votre marque de façon cohérente.
          </p>
          {/* Card mockup stack */}
          <div className="relative flex items-center justify-center h-56 mb-6">
            <div className="absolute" style={{ transform: "rotate(-8deg) translateX(-80px) translateY(10px)" }}>
              <CardMockup color="bg-[#5B5EF5]" label="Business Premium" />
            </div>
            <div className="absolute" style={{ transform: "rotate(6deg) translateX(80px) translateY(10px)" }}>
              <CardMockup color="bg-[#1a6b4a]" label="Carte Enterprise" />
            </div>
            <div className="relative z-10" style={{ transform: "translateY(-10px)" }}>
              <CardMockup color="bg-[#A8E63D]" label="Carte Standard" />
            </div>
          </div>
          {/* Hand emoji / indicator */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#E5E3DC] rounded-full px-4 py-2 shadow-sm">
            <span className="text-lg">✋</span>
            <span className="text-xs font-semibold text-gray-600">Marque blanche disponible</span>
          </div>
          <div className="mt-8">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#1a1a1a]/85 transition-all shadow-md">
                Personnaliser votre expérience <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS (tabbed) ─────────────────────────────────────────────── */}
      <ProductsSection />

      {/* ── MODERN STACK (dark) ───────────────────────────────────────────── */}
      <StackSection />

      {/* ── TWO CTA CARDS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F4EE]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-[#E5E3DC] p-8 hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-[#A8E63D] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#1a1a1a] mb-3">Planifiez votre Lancement</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Notre équipe d'experts est là pour vous accompagner à chaque étape — de l'intégration à la mise en production. Planifiez un appel dès aujourd'hui.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm hover:bg-[#1a1a1a]/85 transition-all">
                  Planifier un appel <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            {/* Card 2 */}
            <div className="bg-[#0D0C18] rounded-3xl border border-white/10 p-8 hover:shadow-lg transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3">Migrer vers DrimPay</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Vous utilisez déjà un autre prestataire ? Notre équipe migration prend en charge l'intégralité du transfert : données, configurations et documentation.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A8E63D] text-[#1a1a1a] font-semibold text-sm hover:bg-[#A8E63D]/90 transition-all">
                  Démarrer la migration <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG / READ THE LATEST ────────────────────────────────────────── */}
      <section className="py-24 bg-[#ECEAE2]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
              Lire les Dernières Nouvelles
            </h2>
            <Link href="/blog">
              <button className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E0DDD5] bg-white text-[#1a1a1a] font-semibold text-sm hover:shadow-md transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <BlogCard
              tag="Produit"
              title="DrimPay lance les cartes virtuelles pour les entreprises en Afrique de l'Ouest"
              date="7 mai 2026"
              color="bg-[#5B5EF5]"
            />
            <BlogCard
              tag="Intégration"
              title="Comment intégrer Orange Money en moins de 30 minutes avec DrimPay"
              date="2 mai 2026"
              color="bg-[#FF6B35]"
            />
            <BlogCard
              tag="Croissance"
              title="DrimPay traite désormais 10 milliards XOF par mois en transactions"
              date="28 avril 2026"
              color="bg-[#A8E63D]"
            />
            <BlogCard
              tag="Guide"
              title="Comprendre le KYB automatisé et la conformité fintech en Afrique"
              date="21 avril 2026"
              color="bg-[#0D0C18]"
            />
          </div>
          <div className="mt-6 md:hidden">
            <Link href="/blog">
              <button className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E0DDD5] bg-white text-[#1a1a1a] font-semibold text-sm">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TICKER ────────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── TICKER CSS (injected inline) ──────────────────────────────────── */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 28s linear infinite;
          width: max-content;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
