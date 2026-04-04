import { NextRequest, NextResponse } from 'next/server';

const MARBLE_API_KEY = process.env.MARBLE_API_KEY;

export async function POST(req: NextRequest) {
  if (!MARBLE_API_KEY) {
    return NextResponse.json(
      { error: 'MARBLE_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch('https://api.worldlabs.ai/marble/v1/worlds:generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'WLT-Api-Key': MARBLE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Marble generate failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate world from World Labs', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Marble proxy generate error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
