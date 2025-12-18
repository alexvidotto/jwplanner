import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0;
};

export const formatTotalTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};
