import { ImageResponse } from 'next/og';
import { computeScore, InvalidNameError } from '@/lib/scoring';
import { OgVisual } from '@/lib/og/image';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const a = searchParams.get('a');
  const b = searchParams.get('b');

  if (!a || !b) {
    return new Response('missing names', { status: 400 });
  }

  try {
    const result = computeScore(a, b);
    return new ImageResponse(
      (
        <OgVisual
          a={result.inputs.a}
          b={result.inputs.b}
          percentage={result.percentage}
          tagline={result.tagline}
        />
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    if (err instanceof InvalidNameError) {
      return new Response('invalid name', { status: 422 });
    }
    throw err;
  }
}
