import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    px-10 py-4
    text-[11px] tracking-[3px] uppercase font-medium
    transition-all duration-300
    disabled:cursor-not-allowed disabled:opacity-30
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-transparent border border-[var(--border-primary)]
      text-[var(--accent-primary)]
      hover:border-[var(--accent-primary)] hover:opacity-100
      opacity-80
    `,
    secondary: `
      bg-[var(--accent-primary)]
      text-[var(--bg-primary)]
      hover:opacity-90
      opacity-100
    `,
    ghost: `
      bg-transparent
      text-[var(--text-secondary)]
      hover:text-[var(--accent-primary)]
      opacity-80
    `
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
