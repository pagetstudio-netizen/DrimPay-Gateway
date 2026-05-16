import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Banner = {
  id: number;
  message: string;
  color: string;
  customColor: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  active: boolean;
};

const COLOR_STYLES: Record<string, { bg: string; text: string; btn: string; btnText: string; close: string }> = {
  blue:   { bg: "#1d4ed8", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  green:  { bg: "#15803d", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  yellow: { bg: "#d97706", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  red:    { bg: "#dc2626", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  purple: { bg: "#7c3aed", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  orange: { bg: "#ea580c", text: "#ffffff", btn: "rgba(255,255,255,0.2)", btnText: "#ffffff", close: "rgba(255,255,255,0.6)" },
  dark:   { bg: "#0f0f0f", text: "#ffffff", btn: "#C5FF4A",               btnText: "#0f0f0f",  close: "rgba(255,255,255,0.5)" },
  lime:   { bg: "#C5FF4A", text: "#0f0f0f", btn: "#0f0f0f",               btnText: "#C5FF4A",  close: "rgba(0,0,0,0.4)" },
};

function getBannerStyle(banner: Banner) {
  if (banner.color === "custom" && banner.customColor) {
    return {
      bg: banner.customColor,
      text: "#ffffff",
      btn: "rgba(255,255,255,0.2)",
      btnText: "#ffffff",
      close: "rgba(255,255,255,0.6)",
    };
  }
  return COLOR_STYLES[banner.color] ?? COLOR_STYLES.blue;
}

const DISMISSED_KEY = "drimpay_dismissed_banners";

function getDismissed(): number[] {
  try { return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? "[]"); } catch { return []; }
}
function addDismissed(id: number) {
  try {
    const prev = getDismissed();
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]));
  } catch {}
}

export function GlobalBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
    fetch(`${BASE}/api/banners/active`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBanners(d); })
      .catch(() => {});
  }, []);

  const visible = banners.filter(b => !dismissed.includes(b.id));

  const dismiss = (id: number) => {
    addDismissed(id);
    setDismissed(prev => [...prev, id]);
  };

  return (
    <AnimatePresence>
      {visible.map((banner) => {
        const style = getBannerStyle(banner);
        return (
          <motion.div
            key={banner.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden shrink-0"
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 min-h-[44px]"
              style={{ backgroundColor: style.bg, color: style.text }}
            >
              {banner.imageUrl && (
                <img
                  src={banner.imageUrl}
                  alt=""
                  className="h-7 w-7 rounded object-cover shrink-0"
                />
              )}
              <p className="flex-1 text-sm font-medium leading-snug text-center">
                {banner.message}
              </p>
              {banner.buttonText && banner.buttonLink && (
                <a
                  href={banner.buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: style.btn, color: style.btnText }}
                >
                  {banner.buttonText}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => dismiss(banner.id)}
                className="shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
                aria-label="Fermer"
              >
                <X className="w-3.5 h-3.5" style={{ color: style.close }} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
