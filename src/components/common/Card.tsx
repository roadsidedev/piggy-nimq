import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-neutral-800 bg-neutral-900 p-4 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-medium text-neutral-400">{children}</h3>;
}

export function CardValue({ children }: { children: ReactNode }) {
  return <p className="text-2xl font-semibold text-white">{children}</p>;
}
