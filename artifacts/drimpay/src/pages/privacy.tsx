import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Information We Collect",
    content: "DrimPay collects information you provide directly when creating an account, completing KYB verification, or using our Services. This includes:\n\n- Business information: company name, registration number, tax ID, business address\n- Personal information: name, email, phone number, government-issued ID of authorized representatives\n- Financial information: bank account details for settlement purposes\n- Transaction data: payment amounts, recipient details, timestamps, and transaction metadata\n- Technical data: API request logs, IP addresses, device information, and usage analytics\n- Communication data: support tickets, emails, and chat logs"
  },
  {
    title: "2. How We Use Your Information",
    content: "We use collected information for the following purposes:\n\n- Providing and improving our payment infrastructure services\n- Verifying your identity and business through our KYB process\n- Processing transactions and managing wallet balances\n- Complying with legal and regulatory obligations including AML/CTF requirements\n- Detecting and preventing fraud and unauthorized access\n- Sending service notifications, transaction confirmations, and security alerts\n- Analyzing platform usage to improve performance and user experience\n- Communicating about product updates and new features"
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: "DrimPay does not sell your personal data to third parties. We share information only in the following circumstances:\n\n- With mobile money operators and banking partners necessary to process your transactions\n- With regulatory authorities and law enforcement when required by law\n- With service providers who assist our operations under strict data processing agreements\n- With affiliates within the DrimPay group for operational purposes\n- In connection with a merger, acquisition, or sale of assets, with advance notice to affected users\n\nAll third parties with whom we share data are bound by appropriate data protection agreements."
  },
  {
    title: "4. Data Security",
    content: "DrimPay implements industry-standard security measures to protect your information:\n\n- TLS 1.3 encryption for all data in transit\n- AES-256 encryption for sensitive data at rest\n- Regular security audits and penetration testing\n- Role-based access controls limiting employee data access\n- Multi-factor authentication for all administrative access\n- Comprehensive audit logging of all system access and data modifications\n\nWhile we implement robust security measures, no system is completely immune to security risks. We encourage you to protect your API keys and account credentials."
  },
  {
    title: "5. Data Retention",
    content: "DrimPay retains your data for as long as necessary to provide Services and comply with legal obligations:\n\n- Active account data: retained for the duration of the account relationship\n- Transaction records: retained for 7 years to comply with financial regulations\n- API logs and security logs: retained for 12 months\n- Support communications: retained for 3 years\n- Marketing preferences: retained until you opt out\n\nUpon account termination, we will delete or anonymize personal data within 90 days, except where retention is required by law."
  },
  {
    title: "6. Your Rights",
    content: "Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n- Access: Request a copy of the personal data we hold about you\n- Correction: Request correction of inaccurate or incomplete data\n- Deletion: Request deletion of your data (subject to legal retention requirements)\n- Portability: Receive your data in a machine-readable format\n- Restriction: Request restriction of processing in certain circumstances\n- Objection: Object to processing based on legitimate interests\n\nTo exercise these rights, contact our Data Protection Officer at privacy@drimpay.io."
  },
  {
    title: "7. Cookies and Tracking",
    content: "DrimPay uses cookies and similar tracking technologies on our website for:\n\n- Essential cookies required for platform functionality and security\n- Analytics cookies to understand how users interact with our services\n- Preference cookies to remember your settings and preferences\n\nYou can control cookie preferences through your browser settings. Disabling essential cookies may affect platform functionality. We do not use advertising or tracking cookies for third-party advertising purposes."
  },
  {
    title: "8. International Data Transfers",
    content: "DrimPay operates primarily from Togo with infrastructure in multiple regions. Your data may be processed in countries outside your own. For transfers outside the WAEMU zone, we implement appropriate safeguards including standard contractual clauses and adequacy decisions where applicable.\n\nBy using our Services, you consent to the transfer of your information to our operating locations as described in this Policy."
  },
  {
    title: "9. Changes to This Policy",
    content: "DrimPay may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of material changes via email or prominent notice on our platform at least 30 days before the changes take effect.\n\nYour continued use of the Services after the effective date of changes constitutes acceptance of the updated Policy."
  },
  {
    title: "10. Contact Us",
    content: "For privacy-related questions, requests, or concerns, contact our Data Protection Officer:\n\nEmail: privacy@drimpay.io\nAddress: DrimPay Inc., DrimPay Tower, Rue du Commerce, Lomé, Togo 01 BP 3578\n\nFor EU/EEA residents, you also have the right to lodge a complaint with your local data protection supervisory authority."
  }
];

export default function Privacy() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
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
