import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT, useLang } from "@/lib/i18n";

const SOCIAL_ICONS: Record<string, ReactNode> = {
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  whatsapp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  telegram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
};

const DEFAULT_PLATFORMS = ["facebook", "x", "linkedin", "whatsapp", "youtube", "telegram"];

function FooterSocials() {
  const [adminLinks, setAdminLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/support/links")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          const map: Record<string, string> = {};
          d.forEach((l: any) => { if (l.platform && l.url) map[l.platform.toLowerCase()] = l.url; });
          setAdminLinks(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {DEFAULT_PLATFORMS.map((platform) => {
        const icon = SOCIAL_ICONS[platform];
        if (!icon) return null;
        const href = adminLinks[platform] || "#";
        return (
          <a
            key={platform}
            href={href}
            target={href !== "#" ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label={platform}
          >
            {icon}
          </a>
        );
      })}
    </div>
  );
}

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
              <FooterSocials />
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
            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} DrimPay. {t.footer.rights}</p>
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
                  <strong className="text-foreground/80">DrimPay</strong> est une société technologique privée spécialisée dans les infrastructures de paiement numérique et les solutions fintech destinées à l'Afrique de l'Ouest et Centrale.
                </p>
                <p>Les services proposés peuvent inclure : collecte de paiements Mobile Money, envoi de paiements (Pay-out), liens de paiement, APIs de paiement, outils marchands et solutions fintech. Toutes les opérations sont soumises aux réglementations locales applicables, aux politiques de lutte contre le blanchiment d'argent (AML), de lutte contre le financement du terrorisme (CFT) ainsi qu'aux procédures de vérification KYC/KYB.</p>
                <p>
                  En utilisant DrimPay, vous acceptez les Conditions Générales d'Utilisation, la Politique de Confidentialité, les politiques AML/KYC/KYB ainsi que les règles de conformité et de sécurité de la plateforme. DrimPay se réserve le droit de suspendre, limiter ou refuser tout compte ou transaction suspecte afin de garantir la sécurité de son infrastructure et la conformité réglementaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
