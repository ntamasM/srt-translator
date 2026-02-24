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
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <AlertCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const bgColors: Record<ToastType, string> = {
  success:
    "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800",
  error: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800",
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
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
