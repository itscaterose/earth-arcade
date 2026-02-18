import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="label-text block mb-3">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full p-4
          bg-transparent
          border border-[var(--border-secondary)]
          text-[var(--text-primary)]
          placeholder:text-[var(--text-tertiary)]
          focus:border-[var(--border-primary)]
          focus:outline-none
          transition-colors duration-300
          resize-none
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
