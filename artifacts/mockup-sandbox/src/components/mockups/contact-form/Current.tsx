import { ArrowRight } from "lucide-react";
import "./_group.css";

const inputClass =
  "flex h-9 w-full rounded-md border border-[#E5E3DC] bg-transparent px-3 py-1 text-sm text-[#0f0f0f] shadow-sm transition-colors placeholder:text-[#66645f] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#83b51d] disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  id,
  label,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#0f0f0f]">
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

export function Current() {
  return (
    <main
      className="min-h-screen w-full bg-[#F8F6F1] p-5 sm:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[760px] rounded-2xl border border-[#E5E3DC] bg-white p-6 shadow-sm sm:p-8">
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field id="current-name" label="Full Name" placeholder="Aminata Diallo" />
            <Field
              id="current-email"
              label="Email Address"
              placeholder="aminata@company.com"
              type="email"
            />
          </div>
          <Field id="current-company" label="Company (Optional)" placeholder="Your company name" />
          <Field id="current-subject" label="Subject" placeholder="API Integration Help" />
          <div className="space-y-2">
            <label htmlFor="current-message" className="text-sm font-semibold text-[#0f0f0f]">
              Message
            </label>
            <textarea
              id="current-message"
              placeholder="Tell us how we can help..."
              rows={6}
              className="flex min-h-[60px] w-full rounded-md border border-[#E5E3DC] bg-transparent px-3 py-2 text-sm text-[#0f0f0f] shadow-sm placeholder:text-[#66645f] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#83b51d] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f0f0f] bg-[#0f0f0f] px-8 py-2 text-sm font-semibold text-white shadow-md transition-colors"
          >
            Send Message <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}