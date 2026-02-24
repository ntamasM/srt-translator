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
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600"
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
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
