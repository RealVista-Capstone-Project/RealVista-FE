import { NextRequest, NextResponse } from 'next/server';

const MARBLE_API_KEY = process.env.MARBLE_API_KEY;

export async function POST(req: NextRequest) {
  if (!MARBLE_API_KEY) {
    return NextResponse.json({ error: 'MARBLE_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const formData = await req.formData();

    // We forward the formData completely to Marble
    const response = await fetch('https://api.marblehq.com/api/v1/media/upload', {
      method: 'POST',
      headers: {
        'x-api-key': MARBLE_API_KEY,
        // Let fetch automatically handle Content-Type for formData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to upload to Marble', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Marble proxy upload error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
