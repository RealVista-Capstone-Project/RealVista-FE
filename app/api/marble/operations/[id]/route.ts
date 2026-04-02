import { NextRequest, NextResponse } from 'next/server';

const MARBLE_API_KEY = process.env.MARBLE_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!MARBLE_API_KEY) {
    return NextResponse.json({ error: 'MARBLE_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const response = await fetch(`https://api.marblehq.com/api/v1/operations/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': MARBLE_API_KEY,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch operation from Marble', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Marble proxy get operation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
