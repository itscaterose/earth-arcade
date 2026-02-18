import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="label-text block mb-3">
          {label}
        </label>
      )}
      <input
        className={`
          w-full p-4
          bg-transparent
          border border-[var(--border-secondary)]
          text-[var(--text-primary)]
          placeholder:text-[var(--text-tertiary)]
          focus:border-[var(--border-primary)]
          focus:outline-none
          transition-colors duration-300
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
