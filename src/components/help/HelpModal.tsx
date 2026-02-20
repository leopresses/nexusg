/**
 * HelpModal.tsx
 * Premium SaaS-style help modal with step list.
 * Renders as a Dialog (desktop) with mobile-friendly sizing.
 */
import { X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface HelpStep {
  text: string;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  steps: HelpStep[];
}

export function HelpModal({ isOpen, onClose, title, subtitle, steps }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="
              fixed z-50
              left-1/2 top-1/2
              -translate-x-1/2 -translate-y-1/2
              w-[90vw] max-w-md
              bg-white rounded-2xl shadow-2xl
              overflow-hidden
            "
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-6 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
                  <p className="text-sm text-blue-100 mt-1 leading-snug">{subtitle}</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar ajuda"
                  className="
                    ml-4 mt-0.5
                    flex-shrink-0
                    rounded-full p-1.5
                    text-white/70 hover:text-white hover:bg-white/15
                    transition-colors
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className="
                      mt-0.5 flex-shrink-0
                      h-5 w-5 flex items-center justify-center
                      rounded-full bg-blue-600 text-white
                      text-[10px] font-bold
                    "
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-snug">{step.text}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={onClose}
                className="
                  flex items-center gap-1.5
                  px-4 py-2
                  rounded-xl
                  bg-blue-600 text-white
                  text-sm font-bold
                  hover:bg-blue-700
                  transition-colors
                "
              >
                Entendi <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
