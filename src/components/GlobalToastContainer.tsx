import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface GlobalToastContainerProps {
  limit?: number;
}

export const GlobalToastContainer: React.FC<GlobalToastContainerProps> = ({ limit = 1 }) => {
  const { toasts, removeToast } = useApp();
  const visibleToasts = toasts.slice(0, limit);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4" dir="rtl">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const borderStyle = isError
            ? 'border-red-500/40 text-red-100'
            : isWarning
            ? 'border-amber-500/40 text-amber-100'
            : 'border-emerald-500/30 text-white';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`pointer-events-auto backdrop-blur-md flex items-center gap-2 py-2 px-4 rounded-full bg-slate-900/90 shadow-xl text-sm border ${borderStyle}`}
            >
              <div className="shrink-0 flex items-center justify-center">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              <span className="font-medium text-sm leading-none whitespace-nowrap">
                {toast.message || toast.title}
              </span>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10 shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

