import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/lib/i18n";

/* ── constants ───────────────────────────────────────────────────────────── */
export const SITE_URL = "https://drimpay.io";
export const SITE_NAME = "DrimPay";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;

/* ── types ───────────────────────────────────────────────────────────────── */
export interface SEOConfig {
  /** Page-specific title — " — DrimPay" suffix is added automatically unless already present */
  title: string;
  /** 130–160 characters recommended */
  description: string;
  /** Extra comma-separated keywords to append to global list */
  keywords?: string;
  /** Open Graph type (default: website) */
  ogType?: "website" | "article" | "profile" | "product";
  /** Override OG image (default: /opengraph.jpg) */
  ogImage?: string;
  /** Don't index this page */
  noIndex?: boolean;
  /**
   * JSON-LD structured data — a single object or array of objects.
   * Already serialized and injected as <script type="application/ld+json">.
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function getOrCreateMeta(attr: "name" | "property", value: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  return el;
}

function getOrCreateLink(rel: string, id?: string): HTMLLinkElement {
  const selector = id ? `link[rel="${rel}"][data-seo="${id}"]` : `link[rel="${rel}"]`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (id) el.setAttribute("data-seo", id);
    document.head.appendChild(el);
  }
  return el;
}

function removeLinks(rel: string, dataSeo: string) {
  document.querySelectorAll(`link[rel="${rel}"][data-seo="${dataSeo}"]`)
    .forEach(el => el.remove());
}

/* ── main hook ───────────────────────────────────────────────────────────── */
export function useSEO(config: SEOConfig) {
  const [location] = useLocation();
  const lang = useLang();

  useEffect(() => {
    /* ── Title ─────────────────────────────────────────────────────────── */
    const fullTitle = config.title.includes(SITE_NAME)
      ? config.title
      : `${config.title} — ${SITE_NAME}`;
    document.title = fullTitle;

    /* ── Canonical & full URL ──────────────────────────────────────────── */
    const path = location === "/" ? "" : location;
    const canonicalUrl = `${SITE_URL}/${lang}${path}`;
    const altUrl = (otherLang: string) => `${SITE_URL}/${otherLang}${path}`;

    const canonical = getOrCreateLink("canonical");
    canonical.href = canonicalUrl;

    /* ── hreflang alternate links ──────────────────────────────────────── */
    removeLinks("alternate", "hreflang-fr");
    removeLinks("alternate", "hreflang-en");
    removeLinks("alternate", "hreflang-xdefault");

    const hreflangFr = getOrCreateLink("alternate", "hreflang-fr");
    hreflangFr.setAttribute("hreflang", "fr");
    hreflangFr.href = altUrl("fr");

    const hreflangEn = getOrCreateLink("alternate", "hreflang-en");
    hreflangEn.setAttribute("hreflang", "en");
    hreflangEn.href = altUrl("en");

    const hreflangDefault = getOrCreateLink("alternate", "hreflang-xdefault");
    hreflangDefault.setAttribute("hreflang", "x-default");
    hreflangDefault.href = altUrl("fr");

    /* ── Standard meta ─────────────────────────────────────────────────── */
    getOrCreateMeta("name", "description").content = config.description;

    const baseKeywords = "DrimPay, Mobile Money, paiement Afrique, Orange Money, Wave, MTN, Moov, API paiement";
    getOrCreateMeta("name", "keywords").content = config.keywords
      ? `${config.keywords}, ${baseKeywords}`
      : baseKeywords;

    getOrCreateMeta("name", "robots").content =
      config.noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large";

    /* ── Open Graph ────────────────────────────────────────────────────── */
    const ogImage = config.ogImage ?? DEFAULT_OG_IMAGE;
    getOrCreateMeta("property", "og:title").content = fullTitle;
    getOrCreateMeta("property", "og:description").content = config.description;
    getOrCreateMeta("property", "og:url").content = canonicalUrl;
    getOrCreateMeta("property", "og:type").content = config.ogType ?? "website";
    getOrCreateMeta("property", "og:image").content = ogImage;
    getOrCreateMeta("property", "og:site_name").content = SITE_NAME;
    getOrCreateMeta("property", "og:locale").content = lang === "fr" ? "fr_FR" : "en_US";

    /* ── Twitter Card ──────────────────────────────────────────────────── */
    getOrCreateMeta("name", "twitter:title").content = fullTitle;
    getOrCreateMeta("name", "twitter:description").content = config.description;
    getOrCreateMeta("name", "twitter:url").content = canonicalUrl;
    getOrCreateMeta("name", "twitter:image").content = ogImage;
    getOrCreateMeta("name", "twitter:card").content = "summary_large_image";

    /* ── JSON-LD ───────────────────────────────────────────────────────── */
    let jsonLdEl = document.getElementById("page-seo-jsonld");
    if (config.jsonLd) {
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.id = "page-seo-jsonld";
        jsonLdEl.setAttribute("type", "application/ld+json");
        document.head.appendChild(jsonLdEl);
      }
      const data = Array.isArray(config.jsonLd)
        ? { "@context": "https://schema.org", "@graph": config.jsonLd }
        : config.jsonLd;
      jsonLdEl.textContent = JSON.stringify(data);
    } else if (jsonLdEl) {
      jsonLdEl.remove();
    }
  }, [config.title, config.description, location, lang]);
}

/* ── SHARED JSON-LD FRAGMENTS ────────────────────────────────────────────── */
export const organizationSchema = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/favicon.svg`,
    width: 512,
    height: 512,
  },
  description:
    "Passerelle de paiement Mobile Money unifiée pour l'Afrique de l'Ouest et Centrale.",
  areaServed: [
    "Togo", "Bénin", "Sénégal", "Côte d'Ivoire",
    "Cameroun", "Mali", "Burkina Faso",
  ].map((name) => ({ "@type": "Country", name })),
  sameAs: [
    "https://twitter.com/drimpay",
    "https://linkedin.com/company/drimpay",
  ],
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description:
    "Infrastructure de paiement API-first pour l'Afrique de l'Ouest et Centrale.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: ["fr-FR", "en-US"],
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/fr/blog?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export function webPageSchema(
  url: string,
  name: string,
  description: string,
  breadcrumbs?: { name: string; url: string }[]
) {
  const base: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  if (breadcrumbs) {
    base.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/fr` },
        ...breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: b.name,
          item: b.url,
        })),
      ],
    };
  }
  return base;
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
