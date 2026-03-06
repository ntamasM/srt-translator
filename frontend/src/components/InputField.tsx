import React from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function InputField({
  label,
  error,
  hint,
  id,
  className = "",
  ...rest
}: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, "-");
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-base-content/80 dark:text-dark-base-content"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-base-200 dark:text-dark-base-content ${
          error
            ? "border-error focus:ring-error"
            : "border-base-300 dark:border-dark-base-300"
        }`}
        {...rest}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
