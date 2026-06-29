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
          <label className="text-sm font-medium text-gray-700">{label}</label>
        ) : null}
        <input
          ref={ref}
          className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-300 ${
            error ? "border-red-400" : "border-gray-200"
          } ${className}`}
          {...props}
        />
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
