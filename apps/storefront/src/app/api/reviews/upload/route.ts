import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { saveReviewPhoto } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to upload review photos' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    const url = await saveReviewPhoto(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Review photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload review image' }, { status: 500 });
  }
}

