import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(score: number) {
  if (score >= 0.7) return "text-red-400";
  if (score >= 0.4) return "text-yellow-400";
  return "text-green-400";
}

export function getRiskBg(score: number) {
  if (score >= 0.7) return "bg-red-500";
  if (score >= 0.4) return "bg-yellow-500";
  return "bg-green-500";
}

export function getRiskLabel(score: number) {
  if (score >= 0.7) return "Critical";
  if (score >= 0.4) return "High";
  return "Low";
}

export function formatDeadline(deadline: string) {
  const d = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `${diff} days left`;
}