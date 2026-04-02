import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const serviceApiKey = process.env.SERVICE_API_KEY;
  const aiApiUrl = process.env.AI_API_URL || 'http://localhost:3001';

  if (!serviceApiKey) {
    return NextResponse.json(
      { error: 'SERVICE_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const aiFormData = new FormData();
    aiFormData.append('file', file);

    const response = await fetch(`${aiApiUrl}/ai/analyze-quality`, {
      method: 'POST',
      headers: {
        'x-api-key': serviceApiKey,
      },
      body: aiFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error outside of AI' },
      { status: 500 }
    );
  }
}
