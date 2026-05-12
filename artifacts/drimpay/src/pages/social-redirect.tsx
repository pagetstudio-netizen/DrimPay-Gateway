import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { ExternalLink, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLATFORM_DEFAULTS: Record<string, { name: string; color: string }> = {
  facebook:  { name: "Facebook",  color: "#1877F2" },
  telegram:  { name: "Telegram",  color: "#26A5E4" },
  whatsapp:  { name: "WhatsApp",  color: "#25D366" },
  linkedin:  { name: "LinkedIn",  color: "#0A66C2" },
  x:         { name: "X (Twitter)", color: "#000000" },
  twitter:   { name: "X (Twitter)", color: "#000000" },
  youtube:   { name: "YouTube",   color: "#FF0000" },
  instagram: { name: "Instagram", color: "#E1306C" },
};

export default function SocialRedirect() {
  const [, params] = useRoute("/social/:platform");
  const platform = params?.platform?.toLowerCase() ?? "";
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/support/links`)
      .then(r => r.json())
      .then((links: any[]) => {
        const match = links.find(l =>
          l.platform?.toLowerCase().includes(platform) ||
          l.name?.toLowerCase().includes(platform)
        );
        if (match?.url) {
          setUrl(match.url);
          window.location.href = match.url;
        } else {
          setUrl(null);
        }
      })
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [platform]);

  const meta = PLATFORM_DEFAULTS[platform] ?? { name: platform, color: "#6366f1" };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-sm w-full text-center">
        <a href="/" className="inline-block mb-6">
          <img src="/logo-drimpay.png" alt="DrimPay" className="h-8 mx-auto" />
        </a>
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Redirection en cours…</p>
          </div>
        ) : url ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Vous êtes redirigé vers {meta.name}…</p>
            <a href={url} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
              <ExternalLink className="w-3.5 h-3.5" /> Cliquez ici si la redirection échoue
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <ExternalLink className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-800">Lien non configuré</p>
            <p className="text-sm text-gray-500">Ce réseau social n'est pas encore disponible.</p>
            <a href="/support" className="mt-3 text-sm text-blue-600 hover:underline">
              ← Retour au support
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
