import type { CSSProperties } from 'react';

export interface OgProps {
  a: string;
  b: string;
  percentage: number;
  tagline: string;
}

const wrap: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(165deg, #FBF5F2 0%, #F5E6E1 100%)',
  fontFamily: 'serif',
  color: '#2b2733',
  padding: 80,
};

export function OgVisual({ a, b, percentage, tagline }: OgProps) {
  return (
    <div style={wrap}>
      <div style={{ fontSize: 28, color: '#b56a7a', letterSpacing: 8, textTransform: 'uppercase', marginBottom: 24 }}>
        Enishi
      </div>
      <div style={{ fontSize: 64, fontStyle: 'italic', display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <span>{a}</span>
        <span style={{ color: '#b56a7a' }}>&amp;</span>
        <span>{b}</span>
      </div>
      <div style={{ width: 60, height: 1, background: '#b56a7a', opacity: 0.5, margin: '36px 0' }} />
      <div style={{ fontSize: 220, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex', alignItems: 'flex-start' }}>
        <span>{percentage}</span>
        <span style={{ fontSize: 96, color: '#b56a7a', fontStyle: 'italic', marginLeft: 8 }}>%</span>
      </div>
      <div style={{ fontSize: 32, fontStyle: 'italic', color: '#8a7a85', marginTop: 24 }}>{tagline}</div>
    </div>
  );
}
