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
        'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        {
          primary:
            'bg-gradient-to-br from-rose-400 to-amber-400 text-[#1A0E13] shadow-lg shadow-rose-400/30 hover:shadow-xl hover:shadow-rose-400/40 hover:-translate-y-0.5 active:translate-y-0',
          secondary:
            'bg-white/8 text-white hover:bg-white/12 border border-white/10',
          ghost:
            'text-white/65 hover:bg-white/6 hover:text-white',
          outline:
            'border border-white/15 text-white/85 hover:bg-white/6',
          danger:
            'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40',
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
