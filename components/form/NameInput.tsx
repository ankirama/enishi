'use client';
import type { ChangeEvent } from 'react';

interface NameInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}

const ALLOWED = /[\p{L}\s\-']/u;

export function NameInput({ id, label, value, onChange }: NameInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
      .split('')
      .filter((ch) => ALLOWED.test(ch))
      .join('')
      .slice(0, 50);
    onChange(next);
  }
  return (
    <label htmlFor={id} className="flex flex-col gap-2 w-full">
      <span
        className="text-xs uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}
      >
        {label}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck={false}
        className="text-3xl bg-transparent border-b py-2 outline-none focus:border-current transition-colors"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-ink)',
          borderColor: 'var(--color-accent-soft)',
        }}
      />
    </label>
  );
}
