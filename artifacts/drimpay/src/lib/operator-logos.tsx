import React from "react";

type LogoProps = { size?: number; className?: string };

export function TMoney({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#E31E24" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="Arial,sans-serif">T</text>
    </svg>
  );
}

export function MoovMoney({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#00A850" />
      <text x="18" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial,sans-serif">MOOV</text>
    </svg>
  );
}

export function MTNMoney({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#FFCC00" />
      <text x="18" y="22" textAnchor="middle" fill="#000" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif">MTN</text>
    </svg>
  );
}

export function OrangeMoney({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#FF6600" />
      <rect x="10" y="13" width="16" height="10" rx="2" fill="white" />
      <rect x="12" y="15" width="12" height="6" rx="1" fill="#FF6600" />
    </svg>
  );
}

export function Wave({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#1A1F6C" />
      <path d="M8 20 Q12 14 16 20 Q20 26 24 20 Q28 14 30 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function Wizall({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#6C3EC6" />
      <text x="18" y="22" textAnchor="middle" fill="white" fontSize="9" fontWeight="800" fontFamily="Arial,sans-serif">WIZA</text>
    </svg>
  );
}

export function Vodacom({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#E60000" />
      <text x="18" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="Arial,sans-serif">VODA</text>
    </svg>
  );
}

export function Airtel({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="18" fill="#CC0000" />
      <path d="M12 24 Q18 10 24 24" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function getOperatorLogo(operator: string, size = 36): React.ReactNode {
  const key = operator.toLowerCase().replace(/\s+/g, "");
  if (key.includes("tmoney") || key.includes("t-money")) return <TMoney size={size} />;
  if (key.includes("moov"))   return <MoovMoney size={size} />;
  if (key.includes("mtn"))    return <MTNMoney size={size} />;
  if (key.includes("orange")) return <OrangeMoney size={size} />;
  if (key.includes("wave"))   return <Wave size={size} />;
  if (key.includes("wizall")) return <Wizall size={size} />;
  if (key.includes("vodacom"))return <Vodacom size={size} />;
  if (key.includes("airtel")) return <Airtel size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#6b7280" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="Arial,sans-serif">
        {operator.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}
