import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import notFoundIllustration from "@assets/0_404-illustration_1783776728671.png";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f6fb] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-100 px-8 py-10 flex flex-col items-center text-center">
        <img
          src={notFoundIllustration}
          alt="Illustration page introuvable"
          className="w-56 h-auto mb-6 select-none"
          draggable={false}
        />

        <h1 className="text-2xl font-extrabold text-gray-900 leading-snug">
          Oups, la page n'a pas été trouvée
        </h1>

        <p className="mt-4 text-sm text-gray-500 leading-relaxed">
          Nous sommes vraiment désolés pour ce désagrément. Il semble que vous
          essayez d'accéder à une page qui a été supprimée ou qui n'a jamais existé.
        </p>

        <Link href="/" className="w-full mt-8">
          <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-bold py-3.5 hover:bg-primary/90 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </Link>
      </div>
    </div>
  );
}
