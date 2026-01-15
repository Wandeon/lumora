// src/app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGalleryByCode } from '@/application/gallery/queries/get-gallery-by-code';
import { GalleryCode } from '@/core/gallery';

// GET /api/photos?code=SCDY0028
// Matches xmas.artemi-media.hr API pattern
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Gallery code is required' },
      { status: 400 }
    );
  }

  // Validate code format
  const codeResult = GalleryCode.create(code);
  if (!codeResult.success) {
    return NextResponse.json(
      { error: 'Invalid gallery code format' },
      { status: 400 }
    );
  }

  const gallery = await getGalleryByCode(codeResult.value.value);

  if (!gallery) {
    return NextResponse.json(
      { error: 'Gallery not found or expired' },
      { status: 404 }
    );
  }

  return NextResponse.json(gallery);
}
