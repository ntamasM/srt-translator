import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  hint?: string;
}

export default function SelectField({
  label,
  options,
  error,
  hint,
  id,
  className = "",
  ...rest
}: SelectFieldProps) {
  const selectId = id || label.toLowerCase().replace(/\s/g, "-");
  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className="mb-1 block text-sm font-medium text-base-content/80 dark:text-dark-base-content"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-base-200 dark:text-dark-base-content ${
          error
            ? "border-error focus:ring-error"
            : "border-base-300 dark:border-dark-base-300"
        }`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="mt-1 text-xs text-base-content/60 dark:text-dark-base-content/50">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
