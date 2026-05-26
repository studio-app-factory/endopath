import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#3D1A24]/40 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          'relative z-10 bg-[#FFFAF5] border border-[#E8D5CC] rounded-3xl shadow-2xl shadow-[#8B3D52]/15 w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95',
          {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            full: 'max-w-2xl',
          }[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-xl font-semibold text-[#3D1A24] font-['Cormorant_Garamond']">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#3D1A24]/6 text-[#7A5560]/85 hover:text-[#3D1A24] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
