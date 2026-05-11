import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, Github, Twitter, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT, useLang } from "@/lib/i18n";

const VITE_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function LangSwitcher() {
  const lang = useLang();
  const [location] = useLocation();
  const otherLang = lang === "fr" ? "en" : "fr";
  const otherLabel = lang === "fr" ? "EN" : "FR";
  const path = location === "/" ? "" : location;
  const href = `${VITE_BASE}/${otherLang}${path}`;

  return (
    <a
      href={href}
      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      title={otherLang === "fr" ? "Passer en Français" : "Switch to English"}
    >
      <Globe className="w-3.5 h-3.5" />
      {otherLabel}
    </a>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const t = useT();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-foreground font-sans">
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-border py-3"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo-drimpay.png" alt="DrimPay" className="h-9 w-auto object-contain transform group-hover:scale-105 transition-transform" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t.nav.platform}</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t.nav.pricing}</Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t.nav.developers}</Link>
            <Link href="/businesses" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t.nav.businesses}</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LangSwitcher />
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">{t.nav.signin}</Link>
            <Link href="/signup">
              <Button className="font-semibold bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 border-0">
                {t.nav.getApiKey} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-24 px-4 pb-8 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <Link href="/how-it-works" className="text-xl font-semibold border-b border-border pb-4">{t.nav.platform}</Link>
            <Link href="/pricing" className="text-xl font-semibold border-b border-border pb-4">{t.nav.pricing}</Link>
            <Link href="/docs" className="text-xl font-semibold border-b border-border pb-4">{t.nav.developers}</Link>
            <Link href="/businesses" className="text-xl font-semibold border-b border-border pb-4">{t.nav.businesses}</Link>
            <Link href="/login" className="text-xl font-semibold border-b border-border pb-4">{t.nav.signin}</Link>
            <div className="flex items-center gap-4">
              <LangSwitcher />
            </div>
            <Link href="/signup">
              <Button size="lg" className="w-full text-lg bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/85 border-0">{t.nav.getApiKey}</Button>
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 pt-0">
        {children}
      </main>

      <footer className="bg-card border-t border-border pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <img src="/logo-drimpay.png" alt="DrimPay" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">{t.footer.desc}</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-6">{t.footer.product}</h4>
              <ul className="flex flex-col gap-4">
                <li><Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.howItWorks}</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.pricing}</Link></li>
                <li><Link href="/countries" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.countries}</Link></li>
                <li><Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.security}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">{t.footer.developers}</h4>
              <ul className="flex flex-col gap-4">
                <li><Link href="/docs/payin" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.payinDocs}</Link></li>
                <li><Link href="/docs/payout" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.payoutDocs}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">{t.footer.company}</h4>
              <ul className="flex flex-col gap-4">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.about}</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.blog}</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.careers}</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">{t.footer.contact}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} DrimPay — Ashtech Sarl. {t.footer.rights}</p>
            <div className="flex gap-6 items-center">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.terms}</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.privacy}</Link>
              <LangSwitcher />
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-8 border-t border-amber-500/30 pt-8">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-5">
              <p className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
                ⚠️ AVERTISSEMENT IMPORTANT
              </p>
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground/80">DrimPay n'est PAS une banque ni une institution financière.</strong> DrimPay agit uniquement comme une société FINTECH facilitant ses services en partenariat avec des partenaires agréés et licenciés dans leurs juridictions respectives. Nous ne réalisons aucune activité bancaire et ne fournissons pas de services bancaires traditionnels.
                </p>
                <p>
                  En utilisant les plateformes web, applications mobiles, APIs et services associés de DrimPay, vous reconnaissez et acceptez que DrimPay n'est pas une banque. Toutes les transactions financières, opérations de paiement, de retrait, de collecte ou de transfert sont fournies directement ou indirectement via des partenaires tiers autorisés.
                </p>
                <p>
                  <strong className="text-foreground/80">"DrimPay"</strong> est le nom commercial de <strong className="text-foreground/80">ASHTECH SARL</strong> ainsi que de ses sociétés affiliées, filiales et partenaires associés. ASHTECH SARL est une société technologique privée spécialisée dans les infrastructures de paiement numérique et les solutions fintech destinées à l'Afrique de l'Ouest et Centrale.
                </p>
                <p>Les services proposés peuvent inclure : collecte de paiements Mobile Money, envoi de paiements (Pay-out), liens de paiement, APIs de paiement, outils marchands et solutions fintech. Toutes les opérations sont soumises aux réglementations locales applicables, aux politiques de lutte contre le blanchiment d'argent (AML), de lutte contre le financement du terrorisme (CFT) ainsi qu'aux procédures de vérification KYC/KYB.</p>
                <p>
                  En utilisant DrimPay, vous acceptez les Conditions Générales d'Utilisation, la Politique de Confidentialité, les politiques AML/KYC/KYB ainsi que les règles de conformité et de sécurité de la plateforme. ASHTECH SARL se réserve le droit de suspendre, limiter ou refuser tout compte ou transaction suspecte afin de garantir la sécurité de son infrastructure et la conformité réglementaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
