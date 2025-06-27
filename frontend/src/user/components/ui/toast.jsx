import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, ...toast };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((props) => {
    return addToast(props);
  }, [addToast]);

  // Convenience methods
  toast.success = (title, description) => addToast({ title, description, variant: "success" });
  toast.error = (title, description) => addToast({ title, description, variant: "destructive" });
  toast.warning = (title, description) => addToast({ title, description, variant: "warning" });
  toast.info = (title, description) => addToast({ title, description, variant: "info" });

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const variants = {
    default: "bg-white border-gray-200",
    success: "bg-green-50 border-green-200",
    destructive: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200"
  };

  const iconVariants = {
    default: { icon: FiInfo, color: "text-gray-600" },
    success: { icon: FiCheck, color: "text-green-600" },
    destructive: { icon: FiAlertCircle, color: "text-red-600" },
    warning: { icon: FiAlertTriangle, color: "text-yellow-600" },
    info: { icon: FiInfo, color: "text-blue-600" }
  };

  const variant = toast.variant || "default";
  const IconComponent = iconVariants[variant].icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm ${variants[variant]}`}
    >
      <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconVariants[variant].color}`} />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {toast.title}
          </div>
        )}
        {toast.description && (
          <div className="text-sm text-gray-600">
            {toast.description}
          </div>
        )}
      </div>
      
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <FiX className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
};

export { Toast };