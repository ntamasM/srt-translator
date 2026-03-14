import React, { useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-neutral/40" onClick={onClose} />
      {/* dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-base-100 p-6 shadow-xl dark:bg-dark-base-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content dark:text-dark-base-content">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-base-content/50 hover:bg-base-200 hover:text-base-content/70 dark:text-dark-base-content/70 dark:hover:bg-dark-base-300 dark:hover:text-dark-base-content"
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-base-content/80 dark:text-dark-base-content">
          {children}
        </div>
        {actions && (
          <div className="mt-6 flex justify-end gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
