'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NameInput } from './NameInput';
import { SubmitButton } from './SubmitButton';

export function HomeForm() {
  const router = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const valid = a.trim().length > 0 && b.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const params = new URLSearchParams({ a: a.trim(), b: b.trim() });
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-12 max-w-xl mx-auto py-24 px-6"
    >
      <div>
        <h1 className="text-5xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          La concordance des prénoms
        </h1>
        <p
          className="text-lg italic"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-ink-soft)' }}
        >
          Deux prénoms, une résonance racontée par les nombres.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <NameInput id="name-a" label="Premier prénom" value={a} onChange={setA} />
        <NameInput id="name-b" label="Second prénom" value={b} onChange={setB} />
      </div>

      <SubmitButton disabled={!valid} />
    </form>
  );
}
