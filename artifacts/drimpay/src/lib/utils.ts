import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortId(id: number): string {
  const n = Math.imul(id, 0x9e3779b9) >>> 0;
  return n.toString(16).padStart(8, "0").slice(0, 6);
}
