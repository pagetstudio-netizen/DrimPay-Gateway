import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetPlatformStats, useListSupportedCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Globe, Code, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const t = useT();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-[-1]" />
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-medium tracking-wide">{t.home.badge}</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
                {t.home.heroTitle1}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  {t.home.heroTitle2}
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-light">
                {t.home.heroDesc}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold text-primary-foreground group">
                    {t.home.startBuilding} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/docs/payin">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border/50 hover:bg-secondary">
                    {t.home.payinDocs}
                  </Button>
                </Link>
                <Link href="/docs/payout">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border/50 hover:bg-secondary">
                    {t.home.payoutDocs}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : stats ? (
              <>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stats.totalVolume}</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{t.home.statsVolume}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{(stats.uptimePercent || 99.99).toFixed(2)}%</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{t.home.statsUptime}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stats.supportedCountries}</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{t.home.statsCountries}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stats.merchantsOnboarded.toLocaleString()}+</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{t.home.statsBusinesses}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.home.integrationTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t.home.integrationDesc}</p>
              <ul className="space-y-4 mb-8">
                {t.home.integrationFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117] shadow-2xl">
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
                  {'    '}<span className="text-[#79c0ff]">email</span>: <span className="text-[#a5d6ff]">'customer@example.com'</span>,<br />
                  {'    '}<span className="text-[#79c0ff]">phone_number</span>: <span className="text-[#a5d6ff]">'+2250102030405'</span><br />
                  {'  }'},<br />
                  {'  '}<span className="text-[#79c0ff]">reference</span>: <span className="text-[#a5d6ff]">'txn_123456789'</span><br />
                  {'}'});<br /><br />
                  <span className="text-[#8b949e]">// {t.home.codeComment.replace("// ", "")}</span><br />
                  console.<span className="text-[#d2a8ff]">log</span>(charge.status); <span className="text-[#8b949e]">// 'pending'</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.home.featuresTitle}</h2>
            <p className="text-muted-foreground text-lg">{t.home.featuresDesc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[Zap, Globe, ShieldCheck, Code, Zap, ShieldCheck].map((Icon, i) => (
              <div key={i} className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t.home.features[i].title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.home.features[i].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden isolate">
        <div className="absolute inset-0 bg-primary" style={{ zIndex: -2 }} />
        <div className="absolute inset-0 bg-black/80" style={{ zIndex: -1 }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative" style={{ zIndex: 1 }}>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">{t.home.ctaTitle}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">{t.home.ctaDesc}</p>
          <Link href="/signup">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary text-black hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_40px_rgba(197,255,74,0.3)]">
              {t.home.ctaBtn}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
