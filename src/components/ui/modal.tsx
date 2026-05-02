"use client";

import { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string | ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, title, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn("relative w-full max-w-lg rounded-2xl bg-white shadow-xl", className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-orange-100 px-6 py-4">
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            ) : (
              <div className="text-lg font-semibold text-gray-900">{title}</div>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-orange-50 transition-colors" aria-label="Close">
              <svg className="h-5 w-5 text-text-secondary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
