import { motion } from "framer-motion";
import { useListSupportedCountries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Countries() {
  const { data: countries, isLoading } = useListSupportedCountries();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">Global Coverage</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">7 countries. Growing.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">DrimPay operates across West and Central Africa. Every country comes with multi-operator coverage, local currency wallets, and regulatory compliance built in.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {(countries ?? []).map((country, i) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                data-testid={`country-card-${country.code}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{country.flag}</span>
                  <div>
                    <h3 className="font-bold text-lg">{country.name}</h3>
                    <p className="text-sm text-muted-foreground">{country.currency} · {country.code}</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${country.payinEnabled ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {country.payinEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Payin
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${country.payoutEnabled ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {country.payoutEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Payout
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Operators</p>
                  <div className="flex flex-col gap-2">
                    {(country.operators ?? []).map((op, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{op.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{op.type}</span>
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

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { title: "BCEAO Zone", desc: "Togo, Benin, Burkina Faso, Mali, Senegal, and Côte d'Ivoire share a unified currency (XOF) and BCEAO regulatory framework, simplifying cross-border compliance." },
            { title: "BEAC Zone", desc: "Cameroon operates under the BEAC framework with XAF currency. DrimPay maintains full compliance with COBAC regulations for electronic money operations." },
            { title: "Expanding in 2025", desc: "Nigeria and Ghana are our next markets. Subscribe to our newsletter to be notified when we launch new country corridors." },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-bold text-lg mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center rounded-2xl bg-primary/10 border border-primary/20 p-10">
          <h2 className="text-2xl font-bold mb-4">Don't see your country?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">We're expanding rapidly. Register your interest and be first to access new corridors when we launch.</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">Contact Us <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
