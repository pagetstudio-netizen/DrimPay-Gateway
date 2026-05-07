import { DashboardLayout } from "../layout";
import comingSoon from "@assets/coming-soon_(1)_1778180144830.png";

export default function DocMassPayout() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <img
          src={comingSoon}
          alt="Bientôt disponible"
          className="w-full max-w-lg object-contain select-none"
          draggable={false}
        />
        <p className="mt-4 text-sm text-gray-400 text-center">
          L'API Paiement de Masse sera disponible très prochainement.
        </p>
      </div>
    </DashboardLayout>
  );
}
