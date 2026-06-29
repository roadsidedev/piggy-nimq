import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
