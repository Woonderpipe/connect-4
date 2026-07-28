import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toArabicNumerals(val: string | number, isArabic: boolean) {
  if (!isArabic) return val.toString();
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return val.toString().replace(/[0-9]/g, (w) => arabicNumerals[+w]);
}
