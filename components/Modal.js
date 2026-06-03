'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer }) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[#2a2a35] bg-[#1a1a23] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Top colored bar */}
            <div className="h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2a2a35] px-5 py-4">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full border border-[#2a2a35] text-zinc-500 transition-colors hover:bg-[#22222d] hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex justify-end gap-3 border-t border-[#2a2a35] px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
