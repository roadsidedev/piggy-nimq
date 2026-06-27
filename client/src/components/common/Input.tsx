import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label className="text-sm font-medium text-neutral-300">{label}</label>
        ) : null}
        <input
          ref={ref}
          className={`rounded-lg border bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 ${
            error ? "border-red-500" : "border-neutral-700"
          } ${className}`}
          {...props}
        />
        {error ? <span className="text-xs text-red-400">{error}</span> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
