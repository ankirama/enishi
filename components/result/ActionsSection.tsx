import Link from 'next/link';
import { ShareButton } from './ShareButton';

export function ActionsSection() {
  return (
    <section className="text-center" style={{ padding: '60px 40px 90px' }}>
      <div className="inline-flex gap-3 flex-wrap justify-center">
        <ShareButton />
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-medium"
          style={{
            background: 'white',
            color: 'var(--color-ink)',
            boxShadow: '0 1px 2px rgba(60,40,50,0.06)',
          }}
        >
          Tester deux autres prénoms
        </Link>
      </div>
    </section>
  );
}
