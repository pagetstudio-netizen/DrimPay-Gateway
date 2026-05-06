import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetPlatformStats, useListSupportedCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Globe, Code, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: countries, isLoading: countriesLoading } = useListSupportedCountries();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-[-1]" />
        
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                <span className="text-xs font-medium tracking-wide">API v2.0 is now live</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-foreground leading-[1.1]">
                Build payments<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  for Africa.
                </span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-light">
                Digital Reliable Infrastructure for Money. One unified API to handle Payins, Payouts, and Virtual Wallets across West & Central Africa.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold text-primary-foreground group">
                    Start Building <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/docs/payin">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border/50 hover:bg-secondary">
                    Pay-in Docs
                  </Button>
                </Link>
                <Link href="/docs/payout">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border/50 hover:bg-secondary">
                    Pay-out Docs
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
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
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Volume Processed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{(stats.uptimePercent || 99.99).toFixed(2)}%</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Platform Uptime</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stats.supportedCountries}</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Active Countries</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stats.merchantsOnboarded.toLocaleString()}+</span>
                  <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Businesses</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Integration that doesn't feel like a chore.</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our APIs are designed by developers, for developers. Restful, predictable, and fully typed. Get up and running in minutes, not weeks.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Idempotent API endpoints to prevent duplicate charges",
                  "Comprehensive webhooks for real-time state sync",
                  "Sandbox environment for safe testing",
                  "SDKs available for Node.js, Python, and PHP"
                ].map((feature, i) => (
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
                  <span className="text-[#ff7b72]">import</span> {'{'} DrimPay {'}'} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'drimpay-node'</span>;<br/><br/>
                  <span className="text-[#ff7b72]">const</span> drimpay = <span className="text-[#ff7b72]">new</span> <span className="text-[#d2a8ff]">DrimPay</span>(<span className="text-[#79c0ff]">process.env.DRIMPAY_SECRET_KEY</span>);<br/><br/>
                  <span className="text-[#ff7b72]">const</span> charge = <span className="text-[#ff7b72]">await</span> drimpay.charges.<span className="text-[#d2a8ff]">create</span>({'{'}<br/>
                  {'  '}<span className="text-[#79c0ff]">amount</span>: <span className="text-[#a5d6ff]">5000</span>,<br/>
                  {'  '}<span className="text-[#79c0ff]">currency</span>: <span className="text-[#a5d6ff]">'XOF'</span>,<br/>
                  {'  '}<span className="text-[#79c0ff]">method</span>: <span className="text-[#a5d6ff]">'mobile_money'</span>,<br/>
                  {'  '}<span className="text-[#79c0ff]">customer</span>: {'{'}<br/>
                  {'    '}<span className="text-[#79c0ff]">email</span>: <span className="text-[#a5d6ff]">'customer@example.com'</span>,<br/>
                  {'    '}<span className="text-[#79c0ff]">phone_number</span>: <span className="text-[#a5d6ff]">'+2250102030405'</span><br/>
                  {'  }'},<br/>
                  {'  '}<span className="text-[#79c0ff]">reference</span>: <span className="text-[#a5d6ff]">'txn_123456789'</span><br/>
                  {'}'});<br/><br/>
                  <span className="text-[#8b949e]">// Returns a hosted payment link or processes directly via direct API</span><br/>
                  console.<span className="text-[#d2a8ff]">log</span>(charge.status); <span className="text-[#8b949e]">// 'pending'</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete infrastructure for scale.</h2>
            <p className="text-muted-foreground text-lg">Everything you need to accept payments and move money, out of the box.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Payouts",
                desc: "Send money to mobile money wallets or bank accounts instantly across multiple corridors."
              },
              {
                icon: Globe,
                title: "Cross-Border Wallets",
                desc: "Hold balances in multiple local currencies. Settle funds where and how you need them."
              },
              {
                icon: ShieldCheck,
                title: "Automated KYB",
                desc: "Verify business identities effortlessly with our automated KYB compliance pipelines."
              },
              {
                icon: Code,
                title: "Headless API",
                desc: "Build completely custom checkout experiences without iframe redirects or hosted pages."
              },
              {
                icon: Zap,
                title: "Virtual Cards",
                desc: "Issue virtual cards linked to your wallet balance for global online purchases."
              },
              {
                icon: ShieldCheck,
                title: "Fraud Engine",
                desc: "Enterprise-grade fraud detection built into every transaction layer automatically."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-[-2]" />
        <div className="absolute inset-0 bg-black/80 z-[-1]" />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to scale your fintech?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">Join thousands of forward-thinking businesses building the future of money in Africa with DrimPay.</p>
          <Link href="/signup">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary text-black hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_40px_rgba(197,255,74,0.3)]">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}