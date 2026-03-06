import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-success" />,
  error: <AlertCircle size={18} className="text-error" />,
  info: <Info size={18} className="text-primary-500" />,
};

const bgColors: Record<ToastType, string> = {
  success:
    "bg-success/10 border-success/30 dark:bg-dark-success/20 dark:border-dark-success/30",
  error: "bg-error/10 border-error/30 dark:bg-dark-error/20 dark:border-dark-error/30",
  info: "bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all ${bgColors[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-sm text-base-content dark:text-dark-base-content">
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 text-base-content/50 hover:text-base-content/70 dark:hover:text-base-content/40"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
