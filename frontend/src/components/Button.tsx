import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-content hover:bg-primary/80 focus:ring-primary disabled:bg-primary/50",
  secondary:
    "bg-base-300 text-base-content hover:bg-base-300/80 focus:ring-base-300 dark:bg-dark-base-300 dark:text-dark-base-content dark:hover:bg-dark-base-300/80",
  danger:
    "bg-error text-primary-content hover:bg-error/80 focus:ring-error disabled:bg-error/50",
  ghost:
    "bg-transparent text-base-content/70 hover:bg-base-200 focus:ring-base-300 dark:text-dark-base-content dark:hover:bg-dark-base-200",
};

export default function Button({
  variant = "primary",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
