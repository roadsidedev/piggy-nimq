interface ToggleProps {
  enabled: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}

export function Toggle({ enabled, onToggle, disabled = false, size = "md", label }: ToggleProps) {
  const trackSize = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumbSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const translateX = size === "sm" ? "translate-x-4" : "translate-x-5";
  const thumbTranslate = size === "sm" ? "translate-x-0.5" : "translate-x-0.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${trackSize} ${
        enabled ? "bg-mint-400" : "bg-gray-300"
      }`}
    >
      <span
        className={`${thumbSize} pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-700 ${
          enabled ? translateX : thumbTranslate
        }`}
      />
    </button>
  );
}
