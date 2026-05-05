import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using the DrimPay platform, API, or any associated services (collectively, the \"Services\"), you agree to be bound by these Terms and Conditions (\"Terms\"). If you are accessing the Services on behalf of a business entity, you represent that you have authority to bind that entity to these Terms. If you do not agree to these Terms, you may not use the Services.\n\nDrimPay reserves the right to modify these Terms at any time. Continued use of the Services after notification of changes constitutes acceptance of the revised Terms."
  },
  {
    title: "2. Eligibility and Account Registration",
    content: "To use DrimPay Services, you must be at least 18 years of age and a legal resident or registered business entity in a supported jurisdiction. You must provide accurate, current, and complete information during registration and maintain the accuracy of such information.\n\nBusiness accounts require successful completion of our Know Your Business (KYB) verification process before accessing live payment features. You are responsible for maintaining the confidentiality of your account credentials and API keys."
  },
  {
    title: "3. Permitted Use and API Usage",
    content: "DrimPay grants you a limited, non-exclusive, non-transferable license to access and use the Services for lawful purposes consistent with these Terms. You may use the API to integrate DrimPay payment functionality into your legitimate business applications.\n\nProhibited uses include but are not limited to: facilitating fraudulent transactions, money laundering, terrorist financing, gambling (where prohibited), adult content platforms, multi-level marketing schemes, or any activity that violates applicable law."
  },
  {
    title: "4. Payment Processing and Fees",
    content: "DrimPay charges a transaction fee of 3% on successful Payin and Payout transactions. Additional fees may apply for specific services such as virtual card issuance or airtime top-ups. All fees are deducted automatically from the transaction amount or your wallet balance at the time of processing.\n\nFees are subject to change with 30 days prior notice. Volume discounts may be available for high-volume accounts as separately negotiated. DrimPay does not charge fees on failed transactions."
  },
  {
    title: "5. Wallet and Settlement",
    content: "Funds collected through DrimPay's Payin API are held in segregated wallets on your behalf. DrimPay does not commingle client funds with operational funds. Standard settlement occurs on a T+1 basis to your designated bank account. Verified business accounts may qualify for same-day settlement.\n\nDrimPay reserves the right to delay settlement if suspicious activity is detected or regulatory obligations require review. Such delays will not exceed 72 hours absent extraordinary circumstances or regulatory requirements."
  },
  {
    title: "6. KYB and Compliance",
    content: "All business accounts must complete DrimPay's KYB verification process. You agree to provide accurate, complete, and current documentation as requested. DrimPay may periodically request updated documentation to maintain compliance with applicable anti-money laundering (AML) and counter-terrorist financing (CTF) regulations.\n\nDrimPay may suspend or terminate accounts that fail to maintain satisfactory KYB status or that are found to be associated with prohibited activities. Such decisions are final and DrimPay's liability in such cases is limited to returning available wallet balances."
  },
  {
    title: "7. Limitation of Liability",
    content: "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DRIMPAY'S TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO DRIMPAY IN THE THREE MONTHS PRECEDING THE CLAIM.\n\nDRIMPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES."
  },
  {
    title: "8. Governing Law and Dispute Resolution",
    content: "These Terms are governed by the laws of the Republic of Togo. Any dispute arising from or related to these Terms or the Services shall first be submitted to good-faith negotiation. If not resolved within 30 days, disputes shall be submitted to binding arbitration under the rules of the International Chamber of Commerce (ICC).\n\nNothing in these Terms prevents either party from seeking injunctive or other equitable relief in a court of competent jurisdiction to prevent irreparable harm."
  },
  {
    title: "9. Termination",
    content: "Either party may terminate this agreement with 30 days written notice. DrimPay may immediately suspend or terminate access to the Services upon breach of these Terms, fraudulent activity, regulatory requirement, or at DrimPay's sole discretion with cause.\n\nUpon termination, any outstanding wallet balances (less applicable fees and regulatory holds) will be settled to your designated account within 10 business days. All API keys will be revoked immediately upon termination."
  },
  {
    title: "10. Contact Information",
    content: "For questions about these Terms, please contact DrimPay's Legal Team at legal@drimpay.io or write to: DrimPay Inc., DrimPay Tower, Rue du Commerce, Lomé, Togo 01 BP 3578. These Terms were last updated on May 1, 2025."
  }
];

export default function Terms() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms & Conditions</h1>
            <p className="text-muted-foreground">Effective date: May 1, 2025 · Last updated: May 1, 2025</p>
          </div>

          <div className="flex flex-col gap-10">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
