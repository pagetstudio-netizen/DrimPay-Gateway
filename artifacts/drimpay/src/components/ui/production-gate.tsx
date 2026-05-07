import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Lock, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type KybStatus = "pending" | "submitted" | "under_review" | "approved" | "rejected";

interface ProductionGateProps {
  children: React.ReactNode;
}

export function ProductionGate({ children }: ProductionGateProps) {
  const [status, setStatus] = useState<KybStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStatus(d.kybStatus ?? "pending"))
      .catch(() => setStatus("pending"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[340px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "approved") {
    return <>{children}</>;
  }

  const isReview = status === "submitted" || status === "under_review";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center min-h-[420px] px-6 py-12"
    >
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg
        ${isReview ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted border border-border"}`}>
        {isReview
          ? <Clock className="w-9 h-9 text-yellow-500" />
          : <Lock className="w-9 h-9 text-muted-foreground" />
        }
      </div>

      <div className="text-center max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4
          bg-muted text-muted-foreground border border-border">
          <span className={`w-1.5 h-1.5 rounded-full ${isReview ? "bg-yellow-500" : "bg-muted-foreground"}`} />
          {isReview ? "Vérification en cours" : "Mode Sandbox"}
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {isReview ? "Votre compte est en cours de validation" : "Cette fonctionnalité nécessite un compte Live"}
        </h2>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {isReview
            ? "Nos équipes examinent vos documents. Vous serez notifié par e-mail dès validation. Cela prend généralement 1 à 2 jours ouvrables."
            : "Pour accéder aux wallets, transferts et clés API live, vous devez compléter la vérification KYB de votre entreprise et passer en mode Production."}
        </p>

        {!isReview && (
          <div className="space-y-3 mb-8 text-left bg-muted/30 rounded-xl p-4 border border-border">
            {[
              { step: "1", label: "Soumettre vos documents d'entreprise", done: false },
              { step: "2", label: "Vérification par nos équipes (1-2 jours)", done: false },
              { step: "3", label: "Activation du compte Live", done: false },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{step}</span>
                </div>
                <p className="text-sm text-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {!isReview ? (
          <Link href="/dashboard/kyb">
            <Button className="gap-2 h-11 px-6">
              <ShieldCheck className="w-4 h-4" />
              Démarrer la vérification KYB
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-sm text-yellow-600 font-medium">
            <Clock className="w-4 h-4" />
            Vérification en cours — nous vous contacterons par e-mail
          </div>
        )}
      </div>
    </motion.div>
  );
}
