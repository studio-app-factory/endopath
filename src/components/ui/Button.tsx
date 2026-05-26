import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97D7D]/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        {
          primary:
            'bg-gradient-to-br from-[#C97D7D] to-[#8B3D52] text-[#FFFAF5] shadow-lg shadow-[#C97D7D]/20 hover:shadow-xl hover:shadow-[#C97D7D]/30 hover:-translate-y-0.5 active:translate-y-0',
          secondary:
            'bg-[#3D1A24]/6 text-[#3D1A24] hover:bg-[#3D1A24]/8 border border-[#E8D5CC]',
          ghost:
            'text-[#7A5560] hover:bg-[#3D1A24]/5 hover:text-[#3D1A24]',
          outline:
            'border border-[#E8D5CC] text-[#3D1A24]/85 hover:bg-[#3D1A24]/5',
          danger:
            'bg-gradient-to-br from-[#8B3D52] to-[#6B2939] text-[#FFFAF5] shadow-lg shadow-[#8B3D52]/20 hover:shadow-xl hover:shadow-[#8B3D52]/25',
        }[variant],
        {
          sm: 'px-3.5 py-2 text-sm gap-1.5',
          md: 'px-5 py-2.5 text-sm gap-2',
          lg: 'px-7 py-3.5 text-base gap-2.5',
        }[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
