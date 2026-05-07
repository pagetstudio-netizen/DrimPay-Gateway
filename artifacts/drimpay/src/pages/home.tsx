import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetPlatformStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Globe, Code, CheckCircle2, TrendingUp, Wallet, CreditCard, Users, BarChart3, Download, Send, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

function DecorativeLeft() {
  return (
    <svg viewBox="0 0 180 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-16 h-[420px] w-[180px] opacity-[0.07] pointer-events-none select-none hidden xl:block">
      <path d="M160 20 L80 20 L80 80 L20 80 L20 200 L60 200 L60 260 L120 260 L120 380 L160 380" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      <path d="M140 50 L100 50 L100 120 L40 120 L40 180" stroke="currentColor" strokeWidth="1" className="text-primary" />
      <circle cx="80" cy="20" r="3" fill="currentColor" className="text-primary" />
      <circle cx="20" cy="80" r="3" fill="currentColor" className="text-foreground" />
      <circle cx="60" cy="200" r="3" fill="currentColor" className="text-primary" />
      <circle cx="120" cy="260" r="3" fill="currentColor" className="text-foreground" />
      <circle cx="120" cy="380" r="3" fill="currentColor" className="text-primary" />
      <rect x="30" y="150" width="8" height="8" stroke="currentColor" strokeWidth="1" className="text-primary" />
      <rect x="90" y="230" width="8" height="8" stroke="currentColor" strokeWidth="1" className="text-foreground" />
      <path d="M150 100 L150 150 L170 150" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="text-foreground" />
    </svg>
  );
}

function DecorativeRight() {
  return (
    <svg viewBox="0 0 180 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 top-16 h-[420px] w-[180px] opacity-[0.07] pointer-events-none select-none hidden xl:block">
      <path d="M20 20 L100 20 L100 80 L160 80 L160 200 L120 200 L120 260 L60 260 L60 380 L20 380" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
      <path d="M40 50 L80 50 L80 120 L140 120 L140 180" stroke="currentColor" strokeWidth="1" className="text-primary" />
      <circle cx="100" cy="20" r="3" fill="currentColor" className="text-primary" />
      <circle cx="160" cy="80" r="3" fill="currentColor" className="text-foreground" />
      <circle cx="120" cy="200" r="3" fill="currentColor" className="text-primary" />
      <circle cx="60" cy="260" r="3" fill="currentColor" className="text-foreground" />
      <circle cx="60" cy="380" r="3" fill="currentColor" className="text-primary" />
      <rect x="140" y="150" width="8" height="8" stroke="currentColor" strokeWidth="1" className="text-primary" />
      <rect x="80" y="230" width="8" height="8" stroke="currentColor" strokeWidth="1" className="text-foreground" />
      <path d="M30 100 L30 150 L10 150" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="text-foreground" />
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-2xl bg-white">
      <div className="flex items-center px-4 py-3 bg-[#f5f5f7] border-b border-[#e5e5ea]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="mx-auto text-xs text-gray-400 font-mono">app.drimpay.io/dashboard</div>
      </div>
      <div className="flex h-[340px] md:h-[400px]">
        <div className="w-52 shrink-0 bg-[#0f172a] flex flex-col py-4 px-3 gap-1 hidden md:flex">
          <div className="flex items-center gap-2 px-3 py-2 mb-3">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-black">D</span>
            </div>
            <span className="text-white font-semibold text-sm">DrimPay</span>
          </div>
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: Wallet, label: "Solde", active: false },
            { icon: Download, label: "Collecte", active: false },
            { icon: Send, label: "Reversement", active: false },
            { icon: CreditCard, label: "Cartes", active: false },
            { icon: Users, label: "Entreprise", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${active ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-slate-200"}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[#f8fafc] p-4 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Dashboard</p>
              <p className="text-sm font-semibold text-gray-800">Bonjour, Ibrahim 👋</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                <span className="text-base">🇸🇳</span> Sénégal <ChevronDown className="w-3 h-3" />
              </div>
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-black">IB</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Solde Disponible", value: "2 450 000", currency: "XOF", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Montant Encaissé", value: "8 348 000", currency: "XOF", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Reversements", value: "01 Demande", currency: "", icon: Download, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Chiffre d'affaires", value: "984 093", currency: "XOF", icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
            ].map(({ label, value, currency, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-3 h-3 ${color}`} />
                </div>
                <p className="text-[9px] text-gray-400 font-medium mb-0.5 truncate">{label}</p>
                <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
                {currency && <p className="text-[9px] text-gray-400">{currency}</p>}
              </div>
            ))}
          </div>
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-gray-700">Transactions · Mars 2025</p>
              <div className="flex items-center gap-3 text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Succès: 56 269</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Échec: 312</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[35, 52, 41, 68, 45, 78, 55, 85, 62, 90, 71, 95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                  <div style={{ height: `${h}%` }} className={`rounded-sm transition-all ${i === 11 ? "bg-primary" : "bg-primary/25"}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"].map((m) => (
                <span key={m} className="text-[8px] text-gray-300 flex-1 text-center">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const t = useT();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-20 overflow-hidden bg-background">
        <DecorativeLeft />
        <DecorativeRight />
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col items-center text-center">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary tracking-wide">{t.home.badge}</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.08] max-w-4xl">
              {t.home.heroTitle1}{" "}
              <span className="text-primary">{t.home.heroTitle2}</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-normal">
              {t.home.heroDesc}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-16">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-md group">
                  {t.home.startBuilding} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/docs/payin">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium border-border rounded-xl hover:bg-secondary">
                  {t.home.payinDocs}
                </Button>
              </Link>
              <Link href="/docs/payout">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium border-border rounded-xl hover:bg-secondary">
                  {t.home.payoutDocs}
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="w-full">
              <DashboardMockup />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-border bg-card/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))
            ) : stats ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-foreground mb-1">{stats.totalVolume}</span>
                  <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">{t.home.statsVolume}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-foreground mb-1">{(stats.uptimePercent || 99.99).toFixed(2)}%</span>
                  <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">{t.home.statsUptime}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-foreground mb-1">{stats.supportedCountries}</span>
                  <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">{t.home.statsCountries}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-foreground mb-1">{stats.merchantsOnboarded.toLocaleString()}+</span>
                  <span className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">{t.home.statsBusinesses}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Feature highlight — inspired by Paxity "Garantissez..." section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
            {t.home.featuresTitle}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t.home.featuresDesc}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[Zap, Globe, ShieldCheck, Code, CreditCard, ShieldCheck].map((Icon, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all group cursor-default">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{t.home.features[i].title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t.home.features[i].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Integration */}
      <section className="py-24 bg-card/40 border-y border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-5 text-foreground tracking-tight leading-tight">{t.home.integrationTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t.home.integrationDesc}</p>
              <ul className="space-y-4">
                {t.home.integrationFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border bg-[#0d1117] shadow-2xl">
              <div className="flex items-center px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-xs text-[#8b949e] font-mono">create-payment.ts</div>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm font-mono text-[#c9d1d9] leading-relaxed">
                  <span className="text-[#ff7b72]">import</span> {'{'} DrimPay {'}'} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'drimpay-node'</span>;<br /><br />
                  <span className="text-[#ff7b72]">const</span> drimpay = <span className="text-[#ff7b72]">new</span> <span className="text-[#d2a8ff]">DrimPay</span>(<span className="text-[#79c0ff]">process.env.DRIMPAY_SECRET_KEY</span>);<br /><br />
                  <span className="text-[#ff7b72]">const</span> charge = <span className="text-[#ff7b72]">await</span> drimpay.charges.<span className="text-[#d2a8ff]">create</span>({'{'}<br />
                  {'  '}<span className="text-[#79c0ff]">amount</span>: <span className="text-[#a5d6ff]">5000</span>,<br />
                  {'  '}<span className="text-[#79c0ff]">currency</span>: <span className="text-[#a5d6ff]">'XOF'</span>,<br />
                  {'  '}<span className="text-[#79c0ff]">method</span>: <span className="text-[#a5d6ff]">'mobile_money'</span>,<br />
                  {'  '}<span className="text-[#79c0ff]">customer</span>: {'{'}<br />
                  {'    '}<span className="text-[#79c0ff]">phone_number</span>: <span className="text-[#a5d6ff]">'+2250102030405'</span><br />
                  {'  }'},<br />
                  {'  '}<span className="text-[#79c0ff]">reference</span>: <span className="text-[#a5d6ff]">'txn_123456789'</span><br />
                  {'}'});<br /><br />
                  <span className="text-[#8b949e]">{t.home.codeComment}</span><br />
                  console.<span className="text-[#d2a8ff]">log</span>(charge.status); <span className="text-[#8b949e]">// 'pending'</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full border border-background/30" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full border border-background/20" />
        </div>
        <div className="container mx-auto px-4 md:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-extrabold text-background mb-6 tracking-tight leading-tight">{t.home.ctaTitle}</h2>
          <p className="text-lg md:text-xl text-background/60 max-w-2xl mx-auto mb-10">{t.home.ctaDesc}</p>
          <Link href="/signup">
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary text-black hover:bg-primary/90 hover:scale-105 transition-all rounded-xl shadow-lg shadow-primary/20">
              {t.home.ctaBtn} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
