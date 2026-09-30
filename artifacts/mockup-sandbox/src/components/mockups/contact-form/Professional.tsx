import { ArrowRight } from "lucide-react";
import "./_group.css";

const inputClass =
  "mt-2 h-[58px] w-full rounded-full border border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] outline-none transition placeholder:text-[#9a9b96] hover:border-[#cfD0c8] focus:border-[#8ebc2c] focus:ring-4 focus:ring-[#B5F03C]/20";

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
    <div>
      <label htmlFor={id} className="block text-[15px] font-semibold leading-5 text-[#171813]">
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

export function Professional() {
  return (
    <main
      className="min-h-screen w-full bg-[#F8F6F1] p-5 sm:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[760px] rounded-[28px] border border-[#E7E5DE] bg-white p-6 shadow-[0_22px_60px_rgba(32,35,20,0.09)] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-1.5 w-10 rounded-full bg-[#B5F03C]" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#777970]">
            Contact DrimPay
          </span>
        </div>

        <form className="flex flex-col gap-7">
          <Field id="professional-name" label="Full Name" placeholder="Aminata Diallo" />
          <Field
            id="professional-email"
            label="Email Address"
            placeholder="aminata@company.com"
            type="email"
          />
          <Field
            id="professional-company"
            label="Company (Optional)"
            placeholder="Your company name"
          />
          <Field id="professional-subject" label="Subject" placeholder="API Integration Help" />
          <div>
            <label
              htmlFor="professional-message"
              className="block text-[15px] font-semibold leading-5 text-[#171813]"
            >
              Message
            </label>
            <textarea
              id="professional-message"
              placeholder="Tell us how we can help..."
              rows={6}
              className="mt-2 min-h-[184px] w-full resize-y rounded-[24px] border border-[#E5E5E0] bg-white px-5 py-4 text-base leading-6 text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] outline-none transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus:border-[#8ebc2c] focus:ring-4 focus:ring-[#B5F03C]/20"
            />
          </div>
          <button
            type="button"
            className="group inline-flex min-h-[62px] w-full items-center justify-center rounded-full border border-[#a7dc35] bg-[#B5F03C] px-7 text-base font-bold text-[#11130c] shadow-[0_12px_28px_rgba(143,190,43,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c5ff4a] hover:shadow-[0_16px_32px_rgba(143,190,43,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B5F03C]/30"
          >
            Send Message
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </main>
  );
}