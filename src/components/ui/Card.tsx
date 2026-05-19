import { cn } from '@/utils/cn';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl transition-all duration-200',
        {
          default: 'bg-white/4 border border-white/8 backdrop-blur-sm',
          elevated: 'bg-white/6 border border-white/10 shadow-xl shadow-rose-400/10',
          outlined: 'bg-transparent border border-white/12',
        }[variant],
        {
          none: '',
          sm: 'p-3',
          md: 'p-5',
          lg: 'p-7',
        }[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
