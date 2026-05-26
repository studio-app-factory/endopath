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
          default: 'bg-[#FFFAF5] border border-[#E8D5CC]/70 backdrop-blur-sm',
          elevated: 'bg-[#3D1A24]/5 border border-[#E8D5CC] shadow-xl shadow-[#C97D7D]/8',
          outlined: 'bg-transparent border border-[#E8D5CC]',
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
