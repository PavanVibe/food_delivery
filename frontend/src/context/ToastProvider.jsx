import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./contexts";
import "./toast.css";

let nextId = 1;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const notify = useCallback(
    (message, type = "info") => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      notify,
      success: (message) => notify(message, "success"),
      error: (message) => notify(message, "error"),
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button key={toast.id} className={`toast toast-${toast.type}`} onClick={() => dismiss(toast.id)}>
            <span className="toast-icon">{toast.type === "error" ? "!" : toast.type === "success" ? "✓" : "i"}</span>
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
