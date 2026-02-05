import { NextResponse } from 'next/server';
import { setCaption, getCaptions } from '@/lib/storage';

/**
 * GET /api/captions
 * Get all user-edited captions
 */
export async function GET() {
  const captions = await getCaptions();
  return NextResponse.json(captions);
}

/**
 * POST /api/captions
 * Update a photo caption
 * Body: { photoId: string, caption: string }
 */
export async function POST(request: Request) {
  try {
    const { photoId, caption } = await request.json();

    if (!photoId || typeof caption !== 'string') {
      return NextResponse.json(
        { error: 'photoId and caption required' },
        { status: 400 }
      );
    }

    await setCaption(photoId, caption);

    return NextResponse.json({ success: true, photoId, caption });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update caption' },
      { status: 500 }
    );
  }
}
