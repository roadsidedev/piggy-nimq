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
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-medium text-gray-600">{children}</h3>;
}

export function CardValue({ children }: { children: ReactNode }) {
  return <p className="text-2xl font-semibold text-gray-900">{children}</p>;
}
