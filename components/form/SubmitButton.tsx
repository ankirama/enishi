'use client';

interface SubmitButtonProps {
  disabled: boolean;
}

export function SubmitButton({ disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="px-6 py-3 rounded-xl font-medium transition-all"
      style={{
        background: disabled ? 'rgba(43,39,51,0.25)' : 'var(--color-ink)',
        color: 'var(--color-cream)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Calculer →
    </button>
  );
}
